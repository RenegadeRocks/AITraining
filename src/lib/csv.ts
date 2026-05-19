import type { QuestionRow } from "./types";

const HEADERS = [
  "Asked at",
  "Attendee",
  "Question",
  "AI answer",
  "Trainer reply",
  "Final status",
  "Resolved at",
];

function csvEscape(value: string | null | undefined): string {
  if (value == null) return "";
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, "Z");
}

export function questionsToCsv(rows: QuestionRow[]): string {
  const lines = [HEADERS.map(csvEscape).join(",")];
  const sorted = [...rows].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  for (const q of sorted) {
    lines.push(
      [
        fmt(q.created_at),
        q.attendee_name,
        q.body,
        q.ai_answer ?? "",
        q.host_reply ?? "",
        q.status,
        fmt(q.resolved_at),
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}

export function downloadCsv(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function csvFilenameFor(title: string, code: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "session";
  const stamp = new Date().toISOString().slice(0, 10);
  return `ask-anytime_${slug}_${code}_${stamp}.csv`;
}
