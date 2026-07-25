"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { addDays, type Habit, type HabitCompletion, type VitalityDay } from "./types";

const DAY_SELECT = "day_date, mood, sleep_hours, energy, notes, updated_at";
const HABIT_SELECT = "id, name, icon, color, sort_order, active, created_at";

export function useVitalityDay(dayDate: string) {
  const [day, setDay] = useState<VitalityDay | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data } = await supabase
      .from("lifeos_vitality_days")
      .select(DAY_SELECT)
      .eq("day_date", dayDate)
      .maybeSingle();
    setDay((data as VitalityDay) ?? null);
    setLoading(false);
  }, [dayDate]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  async function saveDay(patch: Partial<VitalityDay>): Promise<boolean> {
    const payload = {
      day_date: dayDate,
      mood: patch.mood ?? day?.mood ?? null,
      sleep_hours: patch.sleep_hours ?? day?.sleep_hours ?? null,
      energy: patch.energy ?? day?.energy ?? null,
      notes: patch.notes ?? day?.notes ?? null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("lifeos_vitality_days").upsert(payload, {
      onConflict: "day_date",
    });
    if (error) return false;
    await reload();
    return true;
  }

  return { day, loading, reload, saveDay };
}

export function useVitalityWeek(weekDates: string[]) {
  const [days, setDays] = useState<VitalityDay[]>([]);

  const reload = useCallback(async () => {
    if (weekDates.length === 0) return;
    const { data } = await supabase
      .from("lifeos_vitality_days")
      .select(DAY_SELECT)
      .in("day_date", weekDates);
    setDays((data as VitalityDay[]) ?? []);
  }, [weekDates]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { days, reload };
}

export function useHabits(dayDate: string) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [hRes, cRes] = await Promise.all([
      supabase.from("lifeos_habits").select(HABIT_SELECT).eq("active", true).order("sort_order"),
      supabase
        .from("lifeos_habit_completions")
        .select("id, habit_id, day_date")
        .eq("day_date", dayDate),
    ]);
    if (hRes.data) setHabits(hRes.data as Habit[]);
    if (cRes.data) setCompletions(cRes.data as HabitCompletion[]);
    setLoading(false);
  }, [dayDate]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  async function toggleHabit(habitId: number): Promise<void> {
    const done = completions.some((c) => c.habit_id === habitId);
    if (done) {
      await supabase
        .from("lifeos_habit_completions")
        .delete()
        .eq("habit_id", habitId)
        .eq("day_date", dayDate);
    } else {
      await supabase.from("lifeos_habit_completions").insert({ habit_id: habitId, day_date: dayDate });
    }
    await reload();
  }

  async function addHabit(name: string, icon: string, color: string): Promise<boolean> {
    const { error } = await supabase.from("lifeos_habits").insert({
      name: name.trim(),
      icon,
      color,
      sort_order: habits.length,
    });
    if (error) return false;
    await reload();
    return true;
  }

  async function deleteHabit(id: number): Promise<void> {
    await supabase.from("lifeos_habits").update({ active: false }).eq("id", id);
    await reload();
  }

  return { habits, completions, loading, reload, toggleHabit, addHabit, deleteHabit };
}

export function useHabitStreakCompletions(habitIds: number[], anchorDay: string) {
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const from = addDays(anchorDay, -45);
  const habitKey = habitIds.join(",");

  useEffect(() => {
    if (habitIds.length === 0) return;
    void supabase
      .from("lifeos_habit_completions")
      .select("id, habit_id, day_date")
      .in("habit_id", habitIds)
      .gte("day_date", from)
      .lte("day_date", anchorDay)
      .then(({ data }) => setCompletions((data as HabitCompletion[]) ?? []));
  }, [habitKey, anchorDay, from, habitIds]);

  return completions;
}
