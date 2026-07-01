"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { CategorySlice } from "@/lib/finance/logic";
import { formatMoney } from "@/lib/finance/logic";
import { categoryMeta } from "@/lib/finance/types";
import { CATEGORY_PALETTE } from "@/lib/finance/chartTheme";

type Slice = CategorySlice & { color: string; pct: number };

export function CategoryChart({ slices }: { slices: CategorySlice[] }) {
  const [active, setActive] = useState(0);
  const total = slices.reduce((a, s) => a + s.total, 0);
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });

  const data: Slice[] = slices.map((s, i) => ({
    ...s,
    color: categoryMeta(s.category, "Expense").color || CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
    pct: total > 0 ? (s.total / total) * 100 : 0,
  }));

  const focus = data[active];

  return (
    <div className="rv-chart-panel">
      <div className="rv-chart-panel-head">
        <div>
          <h3>Spending by category</h3>
          <p>{monthName} breakdown</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="rv-chart-empty">No spending logged this month yet.</div>
      ) : (
        <>
          <div className="rv-donut-layout">
            <div className="rv-donut-large">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius="62%"
                    outerRadius="88%"
                    paddingAngle={3}
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {data.map((d) => (
                      <Cell key={d.category} fill={d.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="rv-donut-center rv-donut-center-lg">
                <div className="lbl">{focus?.category ?? "Total"}</div>
                <div className="amt">{formatMoney(focus?.total ?? total, false)}</div>
                <div className="pct">{Math.round(focus?.pct ?? 100)}%</div>
              </div>
            </div>

            <div className="rv-cat-list">
              {data.map((d, i) => (
                <button
                  key={d.category}
                  type="button"
                  className={`rv-cat-row ${i === active ? "active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setActive(i)}
                >
                  <span className="dot" style={{ background: d.color }} />
                  <span className="nm">{d.category}</span>
                  <span className="vl">{formatMoney(d.total, false)}</span>
                  <div className="rv-cat-bar">
                    <div className="rv-cat-bar-fill" style={{ width: `${d.pct}%`, background: d.color }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rv-chart-total">
            <span>Total spent</span>
            <strong>{formatMoney(total, false)}</strong>
          </div>
        </>
      )}
    </div>
  );
}
