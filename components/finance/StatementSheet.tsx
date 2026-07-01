"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Download } from "lucide-react";
import type { FinanceEntry } from "@/lib/finance/types";
import {
  monthEntries,
  monthSummary,
  groupByDay,
  toCSV,
  formatMoney,
} from "@/lib/finance/logic";
import { TransactionList } from "./TransactionList";

export function StatementSheet({
  open,
  entries,
  onClose,
}: {
  open: boolean;
  entries: FinanceEntry[];
  onClose: () => void;
}) {
  const ref = new Date();
  const monthName = ref.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const ym = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;

  const monthList = useMemo(() => monthEntries(entries), [entries]);
  const summary = useMemo(() => monthSummary(entries), [entries]);
  const groups = useMemo(() => groupByDay(monthList), [monthList]);

  function exportCSV() {
    const blob = new Blob([toCSV(monthList)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifeos-statement-${ym}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="rv-search"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          style={{ overflowY: "auto" }}
        >
          <div className="rv-search-bar">
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, flex: 1 }}>Statement · {monthName}</h3>
            <button className="rv-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>

          <div className="rv-card">
            <div className="rv-mini-summary" style={{ justifyContent: "space-between" }}>
              <div className="cell"><div className="k"><span className="dot in" /> In</div><div className="v">{formatMoney(summary.income, false)}</div></div>
              <div className="cell"><div className="k"><span className="dot out" /> Out</div><div className="v">{formatMoney(summary.expense, false)}</div></div>
              <div className="cell"><div className="k"><span className="dot save" /> Saved</div><div className="v">{formatMoney(summary.savings, false)}</div></div>
            </div>
            <div style={{ borderTop: "1px solid var(--rv-hairline)", marginTop: "1rem", paddingTop: "0.9rem", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ color: "var(--rv-muted)", fontSize: "0.85rem" }}>Net</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, color: summary.net >= 0 ? "var(--rv-pos)" : "var(--rv-neg)" }}>
                {summary.net >= 0 ? "+" : "−"}{formatMoney(Math.abs(summary.net), false)}
              </span>
            </div>
          </div>

          <button className="rv-btn" onClick={exportCSV} style={{ marginBottom: "1.4rem" }}>
            <Download size={16} style={{ display: "inline", verticalAlign: "-3px", marginRight: 6 }} />
            Export CSV
          </button>

          <div className="rv-section-head"><h2>{monthList.length} transactions</h2></div>
          <div style={{ paddingBottom: "2rem" }}>
            <TransactionList groups={groups} onSelect={() => {}} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
