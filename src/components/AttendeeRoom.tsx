"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { QuestionRow } from "@/lib/types";
import { AttendeeQuestion } from "./AttendeeQuestion";

type Session = { id: string; code: string; title: string; ended: boolean };

const NAME_KEY = (sessionId: string) => `atr:name:${sessionId}`;
const ID_KEY = (sessionId: string) => `atr:attendee:${sessionId}`;
const QIDS_KEY = (attendeeId: string) => `atr:qids:${attendeeId}`;

export function AttendeeRoom({ session }: { session: Session }) {
  const [name, setName] = useState<string | null>(null);
  const [attendeeId, setAttendeeId] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  // bootstrap identity from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem(NAME_KEY(session.id));
    const savedId = localStorage.getItem(ID_KEY(session.id));
    if (savedName) setName(savedName);
    if (savedId) setAttendeeId(savedId);
    setBootstrapped(true);
  }, [session.id]);

  // load my own questions once we know who I am
  useEffect(() => {
    if (!attendeeId) return;
    const raw = localStorage.getItem(QIDS_KEY(attendeeId));
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (ids.length === 0) {
      setQuestions([]);
      return;
    }
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("questions")
        .select("*")
        .in("id", ids)
        .order("created_at", { ascending: false })
        .returns<QuestionRow[]>();
      setQuestions(data ?? []);
    })();
  }, [attendeeId]);

  // realtime: subscribe to changes on my own questions
  useEffect(() => {
    if (!attendeeId) return;
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`attendee:${attendeeId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "questions", filter: `attendee_id=eq.${attendeeId}` },
        (payload) => {
          const row = payload.new as QuestionRow;
          setQuestions((prev) => prev.map((q) => (q.id === row.id ? row : q)));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [attendeeId]);

  async function registerName(formName: string) {
    const trimmed = formName.trim();
    if (!trimmed) return;
    const res = await fetch("/api/attendees", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, name: trimmed }),
    });
    if (!res.ok) return;
    const { attendeeId: newId } = await res.json();
    localStorage.setItem(NAME_KEY(session.id), trimmed);
    localStorage.setItem(ID_KEY(session.id), newId);
    setName(trimmed);
    setAttendeeId(newId);
  }

  async function submitQuestion() {
    if (!attendeeId || !draft.trim() || submitting) return;
    setSubmitting(true);
    const body = draft.trim();
    setDraft("");
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, attendeeId, body }),
      });
      if (res.ok) {
        const { question } = await res.json();
        const next = [question as QuestionRow, ...questions];
        setQuestions(next);
        const ids = next.map((q) => q.id);
        localStorage.setItem(QIDS_KEY(attendeeId), JSON.stringify(ids));
      }
    } finally {
      setSubmitting(false);
      composerRef.current?.focus();
    }
  }

  async function resolveQuestion(id: string) {
    await fetch(`/api/questions/${id}/resolve`, { method: "POST" });
  }

  async function escalateQuestion(id: string) {
    await fetch(`/api/questions/${id}/escalate`, { method: "POST" });
  }

  if (!bootstrapped) return null;

  if (session.ended) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 text-center">
        <div className="text-4xl">👋</div>
        <h1 className="mt-4 text-2xl font-semibold">This session has ended.</h1>
        <p className="mt-2 text-ink-500">Thanks for taking part.</p>
      </main>
    );
  }

  if (!name || !attendeeId) {
    return <NamePrompt session={session} onSubmit={registerName} />;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-6 pb-40">
      <header className="mb-5 animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="chip bg-emerald-50 text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
            Live
          </span>
          <span className="text-xs text-ink-400">Code {session.code}</span>
        </div>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink-900">
          {session.title}
        </h1>
        <p className="mt-1 text-sm text-ink-500">Hi {name} — ask anything below.</p>
      </header>

      <section className="space-y-3">
        {questions.length === 0 ? (
          <div className="card p-8 text-center text-ink-500">
            <div className="text-3xl">✨</div>
            <p className="mt-2 font-medium text-ink-700">No questions yet.</p>
            <p className="mt-1 text-sm">Your first one will appear here.</p>
          </div>
        ) : (
          questions.map((q) => (
            <AttendeeQuestion
              key={q.id}
              question={q}
              onResolve={() => resolveQuestion(q.id)}
              onEscalate={() => escalateQuestion(q.id)}
            />
          ))
        )}
      </section>

      <Composer
        ref={composerRef}
        value={draft}
        onChange={setDraft}
        onSubmit={submitQuestion}
        submitting={submitting}
      />
    </main>
  );
}

function NamePrompt({
  session,
  onSubmit,
}: {
  session: Session;
  onSubmit: (n: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-16 pb-10">
      <header className="mb-8 animate-fade-in">
        <span className="chip bg-emerald-50 text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
          Live · {session.code}
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">
          {session.title}
        </h1>
      </header>
      <section className="card animate-slide-up p-6">
        <label className="label" htmlFor="name">Your first name</label>
        <input
          id="name"
          autoFocus
          autoComplete="given-name"
          placeholder="e.g. Priya"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input"
          maxLength={40}
          onKeyDown={(e) => e.key === "Enter" && onSubmit(value)}
        />
        <button
          onClick={() => onSubmit(value)}
          disabled={!value.trim()}
          className="btn-accent mt-4 w-full"
        >
          Join the room
        </button>
        <p className="mt-3 text-center text-xs text-ink-400">
          Only the instructor sees your name.
        </p>
      </section>
    </main>
  );
}

type ComposerProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
};

const Composer = forwardRef<HTMLTextAreaElement, ComposerProps>(function Composer(
  { value, onChange, onSubmit, submitting },
  ref
) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-200/70 bg-white/90 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-end gap-2">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask anything…"
          rows={1}
          className="input max-h-32 min-h-[48px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
        <button
          onClick={onSubmit}
          disabled={submitting || !value.trim()}
          className="btn-accent shrink-0 h-12 px-5"
          aria-label="Send question"
        >
          {submitting ? "…" : "Ask"}
        </button>
      </div>
    </div>
  );
});
