"use client";

import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import {
  fetchReadingGoal,
  goalLabel,
  saveReadingGoal,
  syncGoalToToday,
  type ReadingGoal,
  type ReadingGoalType,
} from "@/lib/learn/readingGoalsStore";
import type { ReadingStats } from "@/lib/learn/analytics";
import { haptic } from "@/lib/finance/haptics";

export function ReadingGoalBar({ stats }: { stats: ReadingStats }) {
  const [goal, setGoal] = useState<ReadingGoal | null>(null);
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState(20);

  useEffect(() => {
    void fetchReadingGoal().then(setGoal);
  }, []);

  const progress =
    goal?.goal_type === "pages_per_day"
      ? Math.min(100, Math.round((stats.pagesThisWeek / Math.max(1, goal.target_value * 7)) * 100))
      : 0;

  async function save(type: ReadingGoalType) {
    const row = await saveReadingGoal(type, target);
    if (row) {
      setGoal(row);
      setEditing(false);
      await syncGoalToToday(row);
      haptic("success");
    }
  }

  return (
    <section className="ln-reading-goal">
      <div className="ln-reading-goal-head">
        <Target size={16} />
        <h3>Daily reading goal</h3>
      </div>
      {goal && !editing ? (
        <>
          <p>{goalLabel(goal)}</p>
          <div className="ln-reading-goal-bar">
            <div className="ln-reading-goal-fill" style={{ width: `${progress}%` }} />
          </div>
          <button type="button" onClick={() => setEditing(true)}>
            Change goal
          </button>
        </>
      ) : (
        <div className="ln-reading-goal-form">
          <input
            type="number"
            min={1}
            max={500}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            aria-label="Pages per day"
          />
          <button type="button" onClick={() => void save("pages_per_day")}>
            Set {target} pages/day
          </button>
        </div>
      )}
    </section>
  );
}
