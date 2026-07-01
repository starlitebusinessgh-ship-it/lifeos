"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, ArrowDownLeft, ArrowUpRight, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { payDebt } from "@/lib/finance/debtPay";
import { formatMoney } from "@/lib/finance/logic";
import {
  useDebts,
  remaining,
  debtTotals,
  daysUntil,
  type Debt,
  type DebtDraft,
  type DebtDirection,
} from "@/lib/finance/debts";
import { DebtPaymentHistory } from "@/components/finance/DebtLinks";
import { PullToRefresh } from "@/components/finance/PullToRefresh";
import { SkeletonScreen } from "@/components/finance/Skeleton";
import { haptic } from "@/lib/finance/haptics";

function emptyDraft(direction: DebtDirection): DebtDraft {
  return { direction, counterparty: "", amount: 0, paid: 0, due_date: null, note: "" };
}

function DueChip({ due }: { due: string | null }) {
  const days = daysUntil(due);
  if (days === null) return null;
  let cls = "ok";
  let label: string;
  if (days < 0) {
    cls = "over";
    label = `${Math.abs(days)}d overdue`;
  } else if (days === 0) {
    cls = "soon";
    label = "Due today";
  } else if (days <= 7) {
    cls = "soon";
    label = `Due in ${days}d`;
  } else {
    label = `Due in ${days}d`;
  }
  return <span className={`rv-due ${cls}`}>{label}</span>;
}

