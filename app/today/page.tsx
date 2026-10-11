"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, AlarmClock } from "lucide-react";
import { useAlarms } from "@/lib/today/useAlarms";
import { useDayTasks } from "@/lib/today/useDayTasks";
import { buildDayTimeline, todayIso } from "@/lib/today/timeline";
import type { DayTaskDraft } from "@/lib/today/taskTypes";
import { DayStrip } from "@/components/today/DayStrip";
import { PlanTodayCard } from "@/components/today/PlanTodayCard";
import { FocusSessionCard } from "@/components/today/FocusSessionCard";
import { DayTimelineView } from "@/components/today/DayTimeline";
import { TaskSheet } from "@/components/today/TaskSheet";
import { AlarmScheduler, NotificationPrompt } from "@/components/today/AlarmScheduler";
import { AlarmRing } from "@/components/today/AlarmRing";
import { NativeAlarmSync } from "@/components/today/NativeAlarmSync";
import { TodayPullRefresh } from "@/components/today/TodayPullRefresh";
import { haptic } from "@/lib/finance/haptics";
import { isRecoveryDay } from "@/lib/today/recoveryMode";

export default function TodayPage() {
  const [day, setDay] = useState(todayIso);
  const { alarms, reload: reloadAlarms } = useAlarms();
  const { tasks, loading, reload, saveTask, toggleComplete, deleteTask } = useDayTasks(day);

  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [focusSheetOpen, setFocusSheetOpen] = useState(false);
  const [taskDraft, setTaskDraft] = useState<DayTaskDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    setRecoveryMode(day === todayIso() && isRecoveryDay(day));
  }, [day]);

  const timeline = useMemo(
    () => buildDayTimeline(day, alarms, tasks),
    [day, alarms, tasks]
  );

  async function handleRefresh() {
    await Promise.all([reload(), reloadAlarms()]);
  }

  function openNewTask(anytime = false) {
    haptic("light");
    setTaskDraft({
      day_date: day,
      title: "",
      hour: anytime ? null : 9,
      minute: anytime ? null : 0,
      duration_mins: 30,
      completed: false,
      is_focus: false,
    });
    setTaskSheetOpen(true);
  }

  function openFocus() {
    haptic("light");
    const existing = timeline.focus;
    setTaskDraft(
      existing
        ? {
            id: existing.id,
            day_date: existing.day_date,
            title: existing.title,
            hour: existing.hour,
            minute: existing.minute,
            duration_mins: existing.duration_mins,
            completed: existing.completed,
            is_focus: true,
          }
        : {
            day_date: day,
            title: "",
            hour: null,
            minute: null,
            duration_mins: 30,
            completed: false,
            is_focus: true,
          }
    );
    setFocusSheetOpen(true);
  }

  async function handleSaveTask(d: DayTaskDraft) {
    setSaving(true);
    const ok = await saveTask({ ...d, day_date: day });
    setSaving(false);
    if (ok) {
      haptic("success");
      setTaskSheetOpen(false);
      setFocusSheetOpen(false);
    }
  }

  async function handleDeleteTask(id: number) {
    setSaving(true);
    await deleteTask(id);
    setSaving(false);
    setTaskSheetOpen(false);
    setFocusSheetOpen(false);
  }

  return (
    <>
      <NotificationPrompt />
      <NativeAlarmSync alarms={alarms} />
      <AlarmScheduler alarms={alarms} />
      <AlarmRing />

      <TodayPullRefresh onRefresh={handleRefresh}>
        <div className="td-shell">
          <header className="td-head td-head-row">
            <div>
              <h1>Today</h1>
              <p>Your day at a glance</p>
            </div>
            <Link href="/today/alarms" className="td-head-alarms" aria-label="Manage alarms">
              <AlarmClock size={20} strokeWidth={1.75} />
            </Link>
          </header>

          <DayStrip selected={day} onSelect={setDay} />

          {loading && tasks.length === 0 ? (
            <div className="td-skel td-skel-hero" />
          ) : (
            <>
              <PlanTodayCard
                tasks={tasks}
                recoveryMode={recoveryMode}
                onChooseFocus={openFocus}
                onAddTask={() => openNewTask(true)}
                onToggleTask={(task) => void toggleComplete(task)}
              />
              <FocusSessionCard focusTask={timeline.focus?.completed ? null : timeline.focus} onChooseFocus={openFocus} isToday={day === todayIso()} />

              <DayTimelineView
                timeline={timeline}
                onToggleTask={(t) => void toggleComplete(t)}
                onEditAlarm={() => {
                  window.location.href = "/today/alarms";
                }}
              />
            </>
          )}

          <button type="button" className="td-fab" aria-label="Add task" onClick={() => openNewTask()}>
            <Plus size={24} strokeWidth={2} />
          </button>
        </div>
      </TodayPullRefresh>

      <TaskSheet
        open={taskSheetOpen}
        initial={taskDraft}
        saving={saving}
        onClose={() => setTaskSheetOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      <TaskSheet
        open={focusSheetOpen}
        initial={taskDraft}
        saving={saving}
        focusMode
        onClose={() => setFocusSheetOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </>
  );
}
