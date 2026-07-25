"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  computeReadingStats,
  type ReadingLogEntry,
  type ReadingStats,
} from "./analytics";

export function useReadingAnalytics(booksCount: number) {
  const [log, setLog] = useState<ReadingLogEntry[]>([]);
  const [highlightsThisWeek, setHighlightsThisWeek] = useState(0);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const since = new Date();
    since.setDate(since.getDate() - 60);

    const [logRes, hlRes] = await Promise.all([
      supabase
        .from("library_reading_log")
        .select("id, book_id, pages_delta, page_end, logged_at")
        .gte("logged_at", since.toISOString())
        .order("logged_at", { ascending: false }),
      supabase
        .from("library_highlights")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekStartIso()),
    ]);

    if (!logRes.error && logRes.data) setLog(logRes.data as ReadingLogEntry[]);
    setHighlightsThisWeek(hlRes.count ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (booksCount === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void reload();
  }, [reload, booksCount]);

  return { log, highlightsThisWeek, loading, reload };
}

function weekStartIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function useReadingStats(
  books: import("./types").LibraryBook[],
  log: ReadingLogEntry[],
  highlightsThisWeek: number
): ReadingStats {
  return computeReadingStats(books, log, highlightsThisWeek);
}
