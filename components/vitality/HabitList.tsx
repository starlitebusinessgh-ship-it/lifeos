"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import type { Habit } from "@/lib/vitality/types";
import { habitStreak } from "@/lib/vitality/types";
import type { HabitCompletion } from "@/lib/vitality/types";
import { haptic } from "@/lib/finance/haptics";

export function HabitList({
  habits,
  completions,
  allCompletions,
  dayDate,
  onToggle,
}: {
  habits: Habit[];
  completions: HabitCompletion[];
  allCompletions: HabitCompletion[];
  dayDate: string;
  onToggle: (id: number) => void;
}) {
  const doneSet = new Set(completions.map((c) => c.habit_id));
  const doneCount = habits.filter((h) => doneSet.has(h.id)).length;

  return (
    <section className="vt-habits" aria-label="Daily habits">
      <div className="vt-habits-head">
        <h2 className="vt-section-title">Habits</h2>
        {habits.length > 0 && (
          <span className="vt-habits-count">
            {doneCount}/{habits.length} today
          </span>
        )}
      </div>
      {habits.length === 0 ? (
        <p className="vt-habits-empty">Add habits to track what matters daily.</p>
      ) : (
        <ul className="vt-habit-list">
          {habits.map((h) => {
            const done = doneSet.has(h.id);
            const streak = habitStreak(h.id, allCompletions, dayDate);
            return (
              <li key={h.id}>
                <motion.button
                  type="button"
                  className={`vt-habit-row ${done ? "done" : ""}`}
                  onClick={() => {
                    haptic(done ? "light" : "success");
                    onToggle(h.id);
                  }}
                  whileTap={{ scale: 0.98 }}
                  style={{ "--habit-color": h.color } as CSSProperties}
                >
                  <span
                    className={`vt-habit-check ${done ? "checked" : ""}`}
                    aria-hidden
                  >
                    {done && <Check size={14} strokeWidth={3} />}
                  </span>
                  <span className="vt-habit-icon" aria-hidden>
                    {h.icon}
                  </span>
                  <span className="vt-habit-name">{h.name}</span>
                  {streak > 1 && <span className="vt-habit-streak">{streak}d</span>}
                </motion.button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
