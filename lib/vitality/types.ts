export function todayIso(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return todayIso(dt);
}

export function weekDates(anchorIso: string): string[] {
  const [y, m, d] = anchorIso.split("-").map(Number);
  const anchor = new Date(y, m - 1, d);
  const dow = anchor.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const start = new Date(y, m - 1, d + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(start);
    dt.setDate(start.getDate() + i);
    return todayIso(dt);
  });
}

export function formatDayShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" });
}

export function formatDayNum(iso: string): string {
  return iso.slice(8, 10);
}

export const MOOD_LEVELS = [
  { value: 1, label: "Rough", emoji: "😔" },
  { value: 2, label: "Low", emoji: "😕" },
  { value: 3, label: "OK", emoji: "😐" },
  { value: 4, label: "Good", emoji: "🙂" },
  { value: 5, label: "Great", emoji: "😊" },
] as const;

export type MoodValue = (typeof MOOD_LEVELS)[number]["value"];

export interface VitalityDay {
  day_date: string;
  mood: number | null;
  sleep_hours: number | null;
  energy: number | null;
  notes: string | null;
  updated_at: string;
}

export interface Habit {
  id: number;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface HabitCompletion {
  id: number;
  habit_id: number;
  day_date: string;
}

export function moodLabel(mood: number | null): string {
  if (!mood) return "Not logged";
  return MOOD_LEVELS.find((m) => m.value === mood)?.label ?? "—";
}

export function habitStreak(
  habitId: number,
  completions: HabitCompletion[],
  fromDate: string
): number {
  let streak = 0;
  let cursor = fromDate;
  const set = new Set(
    completions.filter((c) => c.habit_id === habitId).map((c) => c.day_date)
  );
  while (set.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
