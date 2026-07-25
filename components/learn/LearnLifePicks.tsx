"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Sun, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { LifePick, LifePicksResponse } from "@/app/api/learn-life-picks/route";
import type { ReadingStats } from "@/lib/learn/analytics";
import { dayPhase } from "@/lib/home/briefing";
import { localDateIso } from "@/lib/localDate";
import { addReadingGoalToToday } from "@/lib/learn/readingGoals";
import type { LibraryBook } from "@/lib/learn/types";
import { BookSpineCard } from "./BookSpineCard";
import { haptic } from "@/lib/finance/haptics";
import { useToast } from "@/components/finance/ToastProvider";

export function LearnLifePicks({
  books,
  stats,
  onMarkWantToRead,
}: {
  books: LibraryBook[];
  stats: ReadingStats;
  onMarkWantToRead?: (bookId: string) => Promise<boolean>;
}) {
  const { showToast } = useToast();
  const [picks, setPicks] = useState<LifePick[]>([]);
  const [suggestions, setSuggestions] = useState<LifePicksResponse["suggestions"]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const today = localDateIso();

      const [tasksRes, inboxRes] = await Promise.all([
        supabase
          .from("lifeos_today_tasks")
          .select("title, completed, is_focus")
          .eq("day_date", today),
        supabase
          .from("lifeos_inbox_items")
          .select("id", { count: "exact", head: true })
          .eq("archived", false),
      ]);

      const tasks = tasksRes.data ?? [];
      const focus = tasks.find((t) => t.is_focus && !t.completed);

      try {
        const res = await fetch("/api/learn-life-picks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            books: books.map((b) => ({
              id: b.id,
              title: b.title,
              author: b.author,
              category: b.category,
              reading_state: b.reading_state,
            })),
            life: {
              phase: dayPhase(),
              todayTasksTotal: tasks.length,
              todayTasksDone: tasks.filter((t) => t.completed).length,
              todayFocus: focus?.title ?? null,
              inboxOpen: inboxRes.count ?? 0,
              pagesThisWeek: stats.pagesThisWeek,
              streakDays: stats.streakDays,
              inProgress: stats.inProgress,
              highlightsThisWeek: stats.highlightsThisWeek,
              todayDate: today,
              todayLabel: new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
            },
          }),
        });
        const data = (await res.json()) as LifePicksResponse;
        if (!cancelled) {
          setPicks(data.picks ?? []);
          setSuggestions(data.suggestions ?? []);
        }
      } catch {
        if (!cancelled) {
          setPicks([]);
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (books.length === 0) {
      setLoading(false);
      return;
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [books, stats]);

  async function addPickToToday(pick: LifePick, book: LibraryBook) {
    setActing(pick.bookId);
    const ok = await addReadingGoalToToday(`Read: ${book.title}`);
    setActing(null);
    if (ok) {
      haptic("success");
      showToast("Added reading goal to Today");
      if (onMarkWantToRead) await onMarkWantToRead(pick.bookId);
    } else {
      showToast("Could not add to Today");
    }
  }

  async function addSuggestionToToday(title: string, author: string) {
    const key = `${title}-${author}`;
    setActing(key);
    const ok = await addReadingGoalToToday(`Read: ${title}`);
    setActing(null);
    if (ok) {
      haptic("success");
      showToast("Reading goal added to Today");
    } else {
      showToast("Could not add to Today");
    }
  }

  if (loading) {
    return (
      <section className="ln-life-picks ln-life-picks--loading" aria-busy="true">
        <div className="ln-life-picks-shimmer" />
      </section>
    );
  }

  if (picks.length === 0 && (suggestions?.length ?? 0) === 0) return null;

  const byId = new Map(books.map((b) => [b.id, b]));

  return (
    <section className="ln-life-picks" aria-label="Recommended for your life right now">
      <header className="ln-life-picks-head">
        <Sparkles size={18} strokeWidth={2} />
        <div>
          <h2 className="ln-life-picks-title">For you right now</h2>
          <p className="ln-life-picks-sub">Picked for how your life is going today</p>
        </div>
      </header>

      {picks.length > 0 && (
        <div className="ln-life-picks-track">
          {picks.map((pick) => {
            const book = byId.get(pick.bookId);
            if (!book) return null;
            return (
              <div key={pick.bookId} className="ln-life-pick">
                <BookSpineCard book={book} />
                <p className="ln-life-pick-reason">{pick.reason}</p>
                <button
                  type="button"
                  className="ln-life-pick-action"
                  disabled={acting === pick.bookId}
                  onClick={() => void addPickToToday(pick, book)}
                >
                  <Sun size={14} strokeWidth={2} />
                  {acting === pick.bookId ? "Adding…" : "Read today"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <ul className="ln-life-suggestions">
          {suggestions.map((s) => {
            const key = `${s.title}-${s.author}`;
            return (
              <li key={key} className="ln-life-suggestion">
                <div>
                  <strong>{s.title}</strong>
                  <span>{s.author}</span>
                  <p>{s.reason}</p>
                </div>
                <button
                  type="button"
                  className="ln-life-suggestion-btn"
                  disabled={acting === key}
                  onClick={() => void addSuggestionToToday(s.title, s.author)}
                >
                  <Plus size={14} strokeWidth={2} />
                  {acting === key ? "…" : "Today"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
