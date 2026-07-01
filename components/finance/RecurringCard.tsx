"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Repeat, Plus, Check, X, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { FinanceEntry, TxnType } from "@/lib/finance/types";
import { categoriesFor, categoryMeta, INTENTS } from "@/lib/finance/types";
import { formatMoney } from "@/lib/finance/logic";
import { seedRecurringIfEmpty, RECURRING_KEY, type RecurringTemplate } from "@/lib/finance/recurringDefaults";
import { CategoryIcon } from "./CategoryIcon";

const KEY = RECURRING_KEY;

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function RecurringCard({
  entries,
  onChanged,
  fullPage = false,
}: {
  entries: FinanceEntry[];
  onChanged: () => void;
  fullPage?: boolean;
}) {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [editor, setEditor] = useState<RecurringTemplate | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      let list = seedRecurringIfEmpty();
      if (list.length === 0) {
        const { data } = await supabase
          .from("finance_settings")
          .select("value")
          .eq("key", "recurring_templates")
          .maybeSingle();
        if (data?.value && Array.isArray(data.value)) {
          list = data.value as RecurringTemplate[];
          localStorage.setItem(KEY, JSON.stringify(list));
        }
      }
      setTemplates(list);
      setHydrated(true);
    }
    void init();
  }, []);

  function persist(next: RecurringTemplate[]) {
    setTemplates(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  // which category|type combos already logged this month
  const loggedThisMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const set = new Set<string>();
    for (const e of entries) {
      const d = new Date(`${e.date}T00:00:00`);
      if (d.getFullYear() === y && d.getMonth() === m) set.add(`${e.type}|${e.category}`);
    }
    return set;
  }, [entries]);

  async function logTemplate(t: RecurringTemplate) {
    setBusy(t.id);
    await supabase.from("finance_entries").insert({
      date: todayISO(),
      description: t.description || t.category,
      category: t.category,
      type: t.type,
      intent: t.intent,
      amount: t.amount,
    });
    setBusy(null);
    onChanged();
  }

  if (!hydrated) return null;

  return (
    <>
      <div className={fullPage ? "rv-recurring-page" : "rv-card"}>
        {!fullPage && (
          <div className="rv-card-head">
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Repeat size={16} color="var(--rv-primary)" /> Recurring
            </h3>
            <button
              className="rv-icon-btn"
              style={{ width: 30, height: 30, background: "var(--rv-surface-2)" }}
              aria-label="Add recurring"
              onClick={() => setEditor({ id: uid(), type: "Expense", category: "", amount: 0, intent: null, description: "" })}
            >
              <Plus size={16} />
            </button>
          </div>
        )}

        {fullPage && (
          <div className="rv-section-head" style={{ margin: "0 0 0.75rem" }}>
            <h2>This month</h2>
            <button onClick={() => setEditor({ id: uid(), type: "Expense", category: "", amount: 0, intent: null, description: "" })}>
              <Plus size={14} style={{ verticalAlign: "-2px" }} /> Add
            </button>
          </div>
        )}

        {templates.length === 0 ? (
          <div style={{ fontSize: "0.86rem", color: "var(--rv-muted)" }}>
            Add repeats like Salary, Tithe or Savings for one-tap logging each month.
          </div>
        ) : (
          <div className={fullPage ? "rv-txn-card" : undefined} style={{ display: "flex", flexDirection: "column", gap: fullPage ? 0 : "0.2rem" }}>
            {templates.map((t) => {
              const meta = categoryMeta(t.category, t.type);
              const done = loggedThisMonth.has(`${t.type}|${t.category}`);
              return (
                <div key={t.id} className="rv-txn" style={{ cursor: "default" }}>
                  <div className="rv-txn-icon" style={{ background: meta.color }}>
                    <CategoryIcon name={meta.icon} size={18} />
                  </div>
                  <div className="rv-txn-body">
                    <div className="rv-txn-title">{t.description || t.category}</div>
                    <div className="rv-txn-sub">{formatMoney(t.amount, false)} · monthly</div>
                  </div>
                  {done ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--rv-pos)", fontSize: "0.8rem", fontWeight: 600 }}>
                      <Check size={15} /> Logged
                    </span>
                  ) : (
                    <button
                      onClick={() => logTemplate(t)}
                      disabled={busy === t.id}
                      style={{ background: "var(--rv-primary)", color: "#fff", borderRadius: 100, padding: "0.4rem 0.85rem", fontSize: "0.82rem", fontWeight: 600 }}
                    >
                      {busy === t.id ? "…" : "Log now"}
                    </button>
                  )}
                  <button onClick={() => setEditor(t)} aria-label="Edit" style={{ marginLeft: 8, color: "var(--rv-muted)" }}>
                    <Pencil size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RecurringEditor
        template={editor}
        onClose={() => setEditor(null)}
        onSave={(t) => {
          const exists = templates.some((x) => x.id === t.id);
          persist(exists ? templates.map((x) => (x.id === t.id ? t : x)) : [...templates, t]);
          setEditor(null);
        }}
        onDelete={(id) => {
          persist(templates.filter((x) => x.id !== id));
          setEditor(null);
        }}
        isExisting={editor ? templates.some((x) => x.id === editor.id) : false}
      />
    </>
  );
}

function RecurringEditor({
  template,
  isExisting,
  onClose,
  onSave,
  onDelete,
}: {
  template: RecurringTemplate | null;
  isExisting: boolean;
  onClose: () => void;
  onSave: (t: RecurringTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const TYPES: TxnType[] = ["Income", "Expense", "Savings"];
  const [type, setType] = useState<TxnType>("Expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [intent, setIntent] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!template) return;
    setType(template.type);
    setAmount(template.amount ? String(template.amount) : "");
    setCategory(template.category);
    setIntent(template.intent);
    setDescription(template.description);
  }, [template]);

  const cats = categoriesFor(type);
  useEffect(() => {
    if (!cats.some((c) => c.name === category)) setCategory(cats[0]?.name ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const num = parseFloat(amount);
  const valid = num > 0 && category.length > 0;

  return (
    <AnimatePresence>
      {template && (
        <>
          <motion.div className="rv-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} />
          <motion.div className="rv-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }}>
            <div className="rv-sheet-grab" />
            <div className="rv-sheet-head">
              <h3>{isExisting ? "Edit recurring" : "New recurring"}</h3>
              <button className="rv-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
            </div>

            <div className="rv-segment">
              {TYPES.map((t) => (
                <button key={t} className={`${type === t ? "active" : ""} ${t.toLowerCase()}`} onClick={() => setType(t)}>{t}</button>
              ))}
            </div>

            <div className="rv-amount-display">
              <span className="cur">GH₵</span>
              <input
                className="rv-amount-input"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, "");
                  if ((v.match(/\./g)?.length ?? 0) <= 1) setAmount(v);
                }}
                autoFocus
              />
            </div>

            <div className="rv-field">
              <label className="rv-field-label">Category</label>
              <div className="rv-chips">
                {cats.map((c) => (
                  <button key={c.name} className={`rv-chip ${category === c.name ? "active" : ""}`} onClick={() => setCategory(c.name)}>
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
                <button className={`rv-chip ${intent === null ? "active" : ""}`} onClick={() => setIntent(null)}>None</button>
                {INTENTS.map((i) => (
                  <button key={i} className={`rv-chip ${intent === i ? "active" : ""}`} onClick={() => setIntent(i)}>{i}</button>
                ))}
              </div>
            </div>

            <div className="rv-field">
              <label className="rv-field-label">Label</label>
              <input className="rv-input" placeholder={category || "e.g. Monthly Salary"} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <button
              className="rv-btn"
              disabled={!valid}
              onClick={() => onSave({ id: template.id, type, amount: Math.abs(num), category, intent, description: description.trim() || category })}
            >
              {isExisting ? "Save" : "Add recurring"}
            </button>
            {isExisting && (
              <button className="rv-btn-danger" onClick={() => onDelete(template.id)}>
                <Trash2 size={16} style={{ display: "inline", verticalAlign: "-3px", marginRight: 6 }} />
                Remove
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
