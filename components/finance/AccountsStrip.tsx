"use client";

import Link from "next/link";
import { PiggyBank, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/finance/logic";

/** Savings pocket chip — part of your total balance, not a separate account. */
export function AccountsStrip({ savings }: { bank: number; savings: number }) {
  return (
    <div className="rv-accounts">
      <Link href="/finance/savings" className="rv-acct rv-acct-link rv-acct-wide" aria-label="Open savings pocket">
        <div className="rv-acct-top">
          <div className="rv-acct-badge" style={{ background: "rgba(5, 150, 105, 0.12)", color: "#059669" }}>
            <PiggyBank size={16} />
          </div>
          <span className="rv-acct-name">Savings pocket</span>
          <ChevronRight size={16} style={{ marginLeft: "auto", color: "var(--rv-faint)" }} />
        </div>
        <div className="rv-acct-bal">{formatMoney(savings, false)}</div>
        <p className="rv-acct-hint">Included in your total balance above — money you&apos;ve set aside.</p>
      </Link>
    </div>
  );
}
