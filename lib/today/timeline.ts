import type { Alarm } from "./alarmLogic";
import { formatAlarmTime, repeatSummary } from "./alarmLogic";
import type { DayTask } from "./taskTypes";

export type TimelineKind = "alarm" | "task";

export interface TimelineEntry {
  key: string;
  kind: TimelineKind;
  title: string;
  hour: number;
  minute: number;
  durationMins: number;
  completed?: boolean;
  subtitle?: string;
  alarm?: Alarm;
  task?: DayTask;
}

export interface DayTimeline {
  focus: DayTask | null;
  anytime: DayTask[];
  entries: TimelineEntry[];
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDayDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function alarmsForDay(alarms: Alarm[], day: Date): Alarm[] {
  const dow = day.getDay();
  return alarms.filter((a) => a.enabled && a.repeat_days.includes(dow));
}

export function buildDayTimeline(
  dayIso: string,
  alarms: Alarm[],
  tasks: DayTask[]
): DayTimeline {
  const day = parseDayDate(dayIso);
  const dayAlarms = alarmsForDay(alarms, day);

  const focus = tasks.find((t) => t.is_focus && !t.completed) ?? tasks.find((t) => t.is_focus) ?? null;

  const timedTasks = tasks.filter((t) => t.hour !== null && t.minute !== null && !t.is_focus);
  const anytime = tasks.filter((t) => (t.hour === null || t.minute === null) && !t.is_focus);

  const entries: TimelineEntry[] = [];

  for (const a of dayAlarms) {
    entries.push({
      key: `alarm-${a.id}`,
      kind: "alarm",
      title: a.label || "Alarm",
      hour: a.hour,
      minute: a.minute,
      durationMins: 15,
      subtitle: repeatSummary(a.repeat_days),
      alarm: a,
    });
  }

  for (const t of timedTasks) {
    entries.push({
      key: `task-${t.id}`,
      kind: "task",
      title: t.title,
      hour: t.hour!,
      minute: t.minute!,
      durationMins: t.duration_mins,
      completed: t.completed,
      task: t,
    });
  }

  entries.sort((a, b) => {
    const ta = a.hour * 60 + a.minute;
    const tb = b.hour * 60 + b.minute;
    return ta - tb;
  });

  return { focus, anytime, entries };
}

export function formatTimeLabel(hour: number, minute: number): string {
  return formatAlarmTime(hour, minute);
}

export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function dayProgress(tasks: DayTask[]): number {
  const actionable = tasks.filter((t) => !t.is_focus);
  if (actionable.length === 0) return 0;
  const done = actionable.filter((t) => t.completed).length;
  return Math.round((done / actionable.length) * 100);
}
