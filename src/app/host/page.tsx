import { CreateSessionForm } from "@/components/CreateSessionForm";
import Link from "next/link";

export default function HostHomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-12 pb-10">
      <header className="mb-10 animate-fade-in">
        <Link href="/" className="text-xs text-ink-500 hover:text-ink-800">
          ← Back
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink-900">
          Create a session
        </h1>
        <p className="mt-2 text-ink-500">
          You&apos;ll get a 4-letter code to share with the room, and a private
          trainer dashboard to bookmark.
        </p>
      </header>

      <section className="card-raised animate-slide-up p-6">
        <CreateSessionForm />
      </section>
    </main>
  );
}
