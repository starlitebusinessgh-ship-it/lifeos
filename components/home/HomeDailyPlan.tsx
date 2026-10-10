"use client";

import Link from "next/link";
import { Check, Circle, ListTodo } from "lucide-react";
import { useDayTasks } from "@/lib/today/useDayTasks";
import { todayIso } from "@/lib/today/timeline";
import { useHabits } from "@/lib/vitality/useVitality";

export function HomeDailyPlan() {
  const day = todayIso();
  const { tasks, loading: tasksLoading, toggleComplete } = useDayTasks(day);
  const { habits, completions, loading: habitsLoading, toggleHabit } = useHabits(day);
  const openTasks = tasks.filter((task) => !task.completed);
  const visibleTasks = openTasks.slice(0, 3);
  const doneHabits = new Set(completions.map((completion) => completion.habit_id));

  return (
    <section className="hm-plan" aria-label="Today's plan">
      <div className="hm-plan-heading">
        <div>
          <p className="hm-section-label">Your day</p>
          <h2 className="hm-plan-title">
            {tasksLoading ? "Loading your plan…" : openTasks.length ? "Take the next step" : "Choose what matters today"}
          </h2>
        </div>
        <Link href="/today" className="hm-plan-link">Plan day <span aria-hidden="true">→</span></Link>
      </div>

      {tasksLoading ? (
        <p className="hm-plan-empty">Getting today’s tasks…</p>
      ) : tasks.length === 0 ? (
        <Link href="/today" className="hm-plan-empty hm-plan-empty-link">
          <ListTodo size={18} /> Add your first task for today
        </Link>
      ) : (
        <div className="hm-plan-tasks" aria-label="Today’s tasks">
          {visibleTasks.map((task) => (
            <button key={task.id} type="button" className="hm-plan-task" onClick={() => void toggleComplete(task)}>
              <Circle size={19} strokeWidth={1.7} aria-hidden="true" />
              <span>{task.title}</span>
            </button>
          ))}
          {openTasks.length === 0 && <p className="hm-plan-empty"><Check size={17} /> You’ve finished today’s tasks.</p>}
          {openTasks.length > visibleTasks.length && (
            <Link href="/today" className="hm-plan-more">+{openTasks.length - visibleTasks.length} more tasks</Link>
          )}
        </div>
      )}

      <div className="hm-plan-divider" />
      <div className="hm-plan-heading hm-habits-heading">
        <div>
          <p className="hm-section-label">Small things, done consistently</p>
          <h3 className="hm-habits-title">Daily habits</h3>
        </div>
        {!habitsLoading && habits.length > 0 && (
          <span className="hm-habit-count">{doneHabits.size}/{habits.length}</span>
        )}
      </div>
      {habitsLoading ? (
        <p className="hm-plan-empty">Loading habits…</p>
      ) : habits.length === 0 ? (
        <Link href="/vitality" className="hm-plan-empty hm-plan-empty-link">Choose habits in Vitality →</Link>
      ) : (
        <div className="hm-habits">
          {habits.slice(0, 5).map((habit) => {
            const completed = doneHabits.has(habit.id);
            return (
              <button
                key={habit.id}
                type="button"
                className={`hm-habit ${completed ? "is-done" : ""}`}
                aria-pressed={completed}
                onClick={() => void toggleHabit(habit.id)}
              >
                <span className="hm-habit-icon" aria-hidden="true">{completed ? <Check size={14} /> : habit.icon}</span>
                <span>{habit.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
