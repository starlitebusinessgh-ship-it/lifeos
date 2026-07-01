"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { computeBalance, formatMoney } from "@/lib/finance/logic";
import { useDebts, dueSoonDebts, remaining, daysUntil } from "@/lib/finance/debts";
import { ENTRY_SELECT } from "@/lib/finance/entrySelect";
import type { FinanceEntry } from "@/lib/finance/types";

/** Minimal glance view — open from home screen shortcut or /glance bookmark. */
export default function GlancePage() {
  const { debts } = useDebts();
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void supabase
      .from("finance_entries")
      .select(ENTRY_SELECT)
      .then(({ data }) => {
        if (data) setEntries(data as FinanceEntry[]);
        setLoading(false);
      });
  }, []);

  const balance = useMemo(() => computeBalance(entries), [entries]);
  const due = useMemo(() => dueSoonDebts(debts, 14), [debts]);

  if (loading) {
    return (
      <div className="rv-glance">
        <div className="rv-spinner" />
      </div>
    );
  }

  return (
    <div className="rv-glance">
      <div className="rv-glance-card">
        <span className="k">Balance</span>
        <span className="v">{formatMoney(balance, false)}</span>
      </div>

      {due.length > 0 ? (
        <div className="rv-glance-due">
          <span className="k">Due soon</span>
          {due.map((d) => {
            const days = daysUntil(d.due_date);
            return (
              <div key={d.id} className="rv-glance-row">
                <span>{d.direction === "i_owe" ? `Pay ${d.counterparty}` : d.counterparty}</span>
                <span className="amt">{formatMoney(remaining(d), false)}</span>
                {days !== null && <span className="sub">{days <= 0 ? "overdue" : `${days}d`}</span>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rv-glance-ok">No debts due in the next 2 weeks</div>
      )}

      <Link href="/finance" className="rv-glance-open">
        Open full app →
      </Link>
    </div>
  );
}
