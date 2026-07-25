"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { DayTask, DayTaskDraft } from "./taskTypes";

const SELECT =
  "id, day_date, title, hour, minute, duration_mins, completed, is_focus, sort_order, created_at";

export function useDayTasks(dayDate: string) {
  const [tasks, setTasks] = useState<DayTask[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("lifeos_today_tasks")
      .select(SELECT)
      .eq("day_date", dayDate)
      .order("sort_order", { ascending: true })
      .order("hour", { ascending: true, nullsFirst: true })
      .order("minute", { ascending: true, nullsFirst: true });
    if (!error && data) setTasks(data as DayTask[]);
    setLoading(false);
  }, [dayDate]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  async function saveTask(draft: DayTaskDraft): Promise<boolean> {
    if (draft.is_focus) {
      await supabase
        .from("lifeos_today_tasks")
        .update({ is_focus: false })
        .eq("day_date", draft.day_date);
    }

    const payload = {
      day_date: draft.day_date,
      title: draft.title.trim(),
      hour: draft.hour,
      minute: draft.minute,
      duration_mins: draft.duration_mins,
      completed: draft.completed,
      is_focus: draft.is_focus,
    };

    if (typeof draft.id === "number") {
      const { error } = await supabase.from("lifeos_today_tasks").update(payload).eq("id", draft.id);
      if (error) return false;
    } else {
      const { error } = await supabase.from("lifeos_today_tasks").insert(payload);
      if (error) return false;
    }
    await reload();
    return true;
  }

  async function toggleComplete(task: DayTask): Promise<void> {
    await supabase
      .from("lifeos_today_tasks")
      .update({ completed: !task.completed })
      .eq("id", task.id);
    await reload();
  }

  async function deleteTask(id: number): Promise<void> {
    await supabase.from("lifeos_today_tasks").delete().eq("id", id);
    await reload();
  }

  return { tasks, loading, reload, saveTask, toggleComplete, deleteTask };
}
