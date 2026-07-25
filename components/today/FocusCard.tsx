"use client";

import type { DayTask } from "@/lib/today/taskTypes";
import { dayProgress } from "@/lib/today/timeline";
import { haptic } from "@/lib/finance/haptics";

interface FocusCardProps {
  focus: DayTask | null;
  tasks: DayTask[];
  onSetFocus: () => void;
  onToggle: (task: DayTask) => void;
}

export function FocusCard({ focus, tasks, onSetFocus, onToggle }: FocusCardProps) {
  const progress = dayProgress(tasks);

  if (!focus) {
    return (
      <button type="button" className="td-focus td-focus-empty" onClick={onSetFocus}>
        <span className="td-focus-label">Today&apos;s focus</span>
        <span className="td-focus-title">Set your main goal</span>
        <span className="td-focus-hint">Tap to choose what matters most today</span>
      </button>
    );
  }

  return (
    <div className="td-focus">
      <div className="td-focus-top">
        <span className="td-focus-label">Today&apos;s focus</span>
        <span className="td-focus-pct">{progress}%</span>
      </div>
      <button
        type="button"
        className={`td-focus-title-btn ${focus.completed ? "done" : ""}`}
        onClick={() => {
          haptic("light");
          onToggle(focus);
        }}
      >
        <span className={`td-focus-check ${focus.completed ? "on" : ""}`} aria-hidden />
        {focus.title}
      </button>
      <div className="td-focus-bar" aria-hidden>
        <div className="td-focus-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <button type="button" className="td-focus-edit" onClick={onSetFocus}>
        Edit focus
      </button>
    </div>
  );
}
