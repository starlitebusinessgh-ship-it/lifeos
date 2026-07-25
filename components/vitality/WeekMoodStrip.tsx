"use client";

import { MOOD_LEVELS, formatDayNum, formatDayShort, todayIso } from "@/lib/vitality/types";
import type { VitalityDay } from "@/lib/vitality/types";

export function WeekMoodStrip({
  weekDates,
  days,
  selected,
  onSelect,
}: {
  weekDates: string[];
  days: VitalityDay[];
  selected: string;
  onSelect: (iso: string) => void;
}) {
  const byDate = new Map(days.map((d) => [d.day_date, d]));
  const today = todayIso();

  return (
    <div className="vt-week" role="tablist" aria-label="Week">
      {weekDates.map((iso) => {
        const d = byDate.get(iso);
        const mood = d?.mood;
        const emoji = mood ? MOOD_LEVELS.find((m) => m.value === mood)?.emoji : null;
        const active = iso === selected;
        const isToday = iso === today;
        return (
          <button
            key={iso}
            type="button"
            role="tab"
            aria-selected={active}
            className={`vt-week-day ${active ? "active" : ""} ${isToday ? "today" : ""}`}
            onClick={() => onSelect(iso)}
          >
            <span className="vt-week-dow">{formatDayShort(iso)}</span>
            <span className="vt-week-num">{formatDayNum(iso)}</span>
            <span className="vt-week-mood" aria-hidden>
              {emoji ?? "·"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
