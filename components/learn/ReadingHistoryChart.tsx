"use client";

import { useMemo } from "react";
import type { ReadingLogEntry } from "@/lib/learn/analytics";
import { formatLocalDateLabel, localDateIso } from "@/lib/localDate";

export function ReadingHistoryChart({ log }: { log: ReadingLogEntry[] }) {
  const today = localDateIso();

  const days = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(localDateIso(d), 0);
    }
    for (const entry of log) {
      const at = new Date(entry.logged_at);
      const key = localDateIso(at);
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + entry.pages_delta);
    }
    return [...map.entries()];
  }, [log]);

  const max = Math.max(1, ...days.map(([, v]) => v));

  return (
    <section className="ln-reading-chart" aria-label="Reading history">
      <h3 className="ln-reading-chart-title">Pages read (14 days)</h3>
      <div className="ln-reading-chart-bars">
        {days.map(([date, pages]) => (
          <div
            key={date}
            className={`ln-reading-chart-col${date === today ? " ln-reading-chart-col--today" : ""}`}
            title={`${formatLocalDateLabel(date, { today })}: ${pages} pages`}
          >
            <div
              className="ln-reading-chart-bar"
              style={{ height: `${Math.round((pages / max) * 100)}%` }}
            />
            <span className="ln-reading-chart-label">
              {formatLocalDateLabel(date, { today })}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
