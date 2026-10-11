"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Heart, Moon, RotateCcw, Sparkles, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { addDays, todayIso } from "@/lib/vitality/types";
import { setRecoveryDay } from "@/lib/today/recoveryMode";

type Task = { day_date: string; completed: boolean };
type Vitality = { day_date: string; sleep_hours: number | null };

export default function ReviewPage() {
  const today = useMemo(() => todayIso(), []);
  const start = addDays(today, -6);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sleep, setSleep] = useState<Vitality[]>([]);
  const [habitCount, setHabitCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [reflection, setReflection] = useState("");
  const [saved, setSaved] = useState(false);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    const key = `lifeos:weekly-review:v1:${start}`;
    try {
      setReflection(localStorage.getItem(key) ?? "");
      setRecovery(localStorage.getItem("lifeos:recovery-day:v1") === today);
    } catch { /* Private browsing may disable storage. */ }
    void Promise.all([
      supabase.from("lifeos_today_tasks").select("day_date,completed").gte("day_date", start).lte("day_date", today),
      supabase.from("lifeos_vitality_days").select("day_date,sleep_hours").gte("day_date", start).lte("day_date", today),
      supabase.from("lifeos_habit_completions").select("id", { count: "exact", head: true }).gte("day_date", start).lte("day_date", today),
    ]).then(([t, v, h]) => {
      setTasks((t.data as Task[] | null) ?? []);
      setSleep((v.data as Vitality[] | null) ?? []);
      setHabitCount(h.error ? null : h.count ?? 0);
      setLoading(false);
    });
  }, [start, today]);

  const completed = tasks.filter((task) => task.completed).length;
  const sleepDays = sleep.filter((day) => typeof day.sleep_hours === "number");
  const averageSleep = sleepDays.length ? sleepDays.reduce((sum, day) => sum + (day.sleep_hours ?? 0), 0) / sleepDays.length : null;
  const rangeLabel = `${new Date(`${start}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" })} – ${new Date(`${today}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" })}`;

  function saveReflection() {
    try {
      localStorage.setItem(`lifeos:weekly-review:v1:${start}`, reflection.trim());
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch { setSaved(false); }
  }

  function toggleRecovery() {
    const next = !recovery;
    if (setRecoveryDay(next ? today : null)) setRecovery(next);
  }

  return (
    <main className="rv-shell">
      <header className="rv-heading"><div><span className="rv-eyebrow">A MOMENT TO RESET</span><h1>Your week, in perspective.</h1><p>{rangeLabel} · A useful check-in, never a score.</p></div><span className="rv-mark"><Sparkles size={20}/></span></header>

      <section className="rv-metrics" aria-label="Your week at a glance">
        <article className="rv-metric rv-metric-violet"><span className="rv-metric-icon"><Target size={18}/></span><strong>{loading ? "—" : tasks.length ? `${completed}/${tasks.length}` : "—"}</strong><span>tasks completed</span><small>{loading ? "Loading your week" : tasks.length ? "planned in the last 7 days" : "No tasks planned this week"}</small></article>
        <article className="rv-metric rv-metric-blue"><span className="rv-metric-icon"><Moon size={18}/></span><strong>{loading ? "—" : averageSleep === null ? "—" : `${averageSleep.toFixed(1)}h`}</strong><span>average sleep</span><small>{loading ? "Loading your week" : `${sleepDays.length} ${sleepDays.length === 1 ? "night" : "nights"} logged`}</small></article>
        <article className="rv-metric rv-metric-mint"><span className="rv-metric-icon"><Heart size={18}/></span><strong>{loading || habitCount === null ? "—" : habitCount}</strong><span>habits completed</span><small>{loading ? "Loading your week" : habitCount === null ? "Could not load habit logs" : "logged across the week"}</small></article>
      </section>

      <section className="rv-reflect">
        <div className="rv-section-icon"><Sparkles size={19}/></div>
        <div className="rv-reflect-body"><span className="rv-eyebrow">ONE SMALL ADJUSTMENT</span><h2>What would make next week easier?</h2><p>Keep it practical. One change is enough.</p>
          <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="For example: put my phone outside the bedroom…" maxLength={240} aria-label="One adjustment for next week" />
          <div className="rv-reflect-actions"><span>Saved on this device</span><button type="button" onClick={saveReflection}>{saved ? <><Check size={15}/> Saved</> : "Save reflection"}</button></div>
        </div>
      </section>

      <section className={`rv-recovery ${recovery ? "active" : ""}`}>
        <span className="rv-recovery-icon"><RotateCcw size={20}/></span>
        <div className="rv-recovery-copy"><span className="rv-eyebrow">IF YOU NEED A RESET</span><h2>{recovery ? "Recovery mode is on for today" : "Make today a lighter day"}</h2><p>Keep one main priority and one small step in view. Your other tasks stay right where they are.</p><button type="button" className="rv-recovery-toggle" onClick={toggleRecovery}>{recovery ? "Turn off recovery mode" : "Start a lighter day"}</button></div>
        {recovery && <Link className="rv-today-link" href="/today" aria-label="Go to Today"><ArrowRight size={18}/></Link>}
      </section>
      <p className="rv-footnote">Your logged data only. Missing entries are left out, not counted as missed.</p>
    </main>
  );
}
