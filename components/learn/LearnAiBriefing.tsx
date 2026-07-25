"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, Lightbulb, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { LearnInsightItem } from "@/app/api/learn-insights/route";
import type { ReadingStats } from "@/lib/learn/analytics";
import { topBooksThisWeek, type ReadingLogEntry } from "@/lib/learn/analytics";
import { dayPhase } from "@/lib/home/briefing";
import { localDateIso } from "@/lib/localDate";
import type { LibraryBook } from "@/lib/learn/types";

const TONE_ICON = {
  positive: TrendingUp,
  neutral: BookOpen,
  nudge: Lightbulb,
} as const;

export function LearnAiBriefing({
  books,
  log,
  stats,
}: {
  books: LibraryBook[];
  log: ReadingLogEntry[];
  stats: ReadingStats;
}) {
  const [insights, setInsights] = useState<LearnInsightItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const today = localDateIso();
      const top = topBooksThisWeek(log, books, 3).map((x) => ({
        title: x.book.title,
        pages: x.pages,
      }));

      const [tasksRes, inboxRes] = await Promise.all([
        supabase
          .from("lifeos_today_tasks")
          .select("completed")
          .eq("day_date", today),
        supabase
          .from("lifeos_inbox_items")
          .select("id", { count: "exact", head: true })
          .eq("archived", false),
      ]);

      const tasks = tasksRes.data ?? [];

      try {
        const res = await fetch("/api/learn-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pagesThisWeek: stats.pagesThisWeek,
            pagesLastWeek: stats.pagesLastWeek,
            activeDaysThisWeek: stats.activeDaysThisWeek,
            streakDays: stats.streakDays,
            booksTouchedThisWeek: stats.booksTouchedThisWeek,
            finishedThisMonth: stats.finishedThisMonth,
            highlightsThisWeek: stats.highlightsThisWeek,
            inProgress: stats.inProgress,
            topBooks: top,
            phase: dayPhase(),
            todayTasksTotal: tasks.length,
            todayTasksDone: tasks.filter((t) => t.completed).length,
            inboxOpen: inboxRes.count ?? 0,
            todayDate: today,
            todayLabel: new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
          }),
        });
        const data = (await res.json()) as { insights?: LearnInsightItem[] };
        if (!cancelled) setInsights(data.insights ?? []);
      } catch {
        if (!cancelled) setInsights([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [books, log, stats]);

  if (loading) {
    return (
      <section className="ln-insights-ai ln-insights-ai--loading" aria-busy="true">
        <div className="ln-insights-ai-shimmer" />
      </section>
    );
  }

  if (insights.length === 0) return null;

  const [hero, ...rest] = insights;
  const HeroIcon = TONE_ICON[hero.tone] ?? Sparkles;

  return (
    <section className="ln-insights-ai" aria-label="Reading insights">
      <article className={`ln-insights-hero ln-insights-hero--${hero.tone}`}>
        <div className="ln-insights-hero-bg" aria-hidden />
        <div className="ln-insights-hero-inner">
          <div className="ln-insights-hero-badge">
            <Sparkles size={14} strokeWidth={2.5} />
            <span>Reading insight</span>
          </div>
          <div className="ln-insights-hero-icon" aria-hidden>
            <HeroIcon size={22} strokeWidth={2} />
          </div>
          <h3 className="ln-insights-hero-title">{hero.title}</h3>
          <p className="ln-insights-hero-body">{hero.body}</p>
        </div>
      </article>

      {rest.length > 0 && (
        <div className="ln-insights-grid">
          {rest.map((item) => {
            const Icon = TONE_ICON[item.tone] ?? BookOpen;
            return (
              <article
                key={item.title}
                className={`ln-insights-card ln-insights-card--${item.tone}`}
              >
                <div className="ln-insights-card-icon" aria-hidden>
                  <Icon size={16} strokeWidth={2} />
                </div>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
