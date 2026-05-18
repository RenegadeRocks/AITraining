import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { answerQuestion } from "@/lib/anthropic";
import type { QuestionRow, SessionRow, AttendeeRow } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const sessionId: string | undefined = body?.sessionId;
  const attendeeId: string | undefined = body?.attendeeId;
  const questionBody = typeof body?.body === "string" ? body.body.trim() : "";

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
    return NextResponse.json({ error: "Session not live." }, { status: 404 });
  }
  if (!attendee || attendee.session_id !== sessionId) {
    return NextResponse.json({ error: "Attendee not in session." }, { status: 403 });
  }

  const { data: created, error } = await supabase
    .from("questions")
    .insert({
      session_id: sessionId,
      attendee_id: attendeeId,
      attendee_name: attendee.name,
      body: questionBody,
      status: "pending",
    })
    .select("*")
    .single<QuestionRow>();
  if (error || !created) {
    return NextResponse.json({ error: "Couldn't save question." }, { status: 500 });
  }

  let aiAnswer: string;
  try {
    aiAnswer = await answerQuestion(questionBody, session.title);
  } catch (e) {
    console.error("AI answer failed:", e);
    aiAnswer =
      "I couldn't generate an answer right now. Tap 'I need a human' to send this to your instructor.";
  }

  const { data: updated } = await supabase
    .from("questions")
    .update({
      ai_answer: aiAnswer,
      status: "answered",
      answered_at: new Date().toISOString(),
    })
    .eq("id", created.id)
    .select("*")
    .single<QuestionRow>();

  return NextResponse.json({ question: updated ?? { ...created, ai_answer: aiAnswer } });
}
