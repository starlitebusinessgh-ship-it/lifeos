import { supabase } from "@/lib/supabase";
import type { ReadingPlanDefinition } from "./readingPlans";
import { getReadingPlan } from "./readingPlans";

export interface BibleReadingPlanProgress {
  id: string;
  plan_id: string;
  title: string | null;
  config: Record<string, unknown> | null;
  schedule: ReadingPlanDefinition["schedule"] | null;
  start_date: string;
  current_day: number;
  completed_days: number[];
  status: "active" | "paused" | "completed";
  created_at: string;
}

function mapRow(data: Record<string, unknown>): BibleReadingPlanProgress {
  return {
    id: data.id as string,
    plan_id: data.plan_id as string,
    title: (data.title as string | null) ?? null,
    config: (data.config as Record<string, unknown> | null) ?? null,
    schedule: (data.schedule as BibleReadingPlanProgress["schedule"]) ?? null,
    start_date: data.start_date as string,
    current_day: data.current_day as number,
    completed_days: (data.completed_days as number[]) ?? [],
    status: data.status as BibleReadingPlanProgress["status"],
    created_at: data.created_at as string,
  };
}

export function resolvePlanDefinition(row: BibleReadingPlanProgress): ReadingPlanDefinition | null {
  if (row.schedule?.length && row.title) {
    return {
      id: row.plan_id,
      title: row.title,
      description: `${row.schedule.length} days`,
      days: row.schedule.length,
      schedule: row.schedule,
    };
  }
  return getReadingPlan(row.plan_id) ?? null;
}

export async function fetchAllReadingPlans(): Promise<BibleReadingPlanProgress[]> {
  const { data, error } = await supabase
    .from("bible_reading_plans")
    .select("*")
    .neq("status", "completed")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => mapRow(row as Record<string, unknown>));
}

export async function fetchActiveReadingPlan(): Promise<BibleReadingPlanProgress | null> {
  const { data, error } = await supabase
    .from("bible_reading_plans")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function createReadingPlan(
  plan: ReadingPlanDefinition,
  activate = true
): Promise<BibleReadingPlanProgress | null> {
  if (activate) {
    await supabase.from("bible_reading_plans").update({ status: "paused" }).eq("status", "active");
  }

  const { data, error } = await supabase
    .from("bible_reading_plans")
    .insert({
      plan_id: plan.id,
      title: plan.title,
      config: plan.config ?? null,
      schedule: plan.schedule,
      status: activate ? "active" : "paused",
      current_day: 1,
      completed_days: [],
    })
    .select()
    .single();

  if (error || !data) return null;
  return mapRow(data as Record<string, unknown>);
}

/** @deprecated use createReadingPlan */
export async function startReadingPlan(planId: string): Promise<BibleReadingPlanProgress | null> {
  const preset = getReadingPlan(planId);
  if (!preset) return null;
  return createReadingPlan(preset, true);
}

export async function activateReadingPlan(id: string): Promise<boolean> {
  await supabase.from("bible_reading_plans").update({ status: "paused" }).eq("status", "active");
  const { error } = await supabase
    .from("bible_reading_plans")
    .update({ status: "active" })
    .eq("id", id);
  return !error;
}

export async function pauseReadingPlan(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("bible_reading_plans")
    .update({ status: "paused" })
    .eq("id", id);
  return !error;
}

export async function deleteReadingPlan(id: string): Promise<boolean> {
  const { error } = await supabase.from("bible_reading_plans").delete().eq("id", id);
  return !error;
}

export async function markPlanDayComplete(
  progressId: string,
  day: number,
  completedDays: number[],
  totalDays: number
): Promise<boolean> {
  const next = Array.from(new Set([...completedDays, day])).sort((a, b) => a - b);
  const allDone = next.length >= totalDays;
  const payload: Record<string, unknown> = {
    completed_days: next,
    current_day: allDone ? day : day + 1,
  };
  if (allDone) payload.status = "completed";
  const { error } = await supabase.from("bible_reading_plans").update(payload).eq("id", progressId);
  return !error;
}
