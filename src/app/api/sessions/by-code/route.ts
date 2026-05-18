import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.toUpperCase();
  if (!code || code.length < 3) {
    return NextResponse.json({ error: "Code required." }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("sessions")
    .select("id, code, title, status")
    .eq("code", code)
    .single();

  if (!data) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json(data);
}
