"use client";

import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell } from "recharts";
import { ChevronRight } from "lucide-react";
import type { CategorySlice, MonthSummary } from "@/lib/finance/logic";
import { formatMoney } from "@/lib/finance/logic";
import { categoryMeta } from "@/lib/finance/types";

export function SpendingDonut({
  slices,
  summary,
}: {
  slices: CategorySlice[];
  summary: MonthSummary;
}) {
  const router = useRouter();
  const total = slices.reduce((a, s) => a + s.total, 0);
  const data = slices.map((s) => ({ ...s, color: categoryMeta(s.category, "Expense").color }));
  const top = data.slice(0, 4);
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });

  function goAnalytics() {
    router.push("/finance/analytics");
  }

  return (
    <button type="button" className="rv-card rv-card-link rv-card-tap" onClick={goAnalytics}>
      <div className="rv-card-head">
        <h3>Analytics · {monthName}</h3>
        <ChevronRight size={18} className="more" />
      </div>

      {total > 0 ? (
        <div className="rv-donut-wrap rv-no-pointer">
          <div className="rv-donut">
            <PieChart width={128} height={128}>
              <Pie
                data={data}
                dataKey="total"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={47}
                outerRadius={63}
                paddingAngle={2}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((d) => (
                  <Cell key={d.category} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="rv-donut-center">
              <div>
                <div className="lbl">Spent</div>
                <div className="amt">{formatMoney(total, false)}</div>
              </div>
            </div>
          </div>
          <div className="rv-legend">
            {top.map((d) => (
              <div className="rv-legend-row" key={d.category}>
                <span className="dot" style={{ background: d.color }} />
                <span className="nm">{d.category}</span>
                <span className="vl">{formatMoney(d.total, false)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ color: "var(--rv-muted)", fontSize: "0.88rem", padding: "0.5rem 0 1rem" }}>
          No spending logged this month yet. Tap for full charts →
        </div>
      )}

      <div className="rv-mini-summary">
        <div className="cell">
          <div className="k"><span className="dot in" /> In</div>
          <div className="v">{formatMoney(summary.income, false)}</div>
        </div>
        <div className="cell">
          <div className="k"><span className="dot out" /> Out</div>
          <div className="v">{formatMoney(summary.expense, false)}</div>
        </div>
        <div className="cell">
          <div className="k"><span className="dot save" /> Saved</div>
          <div className="v">{formatMoney(summary.savings, false)}</div>
        </div>
      </div>
    </button>
  );
}
