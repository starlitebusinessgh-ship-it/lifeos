"use client";

import { Minus, Plus } from "lucide-react";
import { haptic } from "@/lib/finance/haptics";

export function SleepCard({
  hours,
  onChange,
}: {
  hours: number | null;
  onChange: (h: number) => void;
}) {
  const val = hours ?? 7;

  function step(delta: number) {
    haptic("light");
    const next = Math.min(14, Math.max(0, Math.round((val + delta) * 2) / 2));
    onChange(next);
  }

  return (
    <div className="vt-sleep-card">
      <div className="vt-sleep-head">
        <span className="vt-card-label">Sleep last night</span>
        <span className="vt-sleep-value">
          {hours !== null ? `${hours}h` : "—"}
        </span>
      </div>
      <div className="vt-sleep-controls">
        <button type="button" className="vt-step-btn" aria-label="Less sleep" onClick={() => step(-0.5)}>
          <Minus size={18} />
        </button>
        <input
          type="range"
          min={0}
          max={14}
          step={0.5}
          value={val}
          className="vt-sleep-slider"
          aria-label="Sleep hours"
          onChange={(e) => {
            haptic("light");
            onChange(Number(e.target.value));
          }}
        />
        <button type="button" className="vt-step-btn" aria-label="More sleep" onClick={() => step(0.5)}>
          <Plus size={18} />
        </button>
      </div>
      <p className="vt-sleep-hint">7–9 hours is a sweet spot for most people</p>
    </div>
  );
}
