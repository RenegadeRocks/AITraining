"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { QuestionRow, SessionRow } from "@/lib/types";
import { QuestionCard } from "./QuestionCard";

type Filter = "escalated" | "all" | "resolved";

export function HostDashboard({
  session,
  initialQuestions,
}: {
  session: SessionRow;
  initialQuestions: QuestionRow[];
}) {
  const [questions, setQuestions] = useState<QuestionRow[]>(initialQuestions);
  const [filter, setFilter] = useState<Filter>("escalated");
  const [showShare, setShowShare] = useState(false);
  const initialIdsRef = useRef(new Set(initialQuestions.map((q) => q.id)));

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`host:${session.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "questions", filter: `session_id=eq.${session.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as QuestionRow;
            setQuestions((prev) => (prev.some((q) => q.id === row.id) ? prev : [row, ...prev]));
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as QuestionRow;
            setQuestions((prev) => prev.map((q) => (q.id === row.id ? row : q)));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id]);

  const counts = useMemo(() => {
    const escalated = questions.filter(
      (q) => q.status === "escalated" || q.status === "replied"
    ).length;
    const resolved = questions.filter((q) => q.status === "resolved").length;
    return { escalated, resolved, all: questions.length };
  }, [questions]);

  const filtered = useMemo(() => {
    if (filter === "escalated")
      return questions.filter((q) => q.status === "escalated" || q.status === "replied");
    if (filter === "resolved") return questions.filter((q) => q.status === "resolved");
    return questions;
  }, [questions, filter]);

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/s/${session.code}`
      : `/s/${session.code}`;

  async function reply(questionId: string, text: string) {
    const res = await fetch(`/api/questions/${questionId}/reply`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-host-key": session.host_key },
      body: JSON.stringify({ reply: text }),
    });
    if (res.ok) {
      const { question } = await res.json();
      setQuestions((prev) => prev.map((q) => (q.id === question.id ? question : q)));
    }
  }

  const pendingEscalated = counts.escalated;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pt-6 pb-24">
      <header className="mb-5 animate-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-400">Host view</p>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
              {session.title}
            </h1>
          </div>
          <button onClick={() => setShowShare((s) => !s)} className="btn-ghost text-xs">
            {showShare ? "Hide" : "Share"}
          </button>
        </div>

        {showShare && (
          <div className="card mt-4 p-5 animate-slide-up">
            <div className="label">Session code</div>
            <div className="flex items-center justify-center rounded-xl bg-ink-900 px-6 py-6 text-5xl font-bold tracking-[0.4em] text-white">
              {session.code}
            </div>
            <p className="mt-3 text-center text-sm text-ink-500">{joinUrl}</p>
            <button
              onClick={() => navigator.clipboard?.writeText(joinUrl)}
              className="btn-ghost mt-3 w-full text-sm"
            >
              Copy link
            </button>
            <p className="mt-3 text-xs text-ink-400">
              Bookmark <span className="font-medium text-ink-600">this</span> page —
              it&apos;s your private host dashboard. Don&apos;t share the URL with attendees.
            </p>
          </div>
        )}
      </header>

      <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-ink-200/60 bg-ink-50/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <FilterChip
            active={filter === "escalated"}
            onClick={() => setFilter("escalated")}
            label="For you"
            count={pendingEscalated}
            tone="alert"
          />
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="All"
            count={counts.all}
          />
          <FilterChip
            active={filter === "resolved"}
            onClick={() => setFilter("resolved")}
            label="Resolved"
            count={counts.resolved}
          />
        </div>
      </div>

      <section className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState filter={filter} code={session.code} />
        ) : (
          filtered.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              isNew={!initialIdsRef.current.has(q.id)}
              onReply={(text) => reply(q.id, text)}
            />
          ))
        )}
      </section>
    </main>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone?: "alert";
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "chip border transition",
        active
          ? "bg-ink-900 text-white border-ink-900"
          : "bg-white text-ink-600 border-ink-200 hover:bg-ink-50",
      ].join(" ")}
    >
      {tone === "alert" && count > 0 && (
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      )}
      <span>{label}</span>
      <span
        className={[
          "rounded-full px-1.5 text-[10px] font-semibold",
          active ? "bg-white/15 text-white" : "bg-ink-100 text-ink-500",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyState({ filter, code }: { filter: Filter; code: string }) {
  return (
    <div className="card flex flex-col items-center justify-center p-10 text-center">
      <div className="mb-3 text-3xl">💬</div>
      <p className="text-ink-700 font-medium">
        {filter === "escalated"
          ? "No questions need you yet."
          : filter === "resolved"
          ? "No questions resolved yet."
          : "No questions yet."}
      </p>
      <p className="mt-1 text-sm text-ink-500">
        Share code <span className="font-mono font-semibold text-ink-700">{code}</span> with the room.
      </p>
    </div>
  );
}
