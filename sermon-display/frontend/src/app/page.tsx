import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-6 text-zinc-100">
      <h1 className="font-serif text-3xl font-semibold">Sermon Display</h1>
      <p className="max-w-md text-center text-sm text-zinc-400">
        Open the operator panel on the media laptop, and the display page
        full-screen on the projector.
      </p>
      <div className="flex gap-3">
        <Link
          href="/operator"
          className="rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
        >
          Operator
        </Link>
        <Link
          href="/display"
          className="rounded border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          Display
        </Link>
      </div>
    </main>
  );
}
