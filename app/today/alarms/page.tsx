"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAlarms } from "@/lib/today/useAlarms";
import type { Alarm, AlarmDraft } from "@/lib/today/alarmLogic";
import { nextAlarm } from "@/lib/today/alarmLogic";
import { NextAlarmCard, AlarmList } from "@/components/today/AlarmCards";
import { AlarmSheet } from "@/components/today/AlarmSheet";
import { cancelSystemAlarm } from "@/lib/today/systemAlarms";
import { TodayPullRefresh } from "@/components/today/TodayPullRefresh";
import { TodaySkeleton } from "@/components/today/TodaySkeleton";
import { haptic } from "@/lib/finance/haptics";

export default function TodayAlarmsPage() {
  const { alarms, loading, reload } = useAlarms();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<AlarmDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const enabled = useMemo(() => alarms.filter((a) => a.enabled), [alarms]);
  const next = useMemo(() => nextAlarm(enabled), [enabled]);

  function openNew() {
    haptic("light");
    setDraft({ label: "Alarm", hour: 7, minute: 0, repeat_days: [1, 2, 3, 4, 5], enabled: true });
    setSheetOpen(true);
  }

  function openEdit(a: Alarm) {
    setDraft({
      id: a.id,
      label: a.label,
      hour: a.hour,
      minute: a.minute,
      repeat_days: a.repeat_days,
      enabled: a.enabled,
    });
    setSheetOpen(true);
  }

  async function handleSave(d: AlarmDraft) {
    setSaving(true);
    const payload = {
      label: d.label,
      hour: d.hour,
      minute: d.minute,
      repeat_days: d.repeat_days,
      enabled: d.enabled,
    };
    if (typeof d.id === "number") {
      await supabase.from("lifeos_alarms").update(payload).eq("id", d.id);
    } else {
      await supabase.from("lifeos_alarms").insert(payload);
    }
    setSaving(false);
    setSheetOpen(false);
    haptic("success");
    await reload();
  }

  async function handleDelete(id: number) {
    setSaving(true);
    await cancelSystemAlarm(id);
    await supabase.from("lifeos_alarms").delete().eq("id", id);
    setSaving(false);
    setSheetOpen(false);
    await reload();
  }

  async function handleToggle(a: Alarm) {
    haptic("light");
    await supabase.from("lifeos_alarms").update({ enabled: !a.enabled }).eq("id", a.id);
    await reload();
  }

  return (
    <TodayPullRefresh onRefresh={reload}>
      <div className="td-shell">
        <header className="td-head td-head-row">
          <Link href="/today" className="td-back" aria-label="Back to Today">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1>Alarms</h1>
            <p>Wake-up schedules</p>
          </div>
        </header>

        {loading && alarms.length === 0 ? (
          <TodaySkeleton />
        ) : (
          <>
            <NextAlarmCard alarm={next?.alarm ?? null} at={next?.at ?? null} />

            <p className="td-tip">
              Alarms appear on your Today timeline. Allow notifications for wake-up alerts on this device.
            </p>

            <div className="td-section">
              <h2>All alarms</h2>
              <button type="button" onClick={openNew}>
                Add
              </button>
            </div>

            <AlarmList alarms={alarms} onSelect={openEdit} onToggle={handleToggle} />
          </>
        )}

        <button type="button" className="td-fab" aria-label="Add alarm" onClick={openNew}>
          <Plus size={24} strokeWidth={2} />
        </button>

        <AlarmSheet
          open={sheetOpen}
          initial={draft}
          saving={saving}
          onClose={() => setSheetOpen(false)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </TodayPullRefresh>
  );
}
