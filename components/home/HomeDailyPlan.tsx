"use client";

import Link from "next/link";
import { Check, Circle, ListTodo } from "lucide-react";
import { motion } from "motion/react";
import { useDayTasks } from "@/lib/today/useDayTasks";
import { todayIso } from "@/lib/today/timeline";
import { useHabits } from "@/lib/vitality/useVitality";

export function HomeDailyPlan() {
  const day = todayIso();
  const { tasks, loading: tasksLoading, toggleComplete } = useDayTasks(day);
  const { habits, completions, loading: habitsLoading, toggleHabit } = useHabits(day);
  const openTasks = [...tasks.filter((task) => !task.completed)].sort(
    (a, b) => Number(b.is_focus) - Number(a.is_focus)
  );
  const visibleTasks = openTasks.slice(0, 3);
  const doneHabits = new Set(completions.map((completion) => completion.habit_id));
  const visibleHabits = habits.slice(0, 5);
  const visibleHabitsDone = visibleHabits.filter((habit) => doneHabits.has(habit.id)).length;
  const doneTasks = tasks.length - openTasks.length;
  const progress = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;

  return (
    <motion.section
      className="hm-plan"
      aria-label="Today's plan"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.04 }}
    >
      <div className="hm-plan-heading">
        <div>
          <p className="hm-plan-eyebrow">YOUR DAY · ONE STEP AT A TIME</p>
          <h2 className="hm-plan-title">
            {tasksLoading ? "Loading your plan…" : openTasks.length ? "Today’s priorities" : "Make today count"}
          </h2>
        </div>
        <Link href="/today" className="hm-plan-link">Plan day <span aria-hidden="true">→</span></Link>
      </div>

      {!tasksLoading && tasks.length > 0 && (
        <div className="hm-plan-progress" aria-label={`${doneTasks} of ${tasks.length} tasks complete`}>
          <div className="hm-plan-progress-track" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
          <span>{doneTasks}/{tasks.length} done</span>
        </div>
      )}

      {tasksLoading ? (
        <p className="hm-plan-empty">Getting today’s tasks…</p>
      ) : tasks.length === 0 ? (
        <Link href="/today" className="hm-plan-empty hm-plan-empty-link">
          <ListTodo size={18} /> Add your first task for today
        </Link>
      ) : (
        <div className="hm-plan-tasks" aria-label="Today’s tasks">
          {visibleTasks.map((task) => (
            <button key={task.id} type="button" className={`hm-plan-task ${task.is_focus ? "is-focus" : ""}`} onClick={() => void toggleComplete(task)}>
              <span className="hm-plan-check"><Circle size={19} strokeWidth={1.7} aria-hidden="true" /></span>
              <span className="hm-plan-task-title">{task.title}</span>
              {task.is_focus && <span className="hm-plan-focus">FOCUS</span>}
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
          <span className="hm-habit-count">{visibleHabitsDone}/{visibleHabits.length}{habits.length > visibleHabits.length ? " shown" : " done"}</span>
        )}
      </div>
      {habitsLoading ? (
        <p className="hm-plan-empty">Loading habits…</p>
      ) : habits.length === 0 ? (
        <Link href="/vitality" className="hm-plan-empty hm-plan-empty-link">Choose habits in Vitality →</Link>
      ) : (
        <div className="hm-habits">
          {visibleHabits.map((habit) => {
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
    </motion.section>
  );
}
