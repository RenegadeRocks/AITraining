import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { generateHostKey, generateSessionCode } from "@/lib/codes";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title required." }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  // Try up to 5 times to find a free code.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateSessionCode(4);
    const hostKey = generateHostKey();
    const { data, error } = await supabase
      .from("sessions")
      .insert({ code, host_key: hostKey, title })
      .select("code, host_key")
      .single();

    if (!error && data) {
      return NextResponse.json({ code: data.code, hostKey: data.host_key });
    }

    // Unique violation → try a different code.
    const isUniqueViolation = error?.code === "23505";
    if (!isUniqueViolation) {
      return NextResponse.json(
        { error: "Couldn't create session." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Couldn't allocate a code." }, { status: 503 });
}
