"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEntries } from "@/lib/finance/useEntries";
import type { Budget } from "@/lib/finance/types";
import { spentByCategoryMap, formatMoney } from "@/lib/finance/logic";

const DISMISS_KEY = "lifeos.budgetAlerts.dismissed";

interface Alert {
  category: string;
  spent: number;
  budget: number;
  pct: number;
  over: boolean;
}

export function BudgetAlerts({ month }: { month?: string }) {
  const { entries } = useEntries();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DISMISS_KEY);
      if (raw) setDismissed(new Set(JSON.parse(raw) as string[]));
    } catch {}
  }, []);

  useEffect(() => {
    void supabase
      .from("finance_budget")
      .select("id, category, type, monthly_budget")
      .then(({ data }) => {
        if (data) setBudgets(data as Budget[]);
      });
  }, []);

  const alerts = useMemo(() => {
    const ref = month
      ? (() => {
          const [y, m] = month.split("-").map(Number);
          return new Date(y, (m ?? 1) - 1, 1);
        })()
      : new Date();
    const spent = spentByCategoryMap(entries, ref);
    const list: Alert[] = [];
    for (const b of budgets) {
      if (b.type !== "Expense" || b.monthly_budget <= 0) continue;
      const s = spent.get(b.category) ?? 0;
      const pct = s / b.monthly_budget;
      if (pct >= 0.8) {
        list.push({
          category: b.category,
          spent: s,
          budget: b.monthly_budget,
          pct,
          over: pct >= 1,
        });
      }
    }
    return list.sort((a, b) => b.pct - a.pct);
  }, [budgets, entries, month]);

  const visible = alerts.filter((a) => !dismissed.has(a.category));
  if (visible.length === 0) return null;

  function dismiss(category: string) {
    const next = new Set(dismissed);
    next.add(category);
    setDismissed(next);
    sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...next]));
  }

  return (
    <div className="rv-budget-alerts">
      {visible.map((a) => (
        <div key={a.category} className={`rv-budget-alert ${a.over ? "over" : "warn"}`}>
          <AlertTriangle size={16} />
          <div className="rv-budget-alert-body">
            <strong>{a.category}</strong>
            <span>
              {a.over
                ? `Over by ${formatMoney(a.spent - a.budget, false)} — limit ${formatMoney(a.budget, false)}`
                : `${Math.round(a.pct * 100)}% of ${formatMoney(a.budget, false)} · ${formatMoney(a.spent, false)} spent`}
            </span>
          </div>
          <Link href="/finance/budgets" className="rv-budget-alert-link">View</Link>
          <button type="button" className="rv-budget-alert-x" onClick={() => dismiss(a.category)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
