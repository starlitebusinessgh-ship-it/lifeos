"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const CAPTURE_TYPES = [
  { value: "decision", label: "Decision" },
  { value: "journal", label: "Journal" },
  { value: "lesson", label: "Lesson" },
  { value: "idea", label: "Idea" },
  { value: "note", label: "Note" },
  { value: "prayer", label: "Prayer" },
  { value: "book_note", label: "Book Note" },
  { value: "goal_update", label: "Goal Update" },
  { value: "reflection", label: "Reflection" },
  { value: "other", label: "Other" },
] as const;

const LIFE_AREAS = [
  "Finance",
  "Health",
  "Career",
  "Learning",
  "Spiritual",
  "Relationships",
  "General",
] as const;

type Entry = {
  id: string;
  capture_type: string;
  life_area: string;
  content: string;
  created_at: string;
};

function formatCaptureType(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const selectClassName =
  "h-14 w-full rounded-xl border border-zinc-300 bg-white px-4 text-lg text-zinc-900 outline-none transition-colors focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800";

export default function EntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [captureTypeFilter, setCaptureTypeFilter] = useState("All");
  const [lifeAreaFilter, setLifeAreaFilter] = useState("All");

  useEffect(() => {
    async function fetchEntries() {
      const { data, error: fetchError } = await supabase
        .from("entries")
        .select("id, capture_type, life_area, content, created_at")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setEntries(data ?? []);
      }

      setLoading(false);
    }

    void fetchEntries();
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (
        captureTypeFilter !== "All" &&
        entry.capture_type !== captureTypeFilter
      ) {
        return false;
      }
      if (lifeAreaFilter !== "All" && entry.life_area !== lifeAreaFilter) {
        return false;
      }
      return true;
    });
  }, [entries, captureTypeFilter, lifeAreaFilter]);

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Entries
          </h1>
          <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
            Browse everything you&apos;ve captured.
          </p>
        </header>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-1 flex-col gap-2">
            <label
              htmlFor="capture_type_filter"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Type
            </label>
            <select
              id="capture_type_filter"
              value={captureTypeFilter}
              onChange={(e) => setCaptureTypeFilter(e.target.value)}
              className={selectClassName}
            >
              <option value="All">All</option>
              {CAPTURE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <label
              htmlFor="life_area_filter"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Life Area
            </label>
            <select
              id="life_area_filter"
              value={lifeAreaFilter}
              onChange={(e) => setLifeAreaFilter(e.target.value)}
              className={selectClassName}
            >
              <option value="All">All</option>
              {LIFE_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <p className="text-base text-zinc-600 dark:text-zinc-400">Loading…</p>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-base text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && filteredEntries.length === 0 && (
          <p className="rounded-xl border border-zinc-300 bg-white px-4 py-8 text-center text-base text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No entries found.
          </p>
        )}

        {!loading && !error && filteredEntries.length > 0 && (
          <ul className="flex flex-col gap-4">
            {filteredEntries.map((entry) => (
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
                    {formatDateTime(entry.created_at)}
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
