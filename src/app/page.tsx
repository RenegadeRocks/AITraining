import Link from "next/link";
import { JoinForm } from "@/components/JoinForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-12 pb-10">
      <header className="mb-10 animate-fade-in">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-ink-700 shadow-sm backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse-soft" />
          Ask Anytime
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-ink-900">
          Your AI training{" "}
          <span className="bg-gradient-to-r from-accent-600 via-accent-500 to-warm-500 bg-clip-text text-transparent">
            question hub
          </span>
          .
        </h1>
        <p className="mt-3 text-ink-500">
          Get an instant answer from AI, or send your question to the trainer —
          live, while the session is running.
        </p>
      </header>

      <section className="card-raised animate-slide-up p-6">
        <div className="label">Join a session</div>
        <JoinForm />
      </section>

      <div className="mt-10 text-center text-sm text-ink-500 animate-fade-in">
        Running the session?{" "}
        <Link href="/host" className="font-medium text-ink-800 underline-offset-4 hover:underline">
          Create a session
        </Link>
      </div>
    </main>
  );
}
