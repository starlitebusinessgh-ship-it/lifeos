"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search } from "lucide-react";
import type { FinanceEntry, TxnType } from "@/lib/finance/types";
import { groupByDay } from "@/lib/finance/logic";
import { TransactionList } from "./TransactionList";

type Filter = "All" | TxnType;
const FILTERS: Filter[] = ["All", "Income", "Expense", "Savings"];

export function SearchOverlay({
  open,
  entries,
  onClose,
  onSelect,
  onDelete,
}: {
  open: boolean;
  entries: FinanceEntry[];
  onClose: () => void;
  onSelect: (entry: FinanceEntry) => void;
  onDelete?: (entry: FinanceEntry) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = entries.filter((e) => {
      if (filter !== "All" && e.type !== filter) return false;
      if (!q) return true;
      return (
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.intent ?? "").toLowerCase().includes(q)
      );
    });
    return groupByDay(filtered);
  }, [entries, query, filter]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="rv-search"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
        >
          <div className="rv-search-bar">
            <div className="rv-search-input-wrap">
              <Search size={17} color="var(--rv-muted)" />
              <input
                autoFocus
                placeholder="Search transactions"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button className="rv-search-cancel" onClick={onClose}>Cancel</button>
          </div>

          <div className="rv-search-filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`rv-chip ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="rv-search-results">
            <TransactionList groups={groups} onSelect={onSelect} onDelete={onDelete} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
