"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { QuestionRow } from "@/lib/types";
import { AttendeeQuestion } from "./AttendeeQuestion";

type Session = { id: string; code: string; title: string; ended: boolean };

const NAME_KEY = (sessionId: string) => `atr:name:${sessionId}`;
const ID_KEY = (sessionId: string) => `atr:attendee:${sessionId}`;
const QIDS_KEY = (attendeeId: string) => `atr:qids:${attendeeId}`;

export function AttendeeRoom({ session: initialSession }: { session: Session }) {
  const [session, setSession] = useState<Session>(initialSession);
  const [name, setName] = useState<string | null>(null);
  const [attendeeId, setAttendeeId] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState<"ai" | "trainer" | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem(NAME_KEY(session.id));
    const savedId = localStorage.getItem(ID_KEY(session.id));
    if (savedName) setName(savedName);
    if (savedId) setAttendeeId(savedId);
    setBootstrapped(true);
  }, [session.id]);

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

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`session:${session.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${session.id}` },
        (payload) => {
          const row = payload.new as { id: string; status: string };
          setSession((prev) => ({ ...prev, ended: row.status === "ended" }));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id]);

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

  async function submitQuestion(path: "ai" | "trainer") {
    if (!attendeeId || !draft.trim() || submitting) return;
    setSubmitting(path);
    setSubmitError(null);
    const body = draft.trim();
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, attendeeId, body, path }),
      });
      if (res.ok) {
        const { question } = await res.json();
        const next = [question as QuestionRow, ...questions];
        setQuestions(next);
        const ids = next.map((q) => q.id);
        localStorage.setItem(QIDS_KEY(attendeeId), JSON.stringify(ids));
        setDraft("");
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 404 && /not live|unavailable/i.test(data?.error ?? "")) {
          setSubmitError("This session has ended — your trainer closed it.");
          setSession((prev) => ({ ...prev, ended: true }));
        } else {
          setSubmitError(data?.error || "Couldn't send. Try again in a moment.");
        }
      }
    } catch {
      setSubmitError("Network issue. Check your connection and try again.");
    } finally {
      setSubmitting(null);
      composerRef.current?.focus();
    }
  }

  async function resolveQuestion(id: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, status: "resolved", resolved_at: new Date().toISOString() } : q
      )
    );
    await fetch(`/api/questions/${id}/resolve`, { method: "POST" });
  }

  async function escalateQuestion(id: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, status: "escalated", escalated_at: new Date().toISOString() } : q
      )
    );
    await fetch(`/api/questions/${id}/escalate`, { method: "POST" });
  }

  if (!bootstrapped) return null;

  if (session.ended && (!attendeeId || questions.length === 0)) {
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
    <main className={`mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-6 ${session.ended ? "pb-12" : "pb-48"}`}>
      <header className="mb-5 animate-fade-in">
        <div className="flex items-center gap-2">
          {session.ended ? (
            <span className="chip bg-ink-200 text-ink-700">Ended</span>
          ) : (
            <span className="chip bg-emerald-50 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
              Live
            </span>
          )}
          <span className="text-xs text-ink-500">Code {session.code}</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">
          {session.title}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {session.ended
            ? `Hi ${name} — this session has ended. Your questions and replies are below.`
            : `Hi ${name} — ask the AI for an instant answer, or send it to your trainer.`}
        </p>
      </header>

      <section className="space-y-3">
        {questions.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-3xl animate-sparkle">✨</div>
            <p className="mt-2 font-medium text-ink-700">No questions yet.</p>
            <p className="mt-1 text-sm text-ink-500">
              Type below — pick AI for instant, or trainer for personal.
            </p>
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

      {!session.ended && (
        <Composer
          ref={composerRef}
          value={draft}
          onChange={setDraft}
          onSubmit={submitQuestion}
          submitting={submitting}
          error={submitError}
        />
      )}
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
        <p className="mt-2 text-sm text-ink-500">
          Pop in your first name to join.
        </p>
      </header>
      <section className="card-raised animate-slide-up p-6">
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
        <p className="mt-3 text-center text-xs text-ink-500">
          Only the trainer sees your name.
        </p>
      </section>
    </main>
  );
}

type ComposerProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (path: "ai" | "trainer") => void;
  submitting: "ai" | "trainer" | null;
  error: string | null;
};

const Composer = forwardRef<HTMLTextAreaElement, ComposerProps>(function Composer(
  { value, onChange, onSubmit, submitting, error },
  ref
) {
  const ready = value.trim().length > 0;
  const busy = submitting !== null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/60 bg-white/85 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-md">
      <div className="mx-auto w-full max-w-md space-y-2">
        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-xs font-medium text-red-700 animate-slide-up">
            {error}
          </div>
        )}
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask anything…"
          rows={2}
          className="input max-h-32 min-h-[56px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSubmit("ai");
            }
          }}
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSubmit("ai")}
            disabled={busy || !ready}
            className="btn-accent"
            aria-label="Get an AI answer"
          >
            {submitting === "ai" ? (
              <>
                <SpinDots />
                Thinking…
              </>
            ) : (
              <>
                <SparkleIcon />
                Get AI Answer
              </>
            )}
          </button>
          <button
            onClick={() => onSubmit("trainer")}
            disabled={busy || !ready}
            className="btn-warm"
            aria-label="Ask the trainer"
          >
            {submitting === "trainer" ? (
              <>
                <SpinDots />
                Sending…
              </>
            ) : (
              <>
                <PlaneIcon />
                Ask the trainer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
      <path d="M19 14l.9 2.6L22.5 17.5l-2.6.9L19 21l-.9-2.6L15.5 17.5l2.6-.9L19 14z" opacity=".7" />
    </svg>
  );
}

function PlaneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M2.5 11.5L21 3l-8.5 18.5-2-7.5-8-2.5z" />
    </svg>
  );
}

function SpinDots() {
  return (
    <span className="flex gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse [animation-delay:120ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse [animation-delay:240ms]" />
    </span>
  );
}
