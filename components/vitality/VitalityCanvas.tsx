"use client";

import { useMemo, useState } from "react";
import { Plus, HeartPulse } from "lucide-react";
import {
  todayIso,
  weekDates,
  moodLabel,
  type MoodValue,
} from "@/lib/vitality/types";
import {
  useVitalityDay,
  useVitalityWeek,
  useHabits,
  useHabitStreakCompletions,
} from "@/lib/vitality/useVitality";
import { MoodPicker } from "./MoodPicker";
import { SleepCard } from "./SleepCard";
import { HabitList } from "./HabitList";
import { WeekMoodStrip } from "./WeekMoodStrip";
import { AddHabitSheet } from "./AddHabitSheet";
import { haptic } from "@/lib/finance/haptics";
import { useToast } from "@/components/finance/ToastProvider";

export function VitalityCanvas() {
  const [day, setDay] = useState(todayIso);
  const week = useMemo(() => weekDates(day), [day]);
  const { day: vitality, loading: dayLoading, saveDay } = useVitalityDay(day);
  const { days: weekDays, reload: reloadWeek } = useVitalityWeek(week);
  const { habits, completions, loading: habitsLoading, toggleHabit, addHabit } = useHabits(day);
  const history = useHabitStreakCompletions(
    habits.map((h) => h.id),
    day
  );
  const { showToast } = useToast();
  const [habitSheet, setHabitSheet] = useState(false);
  const [savingHabit, setSavingHabit] = useState(false);

  const isToday = day === todayIso();
  const loading = dayLoading && habitsLoading;

  async function setMood(m: MoodValue) {
    await saveDay({ mood: m });
    void reloadWeek();
  }

  async function setSleep(h: number) {
    await saveDay({ sleep_hours: h });
    void reloadWeek();
  }

  async function handleAddHabit(name: string, icon: string, color: string) {
    setSavingHabit(true);
    const ok = await addHabit(name, icon, color);
    setSavingHabit(false);
    if (!ok) {
      showToast("Could not add habit");
      return;
    }
    haptic("success");
    setHabitSheet(false);
    showToast("Habit added");
  }

  const headline = isToday
    ? vitality?.mood
      ? `Feeling ${moodLabel(vitality.mood).toLowerCase()} today`
      : "How are you today?"
    : vitality?.mood
      ? `Felt ${moodLabel(vitality.mood).toLowerCase()}`
      : "No check-in this day";

  return (
    <>
      <div className="vt-shell">
        <header className="vt-head">
          <div className="vt-head-icon" aria-hidden>
            <HeartPulse size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h1>Vitality</h1>
            <p>Body, mind, and daily rhythm</p>
          </div>
        </header>

        <WeekMoodStrip weekDates={week} days={weekDays} selected={day} onSelect={setDay} />

        <section className="vt-pulse-card">
          <span className="vt-card-label">{isToday ? "Today's pulse" : "That day"}</span>
          <h2 className="vt-pulse-headline">{loading ? "…" : headline}</h2>
          <MoodPicker value={vitality?.mood ?? null} onChange={(m) => void setMood(m)} />
        </section>

        <SleepCard
          hours={vitality?.sleep_hours ?? null}
          onChange={(h) => void setSleep(h)}
        />

        <HabitList
          habits={habits}
          completions={completions}
          allCompletions={history}
          dayDate={day}
          onToggle={(id) => void toggleHabit(id)}
        />

        <button
          type="button"
          className="vt-fab"
          aria-label="Add habit"
          onClick={() => {
            haptic("light");
            setHabitSheet(true);
          }}
        >
          <Plus size={24} strokeWidth={2} />
        </button>
      </div>

      <AddHabitSheet
        open={habitSheet}
        saving={savingHabit}
        onClose={() => setHabitSheet(false)}
        onSave={handleAddHabit}
      />
    </>
  );
}
