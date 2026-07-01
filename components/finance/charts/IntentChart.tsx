"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { IntentSlice } from "@/lib/finance/logic";
import { formatMoney } from "@/lib/finance/logic";
import { INTENT_COLORS } from "@/lib/finance/types";
import { CHART } from "@/lib/finance/chartTheme";

function Tip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { intent: string; total: number; pct: number } }[];
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rv-chart-tip">
      <div className="rv-chart-tip-label">{d.intent}</div>
      <div className="rv-chart-tip-row">
        <strong>{formatMoney(d.total, false)}</strong>
        <span style={{ marginLeft: 8, color: "var(--rv-muted)" }}>{Math.round(d.pct)}%</span>
      </div>
    </div>
  );
}

export function IntentChart({ slices }: { slices: IntentSlice[] }) {
  const total = slices.reduce((a, s) => a + s.total, 0);
  const data = slices.map((s) => ({
    ...s,
    pct: total > 0 ? (s.total / total) * 100 : 0,
    color: INTENT_COLORS[s.intent] ?? "#94a3b8",
  }));

  return (
    <div className="rv-chart-panel">
      <div className="rv-chart-panel-head">
        <div>
          <h3>Where it went</h3>
          <p>By intent — Necessary, Giving, Optional, Investment</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="rv-chart-empty">No outflow this month yet.</div>
      ) : (
        <div className="rv-chart-wrap rv-chart-wrap-intent">
          <ResponsiveContainer width="100%" height={Math.max(120, data.length * 52)}>
            <BarChart data={data} layout="vertical" barCategoryGap="24%" margin={{ top: 4, right: 64, left: 4, bottom: 4 }}>
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis
                type="category"
                dataKey="intent"
                axisLine={false}
                tickLine={false}
                tick={{ fill: CHART.axis, fontSize: 12, fontWeight: 600 }}
                width={84}
              />
              <Tooltip content={<Tip />} cursor={{ fill: CHART.cursor }} />
              <Bar dataKey="total" radius={[0, 8, 8, 0]} maxBarSize={24}>
                {data.map((d) => (
                  <Cell key={d.intent} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
