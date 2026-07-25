"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Alarm } from "./alarmLogic";

const SELECT = "id, label, hour, minute, repeat_days, enabled, created_at";

export function useAlarms() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("lifeos_alarms")
      .select(SELECT)
      .order("hour", { ascending: true })
      .order("minute", { ascending: true });
    if (!error && data) setAlarms(data as Alarm[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { alarms, loading, reload };
}
