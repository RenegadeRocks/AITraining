import Link from "next/link";
import { JoinForm } from "@/components/JoinForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-12 pb-10">
      <header className="mb-10 animate-fade-in">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-ink-200/80 bg-white/60 px-3 py-1 text-xs font-medium text-ink-500 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500 animate-pulse-soft" />
          Ask the Room
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
          Questions, answered — live.
        </h1>
        <p className="mt-2 text-ink-500">
          Ask anything during the training. Get an instant AI answer, or send it
          to your instructor.
        </p>
      </header>

      <section className="card animate-slide-up p-6">
        <div className="label">Join a session</div>
        <JoinForm />
      </section>

      <div className="mt-10 text-center text-sm text-ink-400 animate-fade-in">
        Running the session?{" "}
        <Link href="/host" className="font-medium text-ink-700 underline-offset-4 hover:underline">
          Create a session
        </Link>
      </div>
    </main>
  );
}
