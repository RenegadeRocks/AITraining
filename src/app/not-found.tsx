import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 text-center">
      <div className="text-4xl">🔍</div>
      <h1 className="mt-4 text-2xl font-semibold">Not found.</h1>
      <p className="mt-2 text-ink-500">
        The session may have ended or the code is wrong.
      </p>
      <Link href="/" className="btn-ghost mt-6">Back to start</Link>
    </main>
  );
}
