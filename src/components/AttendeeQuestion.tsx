"use client";

import { useState } from "react";
import type { QuestionRow } from "@/lib/types";

export function AttendeeQuestion({
  question,
  onResolve,
  onEscalate,
}: {
  question: QuestionRow;
  onResolve: () => Promise<void>;
  onEscalate: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<"resolve" | "escalate" | null>(null);

  async function handle(kind: "resolve" | "escalate") {
    setBusy(kind);
    try {
      if (kind === "resolve") await onResolve();
      else await onEscalate();
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="card animate-slide-up p-5">
      <p className="text-sm font-medium text-ink-500">You asked</p>
      <p className="mt-1 whitespace-pre-wrap text-ink-900">{question.body}</p>

      <div className="mt-4">
        {question.status === "pending" && <ThinkingBlock />}

        {question.ai_answer && (
          <div className="rounded-xl border border-accent-200/70 bg-accent-50/40 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="chip bg-accent-500 text-white">AI</span>
              <span className="text-xs text-ink-500">Answer</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-ink-800">{question.ai_answer}</p>
          </div>
        )}

        {(question.status === "answered" || question.status === "pending") &&
          question.ai_answer && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => handle("resolve")}
                disabled={busy !== null}
                className="btn bg-emerald-500 text-white hover:bg-emerald-600"
              >
                {busy === "resolve" ? "…" : "Got it — thanks"}
              </button>
              <button
                onClick={() => handle("escalate")}
                disabled={busy !== null}
                className="btn-ghost"
              >
                {busy === "escalate" ? "…" : "I need a human"}
              </button>
            </div>
          )}

        {question.status === "resolved" && (
          <p className="mt-3 text-xs font-medium text-emerald-700">✓ Resolved</p>
        )}

        {question.status === "escalated" && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-900">
            <p className="font-medium">Sent to the instructor.</p>
            <p className="text-xs">They&apos;ll reply here — this page updates live.</p>
          </div>
        )}

        {question.status === "replied" && question.host_reply && (
          <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="chip bg-indigo-500 text-white">Instructor</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-indigo-900">
              {question.host_reply}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function ThinkingBlock() {
  return (
    <div className="flex items-center gap-2 text-sm text-ink-500">
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-pulse" />
        <span className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-pulse [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-pulse [animation-delay:240ms]" />
      </span>
      Thinking…
    </div>
  );
}
