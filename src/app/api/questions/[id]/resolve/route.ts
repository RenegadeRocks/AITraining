import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("questions")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", params.id)
    .in("status", ["answered", "pending"])
    .select("*")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Couldn't resolve." }, { status: 404 });
  }
  return NextResponse.json({ question: data });
}