export default function DebtsPage() {
  const { debts, loading, reload } = useDebts();
  const [draft, setDraft] = useState<DebtDraft | null>(null);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPay, setConfirmPay] = useState(false);

  const totals = useMemo(() => debtTotals(debts), [debts]);
  const owedToMe = useMemo(() => debts.filter((d) => d.direction === "owed_to_me"), [debts]);
  const iOwe = useMemo(() => debts.filter((d) => d.direction === "i_owe"), [debts]);

  function openNew(direction: DebtDirection) {
    setDraft(emptyDraft(direction));
  }

  function openEdit(d: Debt) {
    setEditDebt(d);
    setPayAmount(String(remaining(d)));
    setDraft({
      id: d.id,
      direction: d.direction,
      counterparty: d.counterparty,
      amount: Number(d.amount),
      paid: Number(d.paid),
      due_date: d.due_date,
      note: d.note ?? "",
    });
  }

  function closeSheet() {
    setDraft(null);
    setEditDebt(null);
    setPayAmount("");
    setConfirmDelete(false);
    setConfirmPay(false);
  }

  async function save() {
    if (!draft || !draft.counterparty.trim() || draft.amount <= 0) return;
    setSaving(true);
    const payload = {
      direction: draft.direction,
      counterparty: draft.counterparty.trim(),
      amount: draft.amount,
      paid: Math.min(draft.paid, draft.amount),
      due_date: draft.due_date || null,
      note: draft.note.trim() || null,
    };
    if (typeof draft.id === "number") {
      await supabase.from("finance_debts").update(payload).eq("id", draft.id);
    } else {
      await supabase.from("finance_debts").insert(payload);
    }
    setSaving(false);
    closeSheet();
    await reload();
  }

  async function settle(logTransaction: boolean) {
    if (!editDebt || typeof draft?.id !== "number") return;
    if (logTransaction && !confirmPay) {
      setConfirmPay(true);
      return;
    }
    setSaving(true);
    try {
      if (logTransaction) {
        const amt = parseFloat(payAmount) || remaining(editDebt);
        await payDebt(editDebt, amt);
        haptic("success");
      } else {
        await supabase.from("finance_debts").update({ paid: draft.amount }).eq("id", draft.id);
      }
    } finally {
      setSaving(false);
      closeSheet();
      await reload();
    }
  }

  async function remove() {
    if (!draft || typeof draft.id !== "number") return;
    setSaving(true);
    await supabase.from("finance_debts").delete().eq("id", draft.id);
    setSaving(false);
    closeSheet();
    await reload();
  }

  function renderRow(d: Debt) {
    const rem = remaining(d);
    const isIn = d.direction === "owed_to_me";
    const pct = d.amount > 0 ? Math.min(1, Number(d.paid) / Number(d.amount)) : 0;
    const settled = rem <= 0;
    return (
      <button className="rv-budget" key={d.id} onClick={() => openEdit(d)}>
        <div className="rv-budget-top">
          <div className="rv-budget-ico" style={{ background: isIn ? "var(--rv-pos)" : "var(--rv-neg)" }}>
            {isIn ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="rv-budget-name">{d.counterparty}</div>
            <div className="rv-debt-sub" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              {settled ? <span>Settled</span> : <DueChip due={d.due_date} />}
              {d.note && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.note}</span>}
            </div>
          </div>
          <div className="rv-budget-vals">
            <div className="spent" style={{ color: settled ? "var(--rv-muted)" : isIn ? "var(--rv-pos)" : "var(--rv-neg)" }}>
              {formatMoney(rem, false)}
            </div>
            {Number(d.paid) > 0 && !settled && (
              <div className="of">
                {formatMoney(Number(d.paid), false)} paid · {formatMoney(rem, false)} left
              </div>
            )}
            {Number(d.paid) === 0 && !settled && (
              <div className="of">of {formatMoney(Number(d.amount), false)}</div>
            )}
          </div>
        </div>
        {Number(d.paid) > 0 && (
          <div className="rv-track">
            <div className="rv-track-fill" style={{ width: `${pct * 100}%`, background: isIn ? "var(--rv-pos)" : "var(--rv-neg)" }} />
          </div>
        )}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="rv-shell">
        <SkeletonScreen />
      </div>
    );
  }

  const payAmt = editDebt ? parseFloat(payAmount) || remaining(editDebt) : 0;

  return (
    <PullToRefresh onRefresh={reload}>
    <div className="rv-shell">
      <div className="rv-screen-head">
        <h1>Debts</h1>
        <p>Money owed to you and money you owe</p>
      </div>

      <div className="rv-debt-stats">
        <div className="rv-debt-stat">
          <div className="k"><span className="dot in" /> Owed to me</div>
          <div className="v" style={{ color: "var(--rv-pos)" }}>{formatMoney(totals.owedToMe, false)}</div>
        </div>
        <div className="rv-debt-stat">
          <div className="k"><span className="dot out" /> I owe</div>
          <div className="v" style={{ color: "var(--rv-neg)" }}>{formatMoney(totals.iOwe, false)}</div>
        </div>
      </div>

      <div className="rv-card" style={{ padding: "1rem 1.2rem", marginBottom: "1.4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ color: "var(--rv-muted)", fontSize: "0.84rem" }}>Net position</span>
          <span style={{ fontSize: "1.15rem", fontWeight: 700, color: totals.net >= 0 ? "var(--rv-pos)" : "var(--rv-neg)" }}>
            {totals.net >= 0 ? "+" : "-"}{formatMoney(Math.abs(totals.net), false)}
          </span>
        </div>
      </div>

      <div className="rv-section-head">
        <h2>Owed to me</h2>
        <button onClick={() => openNew("owed_to_me")}><Plus size={14} style={{ verticalAlign: "-2px" }} /> Add</button>
      </div>
      {owedToMe.length > 0 ? (
        <div className="rv-card" style={{ padding: "0.4rem 1.2rem", marginBottom: "1.4rem" }}>{owedToMe.map(renderRow)}</div>
      ) : (
        <div className="rv-empty">Nobody owes you right now.</div>
      )}

      <div className="rv-section-head">
        <h2>I owe</h2>
        <button onClick={() => openNew("i_owe")}><Plus size={14} style={{ verticalAlign: "-2px" }} /> Add</button>
      </div>
      {iOwe.length > 0 ? (
        <div className="rv-card" style={{ padding: "0.4rem 1.2rem", marginBottom: "1.4rem" }}>{iOwe.map(renderRow)}</div>
      ) : (
        <div className="rv-empty">You don&apos;t owe anyone. Nice.</div>
      )}

      <AnimatePresence>
        {draft && (
          <>
            <motion.div className="rv-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={closeSheet} />
            <motion.div className="rv-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }}>
              <div className="rv-sheet-grab" />
              <div className="rv-sheet-head">
                <h3>{typeof draft.id === "number" ? "Edit debt" : "New debt"}</h3>
                <button className="rv-icon-btn" onClick={closeSheet} aria-label="Close"><X size={18} /></button>
              </div>

              <div className="rv-segment" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <button className={draft.direction === "owed_to_me" ? "active income" : ""} onClick={() => setDraft({ ...draft, direction: "owed_to_me" })}>Owed to me</button>
                <button className={draft.direction === "i_owe" ? "active expense" : ""} onClick={() => setDraft({ ...draft, direction: "i_owe" })}>I owe</button>
              </div>

              <div className="rv-amount-display">
                <span className="cur">GH₵</span>
                <input
                  className="rv-amount-input"
                  inputMode="decimal"
                  placeholder="0"
                  value={draft.amount ? String(draft.amount) : ""}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, "");
                    if ((v.match(/\./g)?.length ?? 0) <= 1) setDraft({ ...draft, amount: parseFloat(v) || 0 });
                  }}
                  autoFocus
                />
              </div>

              <div className="rv-field">
                <label className="rv-field-label">{draft.direction === "owed_to_me" ? "Who owes you" : "Who you owe"}</label>
                <input className="rv-input" placeholder="Name" value={draft.counterparty} onChange={(e) => setDraft({ ...draft, counterparty: e.target.value })} />
              </div>

              <div className="rv-field">
                <label className="rv-field-label">Already paid (optional)</label>
                <input
                  className="rv-input"
                  inputMode="decimal"
                  placeholder="0"
                  value={draft.paid ? String(draft.paid) : ""}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, "");
                    if ((v.match(/\./g)?.length ?? 0) <= 1) setDraft({ ...draft, paid: parseFloat(v) || 0 });
                  }}
                />
              </div>

              <div className="rv-field">
                <label className="rv-field-label">Due date (optional)</label>
                <input className="rv-input" type="date" value={draft.due_date ?? ""} onChange={(e) => setDraft({ ...draft, due_date: e.target.value || null })} />
              </div>

              <div className="rv-field">
                <label className="rv-field-label">Note (optional)</label>
                <input className="rv-input" placeholder="e.g. MTN loan" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
              </div>

              <button className="rv-btn" disabled={saving || !draft.counterparty.trim() || draft.amount <= 0} onClick={save}>
                {saving ? "Saving…" : "Save"}
              </button>

              {typeof draft.id === "number" && editDebt && (
                <DebtPaymentHistory debtId={editDebt.id} />
              )}

              {typeof draft.id === "number" && editDebt && remaining(editDebt) > 0 && (
                <>
                  <div className="rv-field">
                    <label className="rv-field-label">
                      {draft.direction === "i_owe" ? "Payment amount" : "Amount received"}
                    </label>
                    <input
                      className="rv-input"
                      inputMode="decimal"
                      value={payAmount}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.]/g, "");
                        if ((v.match(/\./g)?.length ?? 0) <= 1) setPayAmount(v);
                      }}
                    />
                  </div>
                  {confirmPay ? (
                    <div className="rv-pay-confirm">
                      <p>
                        {draft.direction === "i_owe"
                          ? `Pay ${formatMoney(payAmt, false)} to ${editDebt.counterparty}?`
                          : `Record ${formatMoney(payAmt, false)} received from ${editDebt.counterparty}?`}
                      </p>
                      <p className="sub">This will log a transaction and update the debt.</p>
                      <button type="button" className="rv-btn" disabled={saving} onClick={() => settle(true)}>
                        {saving ? "Processing…" : "Confirm payment"}
                      </button>
                      <button type="button" className="rv-btn-danger" style={{ background: "var(--rv-surface-2)", color: "var(--rv-muted)" }} onClick={() => setConfirmPay(false)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                  <button
                    type="button"
                    className="rv-btn"
                    disabled={saving}
                    onClick={() => settle(true)}
                  >
                    {draft.direction === "i_owe" ? "Pay & log expense" : "Record received & log income"}
                  </button>
                  <button
                    type="button"
                    className="rv-btn-danger"
                    style={{ color: "var(--rv-muted)", background: "var(--rv-surface-2)" }}
                    disabled={saving}
                    onClick={() => settle(false)}
                  >
                    Mark settled only (no transaction)
                  </button>
                    </>
                  )}
                </>
              )}

              {typeof draft.id === "number" && (
                <>
                  <button
                    className={`rv-btn-danger ${confirmDelete ? "confirm" : ""}`}
                    disabled={saving}
                    onClick={() => {
                      if (!confirmDelete) {
                        setConfirmDelete(true);
                        return;
                      }
                      void remove();
                    }}
                  >
                    <Trash2 size={15} style={{ verticalAlign: "-3px", marginRight: "0.3rem" }} />
                    {confirmDelete ? "Tap again to delete" : "Delete debt"}
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </PullToRefresh>
  );
}
