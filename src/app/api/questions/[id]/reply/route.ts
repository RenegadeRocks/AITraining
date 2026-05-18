import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const hostKey = req.headers.get("x-host-key");
  if (!hostKey) {
    return NextResponse.json({ error: "Missing host key." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const reply = typeof body?.reply === "string" ? body.reply.trim() : "";
  if (!reply) {
    return NextResponse.json({ error: "Reply required." }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const { data: question } = await supabase
    .from("questions")
    .select("id, session_id")
    .eq("id", params.id)
    .single();
  if (!question) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", question.session_id)
    .eq("host_key", hostKey)
    .single();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { data: updated, error } = await supabase
    .from("questions")
    .update({
      host_reply: reply,
      status: "replied",
      replied_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select("*")
    .single();
  if (error || !updated) {
    return NextResponse.json({ error: "Couldn't reply." }, { status: 500 });
  }

  return NextResponse.json({ question: updated });
}
