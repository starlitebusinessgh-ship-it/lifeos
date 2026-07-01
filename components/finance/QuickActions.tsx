"use client";

import Link from "next/link";
import { Plus, ArrowUpRight, PiggyBank, BarChart3 } from "lucide-react";
import type { TxnType } from "@/lib/finance/types";

export function QuickActions({ onAdd }: { onAdd: (type: TxnType) => void }) {
  return (
    <div className="rv-actions">
      <div className="rv-action">
        <button type="button" className="rv-action-btn primary" onClick={() => onAdd("Income")} aria-label="Add money">
          <Plus size={22} />
        </button>
        <span className="rv-action-label">Add money</span>
      </div>
      <div className="rv-action">
        <button type="button" className="rv-action-btn" onClick={() => onAdd("Expense")} aria-label="Add spending">
          <ArrowUpRight size={22} />
        </button>
        <span className="rv-action-label">Spend</span>
      </div>
      <div className="rv-action">
        <button type="button" className="rv-action-btn" onClick={() => onAdd("Savings")} aria-label="Move to savings">
          <PiggyBank size={22} />
        </button>
        <span className="rv-action-label">Save</span>
      </div>
      <div className="rv-action">
        <Link href="/finance/analytics" className="rv-action-btn" aria-label="Analytics">
          <BarChart3 size={22} />
        </Link>
        <span className="rv-action-label">Analytics</span>
      </div>
    </div>
  );
}
