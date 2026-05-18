import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const sessionId = body?.sessionId;
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 40) : "";
  if (!sessionId || !name) {
    return NextResponse.json({ error: "sessionId and name required." }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: session } = await supabase
    .from("sessions")
    .select("id, status")
    .eq("id", sessionId)
    .single();
  if (!session || session.status !== "live") {
    return NextResponse.json({ error: "Session unavailable." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("attendees")
    .insert({ session_id: sessionId, name })
    .select("id")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Couldn't register." }, { status: 500 });
  }

  return NextResponse.json({ attendeeId: data.id });
}
