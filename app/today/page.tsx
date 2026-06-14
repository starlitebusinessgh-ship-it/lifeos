"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Entry = {
  id: string;
  capture_type: string;
  life_area: string;
  content: string;
  created_at: string;
};

function getTodayBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function formatCaptureType(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TodayPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTodayEntries() {
      const { start, end } = getTodayBounds();

      const { data, error: fetchError } = await supabase
        .from("entries")
        .select("id, capture_type, life_area, content, created_at")
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setEntries(data ?? []);
      }

      setLoading(false);
    }

    void fetchTodayEntries();
  }, []);

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Today
          </h1>
          <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
            Everything you&apos;ve captured today.
          </p>
        </header>

        {loading && (
          <p className="text-base text-zinc-600 dark:text-zinc-400">Loading…</p>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-base text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && entries.length === 0 && (
          <p className="rounded-xl border border-zinc-300 bg-white px-4 py-8 text-center text-base text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            Nothing captured yet today.
          </p>
        )}

        {!loading && !error && entries.length > 0 && (
          <ul className="flex flex-col gap-4">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {formatCaptureType(entry.capture_type)}
                    </span>
                    <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {entry.life_area}
                    </span>
                  </div>
                  <time
                    dateTime={entry.created_at}
                    className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    {formatTime(entry.created_at)}
                  </time>
                </div>
                <p className="text-base leading-relaxed text-zinc-900 dark:text-zinc-50">
                  {entry.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
