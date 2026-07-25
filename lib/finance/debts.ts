"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type DebtDirection = "owed_to_me" | "i_owe";

export interface Debt {
  id: number;
  direction: DebtDirection;
  counterparty: string;
  amount: number;
  paid: number;
  due_date: string | null;
  note: string | null;
  created_at: string;
}

export interface DebtDraft {
  id?: number;
  direction: DebtDirection;
  counterparty: string;
  amount: number;
  paid: number;
  due_date: string | null;
  note: string;
}

/** Remaining outstanding amount on a debt. */
export function remaining(d: Pick<Debt, "amount" | "paid">): number {
  return Math.max(0, Number(d.amount) - Number(d.paid));
}

export interface DebtTotals {
  owedToMe: number;
  iOwe: number;
  net: number;
}

export function debtTotals(debts: Debt[]): DebtTotals {
  let owedToMe = 0;
  let iOwe = 0;
  for (const d of debts) {
    const rem = remaining(d);
    if (d.direction === "owed_to_me") owedToMe += rem;
    else iOwe += rem;
  }
  return { owedToMe, iOwe, net: owedToMe - iOwe };
}

/** Debts with remaining balance due within `withinDays` (or overdue). */
export function dueSoonDebts(debts: Debt[], withinDays = 7): Debt[] {
  return debts.filter((d) => {
    if (remaining(d) <= 0 || !d.due_date) return false;
    const days = daysUntil(d.due_date);
    return days !== null && days <= withinDays;
  });
}

/** Days until a due date. Negative = overdue. null when no due date. */
export function daysUntil(due: string | null): number | null {
  if (!due) return null;
  const d = new Date(`${due}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("finance_debts")
      .select("id, direction, counterparty, amount, paid, due_date, note, created_at")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (!error && data) setDebts(data as Debt[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onChange = () => {
      void reload();
    };
    window.addEventListener("lifeos:finance-changed", onChange);
    return () => window.removeEventListener("lifeos:finance-changed", onChange);
  }, [reload]);

  return { debts, loading, reload };
}
