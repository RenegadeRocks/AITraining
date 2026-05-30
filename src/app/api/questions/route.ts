import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { answerQuestion } from "@/lib/llm";
import type { QuestionRow, SessionRow, AttendeeRow } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const sessionId: string | undefined = body?.sessionId;
  const attendeeId: string | undefined = body?.attendeeId;
  const questionBody = typeof body?.body === "string" ? body.body.trim() : "";
  const path: "ai" | "trainer" = body?.path === "trainer" ? "trainer" : "ai";

  if (!sessionId || !attendeeId || !questionBody) {
    return NextResponse.json(
      { error: "sessionId, attendeeId, and body required." },
      { status: 400 }
    );
  }
  if (questionBody.length > 1500) {
    return NextResponse.json({ error: "Question is too long." }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const [{ data: session }, { data: attendee }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, title, status")
      .eq("id", sessionId)
      .single<Pick<SessionRow, "id" | "title" | "status">>(),
    supabase
      .from("attendees")
      .select("id, name, session_id")
      .eq("id", attendeeId)
      .single<Pick<AttendeeRow, "id" | "name" | "session_id">>(),
  ]);

  if (!session || session.status !== "live") {
    return NextResponse.json(
      { error: "Session not live.", code: "session_ended" },
      { status: 404 }
    );
  }
  if (!attendee || attendee.session_id !== sessionId) {
    return NextResponse.json({ error: "Attendee not in session." }, { status: 403 });
  }

  const now = new Date().toISOString();
  const initialStatus = path === "trainer" ? "escalated" : "pending";
  const { data: created, error } = await supabase
    .from("questions")
    .insert({
      session_id: sessionId,
      attendee_id: attendeeId,
      attendee_name: attendee.name,
      body: questionBody,
      status: initialStatus,
      escalated_at: path === "trainer" ? now : null,
    })
    .select("*")
    .single<QuestionRow>();
  if (error || !created) {
    return NextResponse.json({ error: "Couldn't save question." }, { status: 500 });
  }

  if (path === "trainer") {
    return NextResponse.json({ question: created });
  }

  let aiAnswer: string;
  try {
    aiAnswer = await answerQuestion(questionBody, session.title);
  } catch (e) {
    console.error("AI answer failed:", e);
    aiAnswer =
      "I couldn't generate an answer right now. Tap 'Ask the trainer' to send this to your trainer.";
  }

  const { data: updated, error: updateError } = await supabase
    .from("questions")
    .update({
      ai_answer: aiAnswer,
      status: "answered",
      answered_at: new Date().toISOString(),
    })
    .eq("id", created.id)
    .select("*")
    .single<QuestionRow>();

  if (updateError) {
    console.error("Failed to persist AI answer to DB:", updateError);
  }

  // If the DB UPDATE failed, the row stays at status='pending' server-side, but
  // we hand the client a row that reflects what actually happened (we did get
  // an AI answer) so the UI doesn't spin forever. The realtime channel will
  // also not fire in that case — the client response is the source of truth.
  return NextResponse.json({
    question:
      updated ?? {
        ...created,
        ai_answer: aiAnswer,
        status: "answered" as const,
        answered_at: new Date().toISOString(),
      },
  });
}
