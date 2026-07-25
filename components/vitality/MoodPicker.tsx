"use client";

import { MOOD_LEVELS, type MoodValue } from "@/lib/vitality/types";
import { haptic } from "@/lib/finance/haptics";

export function MoodPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (m: MoodValue) => void;
}) {
  return (
    <div className="vt-mood-row" role="radiogroup" aria-label="How are you feeling?">
      {MOOD_LEVELS.map((m) => {
        const active = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={`vt-mood-btn ${active ? "active" : ""}`}
            onClick={() => {
              haptic("light");
              onChange(m.value);
            }}
          >
            <span className="vt-mood-emoji" aria-hidden>
              {m.emoji}
            </span>
            <span className="vt-mood-label">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
