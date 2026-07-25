"use client";

import { useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { FinanceEntry } from "@/lib/finance/types";
import { categoryMeta } from "@/lib/finance/types";
import { formatMoney } from "@/lib/finance/logic";
import type { DayGroup } from "@/lib/finance/logic";
import { CategoryIcon } from "./CategoryIcon";
import { haptic } from "@/lib/finance/haptics";

function SwipeRow({
  entry,
  onSelect,
  onDelete,
}: {
  entry: FinanceEntry;
  onSelect: (e: FinanceEntry) => void;
  onDelete: (e: FinanceEntry) => void;
}) {
  const startX = useRef(0);
  const [offset, setOffset] = useState(0);
  const meta = categoryMeta(entry.category, entry.type);
  const isIncome = entry.type === "Income";

  return (
    <div className="rv-swipe-wrap">
      <div className="rv-swipe-actions">
        <button type="button" className="edit" aria-label="Edit" onClick={() => { setOffset(0); onSelect(entry); }}>
          <Pencil size={16} />
        </button>
        <button type="button" className="del" aria-label="Delete" onClick={() => { setOffset(0); onDelete(entry); }}>
          <Trash2 size={16} />
        </button>
      </div>
      <button
        type="button"
        className={`rv-txn rv-swipe-content${offset < -20 ? " rv-swipe-content--open" : ""}`}
        style={{ transform: `translateX(${offset}px)` }}
        onClick={() => {
          if (offset < -20) {
            setOffset(0);
            return;
          }
          onSelect(entry);
        }}
        onTouchStart={(e) => {
          startX.current = e.touches[0].clientX;
        }}
        onTouchMove={(e) => {
          const dx = e.touches[0].clientX - startX.current;
          if (dx < 0) setOffset(Math.max(-108, dx));
          else if (offset < 0) setOffset(Math.min(0, offset + dx));
        }}
        onTouchEnd={() => {
          setOffset(offset < -54 ? -108 : 0);
          if (offset < -54) haptic("light");
        }}
      >
        <div className="rv-txn-icon" style={{ background: meta.color }}>
          <CategoryIcon name={meta.icon} size={20} />
        </div>
        <div className="rv-txn-body">
          <div className="rv-txn-title">{entry.description || entry.category}</div>
          <div className="rv-txn-sub">
            {entry.debt_id && <span className="rv-txn-debt-tag">Debt</span>}
            {entry.category}
            {entry.intent ? ` · ${entry.intent}` : ""}
          </div>
        </div>
        <div className={`rv-txn-amt ${isIncome ? "in" : ""}`}>
          {isIncome ? "+" : "−"}
          {formatMoney(Math.abs(Number(entry.amount)))}
        </div>
      </button>
    </div>
  );
}

export function TransactionList({
  groups,
  onSelect,
  onDelete,
  emptyHint,
  emptyAction,
}: {
  groups: DayGroup[];
  onSelect: (entry: FinanceEntry) => void;
  onDelete?: (entry: FinanceEntry) => void;
  emptyHint?: string;
  emptyAction?: { label: string; onClick: () => void };
}) {
  if (groups.length === 0) {
    return (
      <div className="rv-empty rv-empty-rich">
        <div className="rv-empty-icon">💳</div>
        <strong>No transactions yet</strong>
        <p>{emptyHint ?? "Log your first expense or income to get started."}</p>
        {emptyAction && (
          <button type="button" className="rv-btn rv-empty-btn" onClick={emptyAction.onClick}>
            {emptyAction.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {groups.map((g) => (
        <div key={g.iso}>
          <div className="rv-day-label">{g.label}</div>
          <div className="rv-txn-card">
            {g.entries.map((e) =>
              onDelete ? (
                <SwipeRow key={e.id} entry={e} onSelect={onSelect} onDelete={onDelete} />
              ) : (
                <button key={e.id} type="button" className="rv-txn" onClick={() => onSelect(e)}>
                  <div className="rv-txn-icon" style={{ background: categoryMeta(e.category, e.type).color }}>
                    <CategoryIcon name={categoryMeta(e.category, e.type).icon} size={20} />
                  </div>
                  <div className="rv-txn-body">
                    <div className="rv-txn-title">{e.description || e.category}</div>
                    <div className="rv-txn-sub">{e.category}</div>
                  </div>
                  <div className={`rv-txn-amt ${e.type === "Income" ? "in" : ""}`}>
                    {e.type === "Income" ? "+" : "−"}
                    {formatMoney(Math.abs(Number(e.amount)))}
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
