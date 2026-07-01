"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEntries } from "@/lib/finance/useEntries";
import type { Budget } from "@/lib/finance/types";
import { categoryMeta } from "@/lib/finance/types";
import { spentByCategoryMap, formatMoney } from "@/lib/finance/logic";
import { CategoryIcon } from "@/components/finance/CategoryIcon";
import { PullToRefresh } from "@/components/finance/PullToRefresh";
import { SkeletonScreen } from "@/components/finance/Skeleton";

function barColor(ratio: number, isExpense: boolean) {
  if (!isExpense) return "#16c79a";
  if (ratio >= 1) return "#fb5a52";
  if (ratio >= 0.8) return "#ec7e00";
  return "#5b61ff";
}

export default function BudgetsPage() {
  const { entries, loading: entriesLoading, reload: reloadEntries } = useEntries();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [draftAmount, setDraftAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const loadBudgets = useCallback(async () => {
    const { data } = await supabase
      .from("finance_budget")
      .select("id, category, type, monthly_budget")
      .order("type", { ascending: true });
    if (data) setBudgets(data as Budget[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadBudgets();
  }, [loadBudgets]);

  async function refreshAll() {
    await Promise.all([reloadEntries(), loadBudgets()]);
  }

  const spentMap = useMemo(() => spentByCategoryMap(entries), [entries]);
  const expenseBudgets = budgets.filter((b) => b.type === "Expense" && b.monthly_budget > 0);
  const targetBudgets = budgets.filter((b) => b.type !== "Expense" && b.monthly_budget > 0);
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });

  function openEdit(b: Budget) {
    setEditing(b);
    setDraftAmount(String(b.monthly_budget));
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const value = Math.max(0, parseFloat(draftAmount) || 0);
    await supabase.from("finance_budget").update({ monthly_budget: value }).eq("id", editing.id);
    setSaving(false);
    setEditing(null);
    await loadBudgets();
  }

  function renderRow(b: Budget) {
    const meta = categoryMeta(b.category, b.type);
    const spent = spentMap.get(b.category) ?? 0;
    const ratio = b.monthly_budget > 0 ? spent / b.monthly_budget : 0;
    const isExpense = b.type === "Expense";
    const color = barColor(ratio, isExpense);
    const warn = isExpense && ratio >= 0.8;
    return (
      <button type="button" className="rv-budget" key={b.id} onClick={() => openEdit(b)}>
        <div className="rv-budget-top">
          <div className="rv-budget-ico" style={{ background: meta.color }}>
            <CategoryIcon name={meta.icon} size={18} />
          </div>
          <span className="rv-budget-name">{b.category}</span>
          <div className="rv-budget-vals">
            <div className="spent">{formatMoney(spent, false)}</div>
            <div className="of">of {formatMoney(b.monthly_budget, false)}</div>
          </div>
        </div>
        {warn && (
          <div className={`rv-budget-warn ${ratio >= 1 ? "over" : ""}`}>
            {ratio >= 1 ? "Over budget" : `${Math.round(ratio * 100)}% used`}
          </div>
        )}
        <div className="rv-track">
          <div className="rv-track-fill" style={{ width: `${Math.min(100, ratio * 100)}%`, background: color }} />
        </div>
      </button>
    );
  }

  if ((loading || entriesLoading) && budgets.length === 0) {
    return (
      <div className="rv-shell">
        <SkeletonScreen />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={refreshAll}>
      <div className="rv-shell">
        <div className="rv-screen-head">
          <h1>Budgets</h1>
          <p>{monthName} · tap any budget to adjust</p>
        </div>

        {expenseBudgets.length > 0 ? (
          <div className="rv-card" style={{ padding: "0.4rem 1.2rem" }}>
            {expenseBudgets.map(renderRow)}
          </div>
        ) : (
          <div className="rv-empty rv-empty-rich">
            <strong>No budgets yet</strong>
            <p>Seed budgets in Supabase or tap a category once added.</p>
          </div>
        )}

        {targetBudgets.length > 0 && (
          <>
            <div className="rv-section-head"><h2>Targets</h2></div>
            <div className="rv-card" style={{ padding: "0.4rem 1.2rem" }}>
              {targetBudgets.map(renderRow)}
            </div>
          </>
        )}

        <AnimatePresence>
          {editing && (
            <>
              <motion.div className="rv-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setEditing(null)} />
              <motion.div className="rv-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }}>
                <div className="rv-sheet-grab" />
                <div className="rv-sheet-head">
                  <h3>{editing.category}</h3>
                  <button type="button" className="rv-icon-btn" onClick={() => setEditing(null)} aria-label="Close"><X size={18} /></button>
                </div>
                <div className="rv-amount-display">
                  <span className="cur">GH₵</span>
                  <input
                    className="rv-amount-input"
                    inputMode="decimal"
                    placeholder="0"
                    value={draftAmount}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, "");
                      if ((v.match(/\./g)?.length ?? 0) <= 1) setDraftAmount(v);
                    }}
                    autoFocus
                  />
                </div>
                <p style={{ textAlign: "center", color: "var(--rv-muted)", fontSize: "0.82rem", marginBottom: "1.2rem" }}>
                  Monthly budget for {editing.category}
                </p>
                <button type="button" className="rv-btn" disabled={saving} onClick={saveEdit}>
                  {saving ? "Saving…" : "Save budget"}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PullToRefresh>
  );
}
