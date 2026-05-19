import Link from "next/link";
import { JoinForm } from "@/components/JoinForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-12 pb-10 sm:max-w-lg sm:pt-20">
      <header className="mb-10 animate-fade-in">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-ink-700 shadow-sm backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse-soft" />
          Ask Anytime
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink-900 sm:text-6xl">
          Your AI training{" "}
          <span className="bg-gradient-to-r from-accent-600 via-accent-500 to-warm-500 bg-clip-text text-transparent">
            question hub
          </span>
          .
        </h1>
        <p className="mt-4 text-pretty text-ink-500 sm:text-lg">
          Get an instant answer from AI, or send your question to the trainer —
          live, while the session is running.
        </p>
      </header>

      <section className="card-raised animate-slide-up p-6 sm:p-7">
        <div className="label">Join a session</div>
        <JoinForm />
      </section>

      <div className="mt-8 animate-fade-in text-center text-sm text-ink-500">
        <Link href="/host" className="btn-ghost inline-flex w-full sm:w-auto sm:px-6">
          I&apos;m running the session
        </Link>
      </div>
    </main>
  );
}
