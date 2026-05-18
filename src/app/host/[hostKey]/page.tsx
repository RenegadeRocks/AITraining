import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-server";
import { HostDashboard } from "@/components/HostDashboard";
import type { QuestionRow, SessionRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HostSessionPage({
  params,
}: {
  params: { hostKey: string };
}) {
  const supabase = supabaseAdmin();

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("host_key", params.hostKey)
    .single<SessionRow>();

  if (!session) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("session_id", session.id)
    .order("created_at", { ascending: false })
    .returns<QuestionRow[]>();

  return (
    <HostDashboard
      session={session}
      initialQuestions={questions ?? []}
    />
  );
}
