"use client";

import type { ReadingStats } from "@/lib/learn/analytics";
import { statsHeadline } from "@/lib/learn/analytics";

export function LearnStatsBar({ stats }: { stats: ReadingStats }) {
  return (
    <section className="ln-stats-bar" aria-label="Reading stats">
      <p className="ln-stats-headline">{statsHeadline(stats)}</p>
      <div className="ln-stats-grid">
        <div className="ln-stat">
          <span className="ln-stat-value">{stats.pagesThisWeek}</span>
          <span className="ln-stat-label">Pages this week</span>
        </div>
        <div className="ln-stat">
          <span className="ln-stat-value">{stats.activeDaysThisWeek}</span>
          <span className="ln-stat-label">Active days</span>
        </div>
        <div className="ln-stat">
          <span className="ln-stat-value">{stats.streakDays}</span>
          <span className="ln-stat-label">Day streak</span>
        </div>
        <div className="ln-stat">
          <span className="ln-stat-value">{stats.finishedThisMonth}</span>
          <span className="ln-stat-label">Finished this month</span>
        </div>
      </div>
    </section>
  );
}
