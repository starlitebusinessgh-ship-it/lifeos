"use client";

import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { useEntries } from "@/lib/finance/useEntries";
import { useSavingsGoal, monthsUntil } from "@/lib/finance/useSavingsGoal";
import {
  monthSummary,
  monthlySeries,
  spendingByCategory,
  intentBreakdown,
  savingsTotal,
} from "@/lib/finance/logic";
import { CashflowChart } from "@/components/finance/charts/CashflowChart";
import { CategoryChart } from "@/components/finance/charts/CategoryChart";
import { IntentChart } from "@/components/finance/charts/IntentChart";
import { SavingsGauge } from "@/components/finance/charts/SavingsGauge";
import { MonthSummaryStrip } from "@/components/finance/charts/MonthSummaryStrip";
import { StatementSheet } from "@/components/finance/StatementSheet";
import { PullToRefresh } from "@/components/finance/PullToRefresh";
import { SkeletonScreen } from "@/components/finance/Skeleton";

export default function AnalyticsPage() {
  const { entries, loading, reload } = useEntries();
  const { goal } = useSavingsGoal();
  const [statementOpen, setStatementOpen] = useState(false);

  const summary = useMemo(() => monthSummary(entries), [entries]);
  const series = useMemo(() => monthlySeries(entries, 6), [entries]);
  const slices = useMemo(() => spendingByCategory(entries), [entries]);
  const intents = useMemo(() => intentBreakdown(entries), [entries]);
  const saved = useMemo(() => savingsTotal(entries), [entries]);
  const monthsLeft = monthsUntil(goal.deadline);
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });

  if (loading && entries.length === 0) {
    return (
      <div className="rv-shell">
        <SkeletonScreen />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={reload}>
      <div className="rv-shell rv-analytics">
        <div className="rv-screen-head">
          <h1>Analytics</h1>
          <p>{monthName} · charts &amp; trends</p>
        </div>

        <MonthSummaryStrip summary={summary} />
        <CashflowChart data={series} />

        {goal.amount > 0 && (
          <SavingsGauge saved={saved} goal={goal.amount} label={goal.label} monthsLeft={monthsLeft} />
        )}

        <CategoryChart slices={slices} />
        <IntentChart slices={intents} />

        <button
          type="button"
          className="rv-btn"
          onClick={() => setStatementOpen(true)}
          style={{ background: "var(--rv-surface)", color: "var(--rv-ink)", marginBottom: "1rem" }}
        >
          <FileText size={16} style={{ display: "inline", verticalAlign: "-3px", marginRight: 6 }} />
          Monthly statement &amp; export
        </button>

        <StatementSheet open={statementOpen} entries={entries} onClose={() => setStatementOpen(false)} />
      </div>
    </PullToRefresh>
  );
}
