"use client";

import { haptic } from "@/lib/finance/haptics";
import { parseDayDate } from "@/lib/today/timeline";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function weekAround(centerIso: string): string[] {
  const center = parseDayDate(centerIso);
  const start = new Date(center);
  start.setDate(center.getDate() - center.getDay());
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${day}`);
  }
  return days;
}

interface DayStripProps {
  selected: string;
  onSelect: (iso: string) => void;
}

export function DayStrip({ selected, onSelect }: DayStripProps) {
  const days = weekAround(selected);
  const selectedDate = parseDayDate(selected);
  const monthLabel = selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="td-day-strip-wrap">
      <p className="td-day-month">{monthLabel}</p>
      <div className="td-day-strip" role="tablist" aria-label="Select day">
        {days.map((iso) => {
          const d = parseDayDate(iso);
          const active = iso === selected;
          const isToday = iso === new Date().toISOString().slice(0, 10);
          return (
            <button
              key={iso}
              type="button"
              role="tab"
              aria-selected={active}
              className={`td-day-cell ${active ? "active" : ""} ${isToday ? "today" : ""}`}
              onClick={() => {
                haptic("light");
                onSelect(iso);
              }}
            >
              <span className="td-day-letter">{DAY_LETTERS[d.getDay()]}</span>
              <span className="td-day-num">{d.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
