"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { VerseDisplay } from "@/components/VerseDisplay";
import { useDisplaySocket } from "@/hooks/useDisplaySocket";
import {
  fetchTranslations,
  pushChapter,
  pushClear,
  pushVerse,
} from "@/lib/api";
import { BIBLE_BOOKS, filterBooks } from "@/lib/books";
import type { ConnectionStatus } from "@/lib/types";

function StatusDot({ status }: { status: ConnectionStatus }) {
  const color =
    status === "connected"
      ? "bg-emerald-500"
      : status === "connecting"
        ? "bg-amber-400"
        : "bg-red-500";
  const label =
    status === "connected"
      ? "Connected"
      : status === "connecting"
        ? "Connecting…"
        : "Disconnected";

  return (
    <div className="flex items-center gap-2 text-sm text-zinc-300">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}

export default function OperatorPage() {
  const { status, message } = useDisplaySocket();

  const [translations, setTranslations] = useState<string[]>([
    "KJV",
    "NKJV",
    "NLT",
    "AMP",
    "MSG",
  ]);
  const [translation, setTranslation] = useState("KJV");
  const [book, setBook] = useState("Romans");
  const [chapter, setChapter] = useState("8");
  const [verse, setVerse] = useState("28");
  const [bookOpen, setBookOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const bookWrapRef = useRef<HTMLDivElement>(null);

  const bookSuggestions = useMemo(() => filterBooks(book).slice(0, 12), [book]);

  useEffect(() => {
    let cancelled = false;
    fetchTranslations()
      .then((list) => {
        if (cancelled || !list.length) return;
        setTranslations(list);
        setTranslation((prev) => (list.includes(prev) ? prev : list[0]));
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!bookWrapRef.current?.contains(e.target as Node)) {
        setBookOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function onPush(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const chapterNum = Number(chapter);
    const verseTrim = verse.trim();
    const verseNum = verseTrim === "" ? null : Number(verseTrim);

    try {
      if (!book.trim()) throw new Error("Book is required");
      if (!Number.isInteger(chapterNum) || chapterNum < 1) {
        throw new Error("Chapter must be a positive integer");
      }
      if (verseNum !== null && (!Number.isInteger(verseNum) || verseNum < 1)) {
        throw new Error("Verse must be a positive integer (or leave blank)");
      }

      if (verseNum === null) {
        await pushChapter({
          translation,
          book: book.trim(),
          chapter: chapterNum,
        });
        setLastAction(`Pushed chapter ${book.trim()} ${chapterNum} (${translation})`);
      } else {
        await pushVerse({
          translation,
          book: book.trim(),
          chapter: chapterNum,
          verse: verseNum,
        });
        setLastAction(
          `Pushed ${book.trim()} ${chapterNum}:${verseNum} (${translation})`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onClear() {
    setError(null);
    setBusy(true);
    try {
      await pushClear();
      setLastAction("Cleared display");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_1.1fr]">
        <section className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Operator Control
              </h1>
              <p className="text-xs text-zinc-400">
                Push scripture to the projector display
              </p>
            </div>
            <StatusDot status={status} />
          </div>

          <form onSubmit={onPush} className="space-y-3">
            <label className="block text-xs font-medium text-zinc-400">
              Translation
              <select
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                className="mt-1 w-full rounded border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
              >
                {translations.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <div ref={bookWrapRef} className="relative">
              <label className="block text-xs font-medium text-zinc-400">
                Book
                <input
                  value={book}
                  onChange={(e) => {
                    setBook(e.target.value);
                    setBookOpen(true);
                  }}
                  onFocus={() => setBookOpen(true)}
                  autoComplete="off"
                  list={undefined}
                  className="mt-1 w-full rounded border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
                  placeholder="e.g. Romans"
                />
              </label>
              {bookOpen && bookSuggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded border border-zinc-600 bg-zinc-950 py-1 shadow-lg">
                  {bookSuggestions.map((name) => (
                    <li key={name}>
                      <button
                        type="button"
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-zinc-800"
                        onClick={() => {
                          setBook(name);
                          setBookOpen(false);
                        }}
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-zinc-400">
                Chapter
                <input
                  type="number"
                  min={1}
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
                  required
                />
              </label>
              <label className="block text-xs font-medium text-zinc-400">
                Verse{" "}
                <span className="font-normal text-zinc-500">(blank = chapter)</span>
                <input
                  type="number"
                  min={1}
                  value={verse}
                  onChange={(e) => setVerse(e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
                  placeholder="optional"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                disabled={busy}
                className="rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
              >
                Push to Display
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onClear}
                className="rounded border border-zinc-500 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
              >
                Clear Display
              </button>
            </div>
          </form>

          {error && (
            <p className="mt-3 rounded border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
          {lastAction && !error && (
            <p className="mt-3 text-xs text-zinc-400">{lastAction}</p>
          )}

          <details className="mt-5 text-xs text-zinc-500">
            <summary className="cursor-pointer text-zinc-400">
              Quick books ({BIBLE_BOOKS.length})
            </summary>
            <div className="mt-2 flex max-h-40 flex-wrap gap-1 overflow-y-auto">
              {BIBLE_BOOKS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setBook(name)}
                  className="rounded border border-zinc-700 px-1.5 py-0.5 hover:border-amber-600 hover:text-amber-200"
                >
                  {name}
                </button>
              ))}
            </div>
          </details>
        </section>

        <section className="flex flex-col rounded-lg border border-zinc-700 bg-zinc-800/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">Live preview</h2>
            <a
              href="/display"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-amber-300 hover:underline"
            >
              Open /display ↗
            </a>
          </div>
          <div className="min-h-[320px] flex-1 overflow-hidden rounded border border-zinc-700">
            <VerseDisplay message={message} variant="preview" />
          </div>
        </section>
      </div>
    </main>
  );
}
