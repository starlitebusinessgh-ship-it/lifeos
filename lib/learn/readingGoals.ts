import { supabase } from "@/lib/supabase";

export async function addReadingGoalToToday(
  title: string,
  asFocus = false
): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("lifeos_today_tasks").insert({
    day_date: day,
    title: title.trim(),
    hour: null,
    minute: null,
    duration_mins: 0,
    completed: false,
    is_focus: asFocus,
  });
  return !error;
}
