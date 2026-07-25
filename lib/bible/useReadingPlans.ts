"use client";

import { useCallback, useEffect, useState } from "react";
import {
  activateReadingPlan,
  createReadingPlan,
  deleteReadingPlan,
  fetchActiveReadingPlan,
  fetchAllReadingPlans,
  markPlanDayComplete,
  pauseReadingPlan,
  type BibleReadingPlanProgress,
} from "./readingPlanActions";
import type { ReadingPlanDefinition } from "./readingPlans";

export function useReadingPlans() {
  const [plans, setPlans] = useState<BibleReadingPlanProgress[]>([]);
  const [active, setActive] = useState<BibleReadingPlanProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [all, current] = await Promise.all([fetchAllReadingPlans(), fetchActiveReadingPlan()]);
    setPlans(all);
    setActive(current);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function create(plan: ReadingPlanDefinition, makeActive = true) {
    const row = await createReadingPlan(plan, makeActive);
    await reload();
    return row;
  }

  async function activate(id: string) {
    const ok = await activateReadingPlan(id);
    if (ok) await reload();
    return ok;
  }

  async function pause(id: string) {
    const ok = await pauseReadingPlan(id);
    if (ok) await reload();
    return ok;
  }

  async function remove(id: string) {
    const ok = await deleteReadingPlan(id);
    if (ok) await reload();
    return ok;
  }

  async function completeDay(day: number, totalDays: number) {
    if (!active) return false;
    const ok = await markPlanDayComplete(active.id, day, active.completed_days, totalDays);
    if (ok) await reload();
    return ok;
  }

  return {
    plans,
    active,
    loading,
    reload,
    create,
    activate,
    pause,
    remove,
    completeDay,
  };
}

/** @deprecated use useReadingPlans */
export function useReadingPlan() {
  const { active, loading, create, completeDay } = useReadingPlans();
  return {
    progress: active,
    loading,
    start: async (planId: string) => {
      const { getReadingPlan } = await import("./readingPlans");
      const preset = getReadingPlan(planId);
      if (!preset) return null;
      return create(preset, true);
    },
    completeDay: (day: number) => {
      if (!active) return Promise.resolve(false);
      const total = active.schedule?.length ?? 0;
      return completeDay(day, total);
    },
    reload: async () => {},
  };
}
