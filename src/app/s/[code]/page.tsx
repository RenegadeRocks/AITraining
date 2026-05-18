import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AttendeeRoom } from "@/components/AttendeeRoom";
import type { SessionRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AttendeePage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code.toUpperCase();
  const supabase = supabaseAdmin();
  const { data: session } = await supabase
    .from("sessions")
    .select("id, code, title, status, created_at")
    .eq("code", code)
    .single<Pick<SessionRow, "id" | "code" | "title" | "status" | "created_at">>();

  if (!session) notFound();

  const ended = session.status === "ended";

  return (
    <AttendeeRoom
      session={{
        id: session.id,
        code: session.code,
        title: session.title,
        ended,
      }}
    />
  );
}
