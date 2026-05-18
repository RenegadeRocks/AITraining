"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function JoinForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length < 4) {
      setError("Codes are 4 letters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/by-code?code=${encodeURIComponent(cleaned)}`);
      if (!res.ok) {
        setError("That session code doesn't exist or has ended.");
        setLoading(false);
        return;
      }
      router.push(`/s/${cleaned}`);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        autoFocus
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        placeholder="e.g. KITE"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
        className="input text-center text-3xl font-semibold tracking-[0.4em]"
        maxLength={4}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-accent w-full" disabled={loading || code.length < 4}>
        {loading ? "Joining…" : "Enter session"}
      </button>
    </form>
  );
}
