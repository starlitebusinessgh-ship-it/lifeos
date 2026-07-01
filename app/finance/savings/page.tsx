"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Plus, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEntries } from "@/lib/finance/useEntries";
import type { EntryDraft } from "@/lib/finance/types";
import { savingsTotal, groupByDay, formatMoney } from "@/lib/finance/logic";
import { useSavingsGoal, monthsUntil } from "@/lib/finance/useSavingsGoal";
import { TransactionList } from "@/components/finance/TransactionList";
import { AddTransactionSheet } from "@/components/finance/AddTransactionSheet";
import { PullToRefresh } from "@/components/finance/PullToRefresh";
import { SkeletonScreen } from "@/components/finance/Skeleton";
import { useToast } from "@/components/finance/ToastProvider";
import { haptic } from "@/lib/finance/haptics";

export default function SavingsPage() {
  const { entries, loading, reload, saveEntry, deleteEntry } = useEntries();
  const { showToast } = useToast();
  const { goal, loading: goalLoading, save: saveGoalToDb } = useSavingsGoal();
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<EntryDraft | null>(null);
  const [editEntry, setEditEntry] = useState<EntryDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const total = useMemo(() => savingsTotal(entries), [entries]);
  const savingsEntries = useMemo(() => entries.filter((e) => e.type === "Savings"), [entries]);
  const groups = useMemo(() => groupByDay(savingsEntries.slice(0, 20)), [savingsEntries]);

  const goalAmount = goal.amount;
  const pct = goalAmount > 0 ? Math.min(1, total / goalAmount) : 0;
  const monthsLeft = monthsUntil(goal.deadline);
  const r = 50;
  const c = 2 * Math.PI * r;

  async function saveGoal() {
    const v = Math.max(0, parseFloat(goalDraft) || 0);
    await saveGoalToDb(v, goal.deadline, goal.label);
    setGoalOpen(false);
  }

  function openAdd() {
    haptic("light");
    setDraft({ type: "Savings", amount: 0, category: "Savings Transfer", intent: "Investment", date: "", description: "" });
    setAddOpen(true);
  }

  async function handleSave(d: EntryDraft) {
    setSaving(true);
    const saved = await saveEntry(d);
    setSaving(false);
    if (saved) {
      haptic("success");
      setAddOpen(false);
      setEditEntry(null);
    }
  }

  async function handleDelete(id: number) {
    setSaving(true);
    const removed = await deleteEntry(id);
    setSaving(false);
    if (removed) {
      setAddOpen(false);
      setEditEntry(null);
      showToast("Transfer deleted", {
        label: "Undo",
        onClick: () => {
          void supabase.from("finance_entries").insert({
            date: removed.date,
            description: removed.description,
            category: removed.category,
            type: removed.type,
            intent: removed.intent,
            amount: removed.amount,
            debt_id: removed.debt_id,
          }).then(() => reload());
        },
      });
    }
  }

  if ((loading || goalLoading) && entries.length === 0) {
    return (
      <div className="rv-shell">
        <SkeletonScreen />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={reload}>
      <div className="rv-shell">
        <div className="rv-screen-head">
          <h1>Savings</h1>
          <p>Money set aside — still part of your total balance</p>
        </div>

        <div className="rv-goal-card">
          <div className="rv-goal-ring">
            <svg width="116" height="116" viewBox="0 0 116 116" aria-hidden>
              <circle cx="58" cy="58" r={r} fill="none" stroke="var(--rv-surface-2)" strokeWidth="9" />
              <circle
                cx="58" cy="58" r={r} fill="none" stroke="#16c79a" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={c - pct * c} transform="rotate(-90 58 58)"
              />
            </svg>
            <div className="ctr">{goalAmount > 0 ? `${Math.round(pct * 100)}%` : "—"}</div>
          </div>
          <div className="rv-goal-info">
            <div className="k">Saved so far</div>
            <div className="v">{formatMoney(total, false)}</div>
            <div className="sub">
              {goalAmount > 0 ? `of ${formatMoney(goalAmount, false)} goal` : "No goal set yet"}
            </div>
            {goal.label && goal.deadline && (
              <div className="sub" style={{ marginTop: "0.35rem" }}>
                {goal.label} · {monthsLeft ?? "—"} months left
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.6rem" }}>
          <button type="button" className="rv-btn" onClick={openAdd} style={{ flex: 1 }}>
            <Plus size={16} style={{ display: "inline", verticalAlign: "-3px", marginRight: 6 }} />
            Add to savings
          </button>
          <button
            type="button"
            className="rv-btn"
            onClick={() => { setGoalDraft(goalAmount ? String(goalAmount) : ""); setGoalOpen(true); }}
            style={{ flex: 1, background: "var(--rv-surface-2)", color: "var(--rv-ink)" }}
          >
            <Target size={16} style={{ display: "inline", verticalAlign: "-3px", marginRight: 6 }} />
            {goalAmount > 0 ? "Edit goal" : "Set goal"}
          </button>
        </div>

        <div className="rv-section-head"><h2>Transfers</h2></div>
        <TransactionList
          groups={groups}
          onSelect={(e) => {
            setEditEntry({
              id: e.id,
              type: e.type,
              amount: Math.abs(Number(e.amount)),
              category: e.category,
              intent: e.intent,
              date: e.date,
              description: e.description,
              debt_id: e.debt_id,
            });
            setAddOpen(true);
          }}
          emptyAction={{ label: "Add to savings", onClick: openAdd }}
          emptyHint="Move money to your savings pocket to track progress."
        />

        <AddTransactionSheet
          open={addOpen}
          initial={editEntry ?? draft}
          saving={saving}
          onClose={() => { setAddOpen(false); setEditEntry(null); }}
          onSave={handleSave}
          onDelete={handleDelete}
        />

        <AnimatePresence>
          {goalOpen && (
            <>
              <motion.div className="rv-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setGoalOpen(false)} />
              <motion.div className="rv-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }}>
                <div className="rv-sheet-grab" />
                <div className="rv-sheet-head">
                  <h3>Savings goal</h3>
                  <button type="button" className="rv-icon-btn" onClick={() => setGoalOpen(false)} aria-label="Close"><X size={18} /></button>
                </div>
                <div className="rv-amount-display">
                  <span className="cur">GH₵</span>
                  <input
                    className="rv-amount-input"
                    inputMode="decimal"
                    placeholder="0"
                    value={goalDraft}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, "");
                      if ((v.match(/\./g)?.length ?? 0) <= 1) setGoalDraft(v);
                    }}
                    autoFocus
                  />
                </div>
                <button type="button" className="rv-btn" onClick={saveGoal}>Save goal</button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PullToRefresh>
  );
}
