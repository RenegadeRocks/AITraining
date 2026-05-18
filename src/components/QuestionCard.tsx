"use client";

import { useState } from "react";
import type { QuestionRow } from "@/lib/types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  pending: { label: "Thinking…", classes: "bg-ink-100 text-ink-600" },
  answered: { label: "AI answered", classes: "bg-accent-50 text-accent-700" },
  resolved: { label: "Resolved", classes: "bg-emerald-50 text-emerald-700" },
  escalated: { label: "For you", classes: "bg-red-50 text-red-700" },
  replied: { label: "You replied", classes: "bg-indigo-50 text-indigo-700" },
};

export function QuestionCard({
  question,
  isNew,
  onReply,
}: {
  question: QuestionRow;
  isNew: boolean;
  onReply: (text: string) => Promise<void>;
}) {
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(question.status === "escalated");

  const style = STATUS_STYLES[question.status] ?? STATUS_STYLES.pending;

  async function submit() {
    if (!reply.trim()) return;
    setSubmitting(true);
    await onReply(reply.trim());
    setSubmitting(false);
    setReply("");
  }

  return (
    <article className={["card p-5", isNew ? "animate-slide-up" : ""].join(" ")}>
      <header className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-700">
            {question.attendee_name}
          </p>
          <p className="text-xs text-ink-400">{timeAgo(question.created_at)} ago</p>
        </div>
        <span className={`chip ${style.classes}`}>{style.label}</span>
      </header>

      <p className="whitespace-pre-wrap text-ink-900">{question.body}</p>

      {question.ai_answer && (
        <div className="mt-4">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs font-medium text-ink-500 hover:text-ink-700"
          >
            {expanded ? "Hide AI answer" : "Show AI answer"}
          </button>
          {expanded && (
            <div className="mt-2 rounded-xl border border-ink-200 bg-ink-50/60 p-4 text-sm text-ink-700 whitespace-pre-wrap">
              {question.ai_answer}
            </div>
          )}
        </div>
      )}

      {question.host_reply && (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-indigo-600">
            Your reply
          </p>
          <p className="whitespace-pre-wrap text-sm text-indigo-900">{question.host_reply}</p>
        </div>
      )}

      {question.status === "escalated" && (
        <div className="mt-4 space-y-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply (sent live to the attendee)…"
            rows={3}
            className="input resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={submit}
              disabled={submitting || !reply.trim()}
              className="btn-accent text-sm"
            >
              {submitting ? "Sending…" : "Send reply"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
