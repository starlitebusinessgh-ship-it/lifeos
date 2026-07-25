export interface Alarm {
  id: number;
  label: string;
  hour: number;
  minute: number;
  repeat_days: number[];
  enabled: boolean;
  created_at: string;
}

export interface AlarmDraft {
  id?: number;
  label: string;
  hour: number;
  minute: number;
  repeat_days: number[];
  enabled: boolean;
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function formatAlarmTime(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Minutes from midnight for sorting. */
export function timeToMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

/** Next occurrence of this alarm from `from` (default now). */
export function nextOccurrence(alarm: Alarm, from = new Date()): Date | null {
  if (!alarm.enabled || alarm.repeat_days.length === 0) return null;

  const base = new Date(from);
  base.setSeconds(0, 0);

  for (let offset = 0; offset < 8; offset++) {
    const candidate = new Date(base);
    candidate.setDate(base.getDate() + offset);
    candidate.setHours(alarm.hour, alarm.minute, 0, 0);

    if (!alarm.repeat_days.includes(candidate.getDay())) continue;
    if (candidate > from) return candidate;
  }
  return null;
}

export function nextAlarm(alarms: Alarm[], from = new Date()): { alarm: Alarm; at: Date } | null {
  let best: { alarm: Alarm; at: Date } | null = null;
  for (const a of alarms) {
    const at = nextOccurrence(a, from);
    if (!at) continue;
    if (!best || at < best.at) best = { alarm: a, at };
  }
  return best;
}

export function repeatSummary(days: number[]): string {
  if (days.length === 7) return "Every day";
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return "Weekdays";
  if (days.length === 2 && days.includes(0) && days.includes(6)) return "Weekends";
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d])
    .join(", ");
}

export function minutesUntil(date: Date, from = new Date()): number {
  return Math.max(0, Math.round((date.getTime() - from.getTime()) / 60000));
}

export function formatCountdown(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
