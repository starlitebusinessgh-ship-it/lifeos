"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/finance/logic";
import type { FinanceEntry } from "@/lib/finance/types";
import { supabase } from "@/lib/supabase";
import { ENTRY_SELECT } from "@/lib/finance/entrySelect";

export function DebtPaymentHistory({ debtId }: { debtId: number }) {
  const [payments, setPayments] = useState<FinanceEntry[]>([]);

  useEffect(() => {
    function load() {
      void supabase
        .from("finance_entries")
        .select(ENTRY_SELECT)
        .eq("debt_id", debtId)
        .order("date", { ascending: false })
        .then(({ data }) => {
          if (data) setPayments(data as FinanceEntry[]);
        });
    }

    load();
    window.addEventListener("lifeos:finance-changed", load);
    return () => window.removeEventListener("lifeos:finance-changed", load);
  }, [debtId]);

  if (payments.length === 0) return null;

  return (
    <div className="rv-debt-payments">
      <div className="rv-field-label" style={{ marginBottom: "0.5rem" }}>Linked transactions</div>
      {payments.map((p) => (
        <div key={p.id} className="rv-debt-payment-row">
          <div>
            <div className="dt">{p.date}</div>
            <div className="desc">{p.description || p.category}</div>
          </div>
          <strong>{formatMoney(Number(p.amount), false)}</strong>
        </div>
      ))}
    </div>
  );
}

export function DebtLinkBadge({ debtId }: { debtId: number }) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    void supabase
      .from("finance_debts")
      .select("counterparty")
      .eq("id", debtId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setName(data.counterparty as string);
      });
  }, [debtId]);

  if (!name) return null;

  return (
    <Link href="/finance/debts" className="rv-debt-link-badge">
      Debt · {name}
    </Link>
  );
}
