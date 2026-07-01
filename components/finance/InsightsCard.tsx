"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Budget, FinanceEntry } from "@/lib/finance/types";
import {
  CURRENCY,
  computeBalance,
  monthSummary,
  savingsTotal,
  spendingByCategory,
  spentByCategoryMap,
} from "@/lib/finance/logic";
import { debtTotals, dueSoonDebts, daysUntil, remaining } from "@/lib/finance/debts";
import { monthsUntil } from "@/lib/finance/useSavingsGoal";
import type { InsightItem } from "@/lib/finance/insights";

const TONE_ICON = {
  positive: TrendingUp,
  warning: AlertTriangle,
  neutral: Info,
  critical: ShieldAlert,
};

const TONE_COLOR = {
  positive: "#16c79a",
  warning: "#ec7e00",
  neutral: "#5b61ff",
  critical: "#fb5a52",
};

export function InsightsCard({ entries }: { entries: FinanceEntry[] }) {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const [{ data: budgetsRaw }, { data: goalRow }, { data: debtsRaw }] = await Promise.all([
        supabase.from("finance_budget").select("id, category, type, monthly_budget"),
        supabase.from("finance_settings").select("value").eq("key", "savings_goal").maybeSingle(),
        supabase.from("finance_debts").select("id, direction, counterparty, amount, paid, due_date, note"),
      ]);

      const budgets = (budgetsRaw ?? []) as Budget[];
      const spent = spentByCategoryMap(entries);
      const summary = monthSummary(entries);
      const top = spendingByCategory(entries).slice(0, 5);
      const debts = debtsRaw ?? [];
      const totals = debtTotals(debts as Parameters<typeof debtTotals>[0]);
      const soon = dueSoonDebts(debts as Parameters<typeof dueSoonDebts>[0], 7);

      const goalVal = goalRow?.value as { amount?: number; deadline?: string } | undefined;
      const savingsGoal = Number(goalVal?.amount) || 20000;
      const savingsDeadline = goalVal?.deadline ?? "2026-11-30";
      const monthsLeft = monthsUntil(savingsDeadline);
      const saved = savingsTotal(entries);
      const monthlyTarget =
        monthsLeft && monthsLeft > 0 ? Math.ceil((savingsGoal - saved) / monthsLeft) : 4000;

      const metrics = {
        month: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        currency: CURRENCY,
        income: Math.round(summary.income),
        expense: Math.round(summary.expense),
        savings: Math.round(summary.savings),
        net: Math.round(summary.net),
        balance: Math.round(computeBalance(entries)),
        topCategories: top.map((c) => ({ category: c.category, total: Math.round(c.total) })),
        budgets: budgets
          .filter((b) => b.monthly_budget > 0)
          .map((b) => ({
            category: b.category,
            type: b.type,
            spent: Math.round(spent.get(b.category) ?? 0),
            budget: b.monthly_budget,
          })),
        savingsTotal: Math.round(saved),
        savingsGoal,
        savingsDeadline,
        savingsMonthsLeft: monthsLeft,
        monthlySavingsTarget: monthlyTarget,
        debtsOwedToMe: Math.round(totals.owedToMe),
        debtsIOwe: Math.round(totals.iOwe),
        debtsDueSoon: soon.map((d) => ({
          counterparty: d.counterparty,
          amount: Math.round(remaining(d)),
          daysUntil: daysUntil(d.due_date) ?? 0,
          direction: d.direction,
        })),
        nationalServiceEnds: "November 2026",
        salaryTypical: 2850,
      };

      try {
        const res = await fetch("/api/finance-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metrics),
        });
        const json = (await res.json()) as { insights: InsightItem[] };
        if (!cancelled) setInsights(json.insights ?? []);
      } catch {
        if (!cancelled) setInsights([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [entries]);

  return (
    <div className="rv-insights-panel">
      <div className="rv-insights-head">
        <Sparkles size={18} />
        <div>
          <h3>Financial intelligence</h3>
          <p>Personalised analysis for your situation</p>
        </div>
      </div>

      {loading ? (
        <div className="rv-insights-loading">
          <div className="rv-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
          <span>Analysing your finances…</span>
        </div>
      ) : insights.length === 0 ? (
        <p className="rv-insights-empty">Log a few transactions this month to unlock deep insights.</p>
      ) : (
        <div className="rv-insights-list">
          {insights.map((item, i) => {
            const Icon = TONE_ICON[item.tone] ?? Info;
            const color = TONE_COLOR[item.tone] ?? TONE_COLOR.neutral;
            return (
              <article key={i} className="rv-insight" style={{ borderLeftColor: color }}>
                <div className="rv-insight-top">
                  <Icon size={16} style={{ color }} />
                  <h4>{item.title}</h4>
                </div>
                <p>{item.body}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
