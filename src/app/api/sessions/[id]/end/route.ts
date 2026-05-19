import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { SessionRow } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const hostKey = req.headers.get("x-host-key");
  if (!hostKey) {
    return NextResponse.json({ error: "Host key required." }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, host_key")
    .eq("id", params.id)
    .single<Pick<SessionRow, "id" | "host_key">>();

  if (!session || session.host_key !== hostKey) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", params.id)
    .select("*")
    .single<SessionRow>();

  if (error || !data) {
    return NextResponse.json({ error: "Couldn't end session." }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}
