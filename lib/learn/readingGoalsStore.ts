import { supabase } from "@/lib/supabase";
import { addReadingGoalToToday } from "./readingGoals";

export type ReadingGoalType = "pages_per_day" | "minutes_per_day" | "books_per_month";

export interface ReadingGoal {
  id: string;
  goal_type: ReadingGoalType;
  target_value: number;
  period: string;
  created_at: string;
}

export async function fetchReadingGoal(): Promise<ReadingGoal | null> {
  const { data, error } = await supabase
    .from("library_reading_goals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as ReadingGoal;
}

export async function saveReadingGoal(
  goalType: ReadingGoalType,
  targetValue: number,
  period = "daily"
): Promise<ReadingGoal | null> {
  const { data, error } = await supabase
    .from("library_reading_goals")
    .insert({ goal_type: goalType, target_value: targetValue, period })
    .select()
    .single();
  if (error || !data) return null;
  return data as ReadingGoal;
}

export function goalLabel(goal: ReadingGoal): string {
  switch (goal.goal_type) {
    case "pages_per_day":
      return `${goal.target_value} pages/day`;
    case "minutes_per_day":
      return `${goal.target_value} min/day`;
    case "books_per_month":
      return `${goal.target_value} books/month`;
    default:
      return `${goal.target_value}`;
  }
}

export async function syncGoalToToday(goal: ReadingGoal): Promise<boolean> {
  const label =
    goal.goal_type === "pages_per_day"
      ? `Read ${goal.target_value} pages today`
      : goal.goal_type === "minutes_per_day"
        ? `Read for ${goal.target_value} minutes today`
        : `Finish ${goal.target_value} books this month`;
  return addReadingGoalToToday(label);
}

export { addReadingGoalToToday };
