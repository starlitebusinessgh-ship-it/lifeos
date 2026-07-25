"use client";

import { useEffect } from "react";
import type { Alarm } from "@/lib/today/alarmLogic";
import { requestSystemAlarmPermission, syncAlarmsToSystem } from "@/lib/today/systemAlarms";

/** Keeps iPhone system notifications in sync with Supabase alarms (native LifeOS app only). */
export function NativeAlarmSync({ alarms }: { alarms: Alarm[] }) {
  useEffect(() => {
    void requestSystemAlarmPermission();
  }, []);

  useEffect(() => {
    void syncAlarmsToSystem(alarms);
  }, [alarms]);

  return null;
}
