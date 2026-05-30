"use client";

import { useEffect, useState } from "react";
import type { QuestionRow } from "@/lib/types";
import { Markdown } from "@/lib/markdown";

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

function useRelativeTime(iso: string): string {
  const [text, setText] = useState("");
  useEffect(() => {
    const update = () => setText(timeAgo(iso));
    update();
    const id = window.setInterval(update, 10_000);
    return () => window.clearInterval(id);
  }, [iso]);
  return text;
}

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  pending: { label: "Thinking…", classes: "bg-ink-100 text-ink-600" },
  answered: { label: "AI answered", classes: "bg-accent-50 text-accent-700" },
  resolved: { label: "Resolved", classes: "bg-emerald-50 text-emerald-700" },
  escalated: { label: "For you", classes: "bg-warm-100 text-warm-700" },
  replied: { label: "You replied", classes: "bg-warm-50 text-warm-700" },
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
  const ago = useRelativeTime(question.created_at);

  const style = STATUS_STYLES[question.status] ?? STATUS_STYLES.pending;
  const isDirectAsk = question.status === "escalated" && !question.ai_answer;

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
          <p className="truncate text-sm font-semibold text-ink-800">
            {question.attendee_name}
          </p>
          <p className="text-xs text-ink-400" suppressHydrationWarning>
            {ago ? `${ago} ago` : ""}
          </p>
        </div>
        <span className={`chip ${style.classes}`}>{style.label}</span>
      </header>

      <p className="whitespace-pre-wrap text-ink-900">{question.body}</p>

      {isDirectAsk && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-warm-50 px-2.5 py-1 text-xs font-medium text-warm-700">
          Sent directly — no AI answer
        </p>
      )}

      {question.ai_answer && (
        <div className="mt-4">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-800"
          >
            <ChevronIcon open={expanded} />
            {expanded ? "Hide AI answer" : "Show AI answer"}
          </button>
          {expanded && (
            <div className="mt-2 rounded-xl border border-ink-200/70 bg-ink-50/70 p-4 text-sm text-ink-800">
              <Markdown text={question.ai_answer} className="prose-answer" />
            </div>
          )}
        </div>
      )}

      {question.host_reply && (
        <div className="mt-4 rounded-xl border border-warm-300/70 bg-warm-50/80 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-warm-700">
            Your reply
          </p>
          <p className="whitespace-pre-wrap text-sm text-warm-900">{question.host_reply}</p>
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
              className="btn-warm text-sm"
            >
              {submitting ? "Sending…" : "Send reply"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${open ? "rotate-90" : ""}`}
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
