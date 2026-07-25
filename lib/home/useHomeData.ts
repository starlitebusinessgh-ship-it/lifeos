"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ENTRY_SELECT } from "@/lib/finance/entrySelect";
import type { FinanceEntry } from "@/lib/finance/types";
import { computeBalance, monthSummary, savingsTotal } from "@/lib/finance/logic";
import { useDebts } from "@/lib/finance/debts";
import { buildHomeBriefing } from "./briefing";

export function useHomeData() {
  const { debts, loading: debtsLoading, reload: reloadDebts } = useDebts();
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data } = await supabase.from("finance_entries").select(ENTRY_SELECT);
    if (data) setEntries(data as FinanceEntry[]);
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

  const balance = useMemo(() => computeBalance(entries), [entries]);
  const month = useMemo(() => monthSummary(entries), [entries]);
  const saved = useMemo(() => savingsTotal(entries), [entries]);

  const briefing = useMemo(
    () => buildHomeBriefing({ debts, month }),
    [debts, month]
  );

  return {
    briefing,
    entries,
    balance,
    month,
    saved,
    loading: loading || debtsLoading,
    reload: async () => {
      await Promise.all([reload(), reloadDebts()]);
    },
  };
}
