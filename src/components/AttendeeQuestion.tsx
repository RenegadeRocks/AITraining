"use client";

import { useState } from "react";
import type { QuestionRow } from "@/lib/types";
import { Markdown } from "@/lib/markdown";

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

  const hasAi = Boolean(question.ai_answer);
  const isWaitingForAi = question.status === "pending";
  const isWaitingForTrainer = question.status === "escalated" && !question.host_reply;
  const isReplied = question.status === "replied" || Boolean(question.host_reply);
  const isResolved = question.status === "resolved";
  const canMarkResolved =
    !isResolved && (question.status === "answered" || isReplied);
  const canStillAskTrainer = question.status === "answered";

  return (
    <article className="card animate-slide-up p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-ink-500">
        You asked
      </p>
      <p className="mt-1 whitespace-pre-wrap text-ink-900">{question.body}</p>

      {isWaitingForAi && (
        <div className="mt-4 rounded-xl border border-accent-200 bg-accent-50/70 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="chip bg-accent-500 text-white">
              <SparkleSmall />
              AI
            </span>
            <span className="text-xs font-medium text-accent-700">
              Thinking…
            </span>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-5/6 rounded shimmer animate-shimmer" />
            <div className="h-3 w-4/6 rounded shimmer animate-shimmer" />
            <div className="h-3 w-3/6 rounded shimmer animate-shimmer" />
          </div>
        </div>
      )}

      {hasAi && question.ai_answer && (
        <div className="mt-4 rounded-xl border border-accent-200/80 bg-accent-50/50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="chip bg-accent-500 text-white">
              <SparkleSmall />
              AI
            </span>
            <span className="text-xs font-medium text-accent-700">Answer</span>
          </div>
          <Markdown text={question.ai_answer} className="prose-answer" />
        </div>
      )}

      {isWaitingForTrainer && !hasAi && (
        <div className="mt-4 rounded-xl border border-warm-200 bg-warm-50/80 p-4">
          <div className="mb-1 flex items-center gap-2">
            <span className="chip bg-warm-500 text-white">
              <PlaneSmall />
              Sent
            </span>
            <span className="text-xs font-medium text-warm-700">
              Waiting for your trainer…
            </span>
          </div>
          <p className="text-sm text-warm-900/80">
            They&apos;ll reply right here — this page updates live.
          </p>
        </div>
      )}

      {isWaitingForTrainer && hasAi && (
        <div className="mt-3 rounded-xl border border-warm-200 bg-warm-50/70 p-3 text-sm text-warm-900">
          <p className="font-medium">Sent to your trainer.</p>
          <p className="text-xs">They&apos;ll reply here — this page updates live.</p>
        </div>
      )}

      {isReplied && question.host_reply && (
        <div className="mt-4 rounded-xl border border-warm-300/70 bg-warm-50/80 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="chip bg-warm-500 text-white">
              <UserSmall />
              Trainer
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-warm-900">
            {question.host_reply}
          </p>
        </div>
      )}

      {(canMarkResolved || canStillAskTrainer) && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {canMarkResolved && (
            <button
              onClick={() => handle("resolve")}
              disabled={busy !== null}
              className="btn-emerald"
            >
              {busy === "resolve" ? "…" : "Got it — thanks"}
            </button>
          )}
          {canStillAskTrainer && (
            <button
              onClick={() => handle("escalate")}
              disabled={busy !== null}
              className="btn-ghost"
            >
              {busy === "escalate" ? "…" : "Ask the trainer"}
            </button>
          )}
        </div>
      )}

      {isResolved && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckSmall /> Resolved
        </p>
      )}
    </article>
  );
}

function SparkleSmall() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
    </svg>
  );
}

function PlaneSmall() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M2.5 11.5L21 3l-8.5 18.5-2-7.5-8-2.5z" />
    </svg>
  );
}

function UserSmall() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

function CheckSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
