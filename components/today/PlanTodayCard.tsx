"use client";

import { Check, Plus, Target } from "lucide-react";
import { motion } from "motion/react";
import type { DayTask } from "@/lib/today/taskTypes";
import { haptic } from "@/lib/finance/haptics";

interface PlanTodayCardProps {
  tasks: DayTask[];
  onChooseFocus: () => void;
  onAddTask: () => void;
  onToggleTask: (task: DayTask) => void;
}

export function PlanTodayCard({ tasks, onChooseFocus, onAddTask, onToggleTask }: PlanTodayCardProps) {
  const focus =
    tasks.find((task) => task.is_focus && !task.completed) ??
    tasks.find((task) => task.is_focus) ??
    null;
  const supportTasks = tasks.filter((task) => !task.is_focus).slice(0, 2);
  const plannedCount = Number(Boolean(focus)) + supportTasks.length;

  return (
    <motion.section
      className="td-plan-card"
      aria-label="Plan your day"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="td-plan-head">
        <div>
          <span className="td-plan-kicker">A SIMPLE PLAN</span>
          <h2>One main thing. Two small steps.</h2>
          <p>Make the day clear before it gets busy.</p>
        </div>
        <span className="td-plan-count" aria-label={`${plannedCount} of 3 planned`}>{plannedCount}<span>/3</span></span>
      </div>

      <div className="td-plan-main">
        <div className="td-plan-main-icon"><Target size={19} strokeWidth={1.8} /></div>
        <div className="td-plan-main-copy">
          <span className="td-plan-label">MAIN PRIORITY</span>
          {focus ? (
            <button type="button" className={`td-plan-task-title ${focus.completed ? "done" : ""}`} onClick={() => { haptic("light"); onToggleTask(focus); }}>
              <span className={`td-plan-check ${focus.completed ? "done" : ""}`} aria-hidden="true">{focus.completed && <Check size={13} strokeWidth={3} />}</span>
              {focus.title}
            </button>
          ) : (
            <button type="button" className="td-plan-add-main" onClick={onChooseFocus}>
              Choose what matters most <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
        {focus && <button type="button" className="td-plan-edit" onClick={onChooseFocus}>Edit</button>}
      </div>

      <div className="td-plan-supports">
        <p className="td-plan-label">SMALL SUPPORTING STEPS</p>
        {[0, 1].map((slot) => {
          const task = supportTasks[slot];
          return task ? (
            <button key={task.id} type="button" className={`td-plan-support ${task.completed ? "done" : ""}`} onClick={() => { haptic("light"); onToggleTask(task); }}>
              <span className={`td-plan-check small ${task.completed ? "done" : ""}`} aria-hidden="true">{task.completed && <Check size={11} strokeWidth={3} />}</span>
              <span>{task.title}</span>
            </button>
          ) : (
            <button key={`empty-${slot}`} type="button" className="td-plan-add-support" onClick={onAddTask}>
              <Plus size={15} /> Add a small task
            </button>
          );
        })}
      </div>
    </motion.section>
  );
}
