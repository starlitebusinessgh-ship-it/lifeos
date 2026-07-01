"use client";

import type { MonthSummary } from "@/lib/finance/logic";
import { formatMoney } from "@/lib/finance/logic";
import { CHART } from "@/lib/finance/chartTheme";

export function MonthSummaryStrip({ summary }: { summary: MonthSummary }) {
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });

  return (
    <div className="rv-month-strip">
      <div className="rv-month-strip-head">
        <span className="k">{monthName}</span>
        <span className={`net ${summary.net >= 0 ? "pos" : "neg"}`}>
          {summary.net >= 0 ? "+" : "−"}{formatMoney(Math.abs(summary.net), false)} net
        </span>
      </div>
      <div className="rv-month-cells">
        <div className="rv-month-cell" style={{ "--cell-color": CHART.income } as React.CSSProperties}>
          <span className="bar" />
          <span className="k">In</span>
          <span className="v">{formatMoney(summary.income, false)}</span>
        </div>
        <div className="rv-month-cell" style={{ "--cell-color": CHART.expense } as React.CSSProperties}>
          <span className="bar" />
          <span className="k">Out</span>
          <span className="v">{formatMoney(summary.expense, false)}</span>
        </div>
        <div className="rv-month-cell" style={{ "--cell-color": CHART.savings } as React.CSSProperties}>
          <span className="bar" />
          <span className="k">Saved</span>
          <span className="v">{formatMoney(summary.savings, false)}</span>
        </div>
      </div>
    </div>
  );
}
