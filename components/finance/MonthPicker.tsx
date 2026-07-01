"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { currentMonthISO, monthLabel, shiftMonth } from "@/lib/finance/monthFilter";

export function MonthPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const now = currentMonthISO();
  const canGoForward = value < now;

  return (
    <div className="rv-month-picker">
      <button
        type="button"
        className="rv-month-btn"
        aria-label="Previous month"
        onClick={() => onChange(shiftMonth(value, -1))}
      >
        <ChevronLeft size={18} />
      </button>
      <span className="rv-month-label">{monthLabel(value)}</span>
      <button
        type="button"
        className="rv-month-btn"
        aria-label="Next month"
        disabled={!canGoForward}
        onClick={() => canGoForward && onChange(shiftMonth(value, 1))}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
