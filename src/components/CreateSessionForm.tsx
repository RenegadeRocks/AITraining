"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateSessionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Couldn't create session.");
        setLoading(false);
        return;
      }
      const { hostKey } = await res.json();
      router.push(`/host/${hostKey}`);
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="title">Session title</label>
        <input
          id="title"
          autoFocus
          placeholder="e.g. Advanced AI Training — Day 2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          maxLength={120}
        />
        <p className="mt-2 text-xs text-ink-400">
          Shown to attendees and used by the AI as context for answers.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-accent w-full" disabled={loading || !title.trim()}>
        {loading ? "Creating…" : "Create session"}
      </button>
    </form>
  );
}
