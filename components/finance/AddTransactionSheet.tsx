"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Trash2 } from "lucide-react";
import type { EntryDraft, TxnType } from "@/lib/finance/types";
import { categoriesFor, INTENTS } from "@/lib/finance/types";
import { sanitizeAmountInput, parseAmountInput, formatAmountDisplay } from "@/lib/finance/amountInput";
import { CategoryIcon } from "./CategoryIcon";
import { DebtLinkBadge } from "./DebtLinks";

const TYPES: TxnType[] = ["Income", "Expense", "Savings"];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AddTransactionSheet({
  open,
  initial,
  saving,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  initial: EntryDraft | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: EntryDraft) => void;
  onDelete: (id: number) => void;
}) {
  const [type, setType] = useState<TxnType>("Expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [intent, setIntent] = useState<string | null>(null);
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmDelete(false);
      return;
    }
    const editing = initial && typeof initial.id === "number";
    if (initial) {
      setType(initial.type);
      setAmount(initial.amount ? formatAmountDisplay(initial.amount) : "");
      setCategory(initial.category);
      setIntent(initial.intent);
      setDate(editing && initial.date ? initial.date : todayISO());
      setDescription(initial.description);
    } else {
      setType("Expense");
      setAmount("");
      setCategory("");
      setIntent(null);
      setDate(todayISO());
      setDescription("");
    }
    setConfirmDelete(false);
  }, [open, initial]);

  const cats = categoriesFor(type);
  useEffect(() => {
    if (!cats.some((c) => c.name === category)) {
      setCategory(cats[0]?.name ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const isEdit = typeof initial?.id === "number";
  const numericAmount = parseAmountInput(amount);
  const valid = numericAmount > 0 && category.length > 0;

  function handleSave() {
    if (!valid) return;
    onSave({
      id: initial?.id,
      type,
      amount: Math.abs(numericAmount),
      category,
      intent,
      date,
      description: description.trim() || category,
      debt_id: initial?.debt_id,
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="rv-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="rv-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            <div className="rv-sheet-grab" />
            <div className="rv-sheet-head">
              <h3>{isEdit ? "Edit transaction" : "New transaction"}</h3>
              <button className="rv-icon-btn" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {isEdit && initial?.debt_id && <DebtLinkBadge debtId={initial.debt_id} />}

            <div className="rv-segment">
              {TYPES.map((t) => (
                <button
                  key={t}
                  className={`${type === t ? "active" : ""} ${t.toLowerCase()}`}
                  onClick={() => setType(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="rv-amount-display">
              <span className="cur">GH₵</span>
              <input
                className="rv-amount-input"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
                autoFocus
              />
            </div>

            <div className="rv-field">
              <label className="rv-field-label">Category</label>
              <div className="rv-chips">
                {cats.map((c) => (
                  <button
                    key={c.name}
                    className={`rv-chip ${category === c.name ? "active" : ""}`}
                    onClick={() => setCategory(c.name)}
                  >
                    <span className="chip-dot" style={{ background: c.color }} />
                    <CategoryIcon name={c.icon} size={14} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="rv-field">
              <label className="rv-field-label">Intent</label>
              <div className="rv-chips">
                <button
                  className={`rv-chip ${intent === null ? "active" : ""}`}
                  onClick={() => setIntent(null)}
                >
                  None
                </button>
                {INTENTS.map((i) => (
                  <button
                    key={i}
                    className={`rv-chip ${intent === i ? "active" : ""}`}
                    onClick={() => setIntent(i)}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div className="rv-field">
              <label className="rv-field-label">Note</label>
              <input
                className="rv-input"
                placeholder={category || "What was it for?"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {isEdit ? (
              <div className="rv-field">
                <label className="rv-field-label">Date</label>
                <input
                  className="rv-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            ) : (
              <p className="rv-field-label" style={{ textAlign: "center", marginBottom: "1rem" }}>
                Dated {new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
            )}

            <button className="rv-btn" disabled={!valid || saving} onClick={handleSave}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add transaction"}
            </button>

            {isEdit && (
              <button
                className={`rv-btn-danger ${confirmDelete ? "confirm" : ""}`}
                disabled={saving}
                onClick={() => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    return;
                  }
                  onDelete(initial!.id!);
                }}
              >
                <Trash2 size={16} style={{ display: "inline", verticalAlign: "-3px", marginRight: 6 }} />
                {confirmDelete ? "Tap again to delete" : "Delete transaction"}
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
