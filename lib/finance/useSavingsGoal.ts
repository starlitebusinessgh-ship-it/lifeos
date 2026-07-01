"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface SavingsGoal {
  amount: number;
  deadline: string | null;
  label: string | null;
}

const GOAL_KEY = "savings_goal";
const LS_KEY = "lifeos.finance.savingsGoal";

export function useSavingsGoal() {
  const [goal, setGoal] = useState<SavingsGoal>({ amount: 0, deadline: null, label: null });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data } = await supabase
      .from("finance_settings")
      .select("value")
      .eq("key", GOAL_KEY)
      .maybeSingle();

    if (data?.value && typeof data.value === "object") {
      const v = data.value as Record<string, unknown>;
      setGoal({
        amount: Number(v.amount) || 0,
        deadline: typeof v.deadline === "string" ? v.deadline : null,
        label: typeof v.label === "string" ? v.label : null,
      });
    } else {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setGoal({ amount: Number(raw) || 0, deadline: null, label: null });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function save(amount: number, deadline: string | null = null, label: string | null = null) {
    const value = { amount, deadline, label };
    await supabase.from("finance_settings").upsert({
      key: GOAL_KEY,
      value,
      updated_at: new Date().toISOString(),
    });
    localStorage.setItem(LS_KEY, String(amount));
    setGoal(value);
  }

  return { goal, loading, reload, save };
}

/** Months left until deadline (inclusive of current month). */
export function monthsUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  const end = new Date(`${deadline}T00:00:00`);
  const now = new Date();
  return Math.max(0, (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth()) + 1);
}
