"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { MonthPoint } from "@/lib/finance/logic";
import { formatMoney } from "@/lib/finance/logic";
import { CHART, SERIES_LABELS } from "@/lib/finance/chartTheme";

function Tip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rv-chart-tip">
      <div className="rv-chart-tip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="rv-chart-tip-row">
          <span className="dot" style={{ background: p.color }} />
          <span>{SERIES_LABELS[p.dataKey] ?? p.dataKey}</span>
          <strong>{formatMoney(p.value, false)}</strong>
        </div>
      ))}
    </div>
  );
}

export function CashflowChart({ data }: { data: MonthPoint[] }) {
  const hasData = data.some((d) => d.income + d.expense + d.savings !== 0);

  return (
    <div className="rv-chart-panel rv-chart-panel-hero">
      <div className="rv-chart-panel-head">
        <div>
          <h3>Cashflow</h3>
          <p>Income, spending &amp; savings over time</p>
        </div>
        <span className="rv-dash-badge">6 mo</span>
      </div>

      <div className="rv-chart-legend rv-chart-legend-row">
        <span><i style={{ background: CHART.income }} /> Income</span>
        <span><i style={{ background: CHART.expense }} /> Expenses</span>
        <span><i style={{ background: CHART.savings }} /> Savings</span>
        <span><i style={{ background: CHART.net }} /> Net</span>
      </div>

      {!hasData ? (
        <div className="rv-chart-empty">Log transactions to see your cashflow trend.</div>
      ) : (
        <div className="rv-chart-wrap rv-chart-wrap-tall">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} barCategoryGap="20%" barGap={3} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.income} stopOpacity={1} />
                  <stop offset="100%" stopColor={CHART.income} stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.expense} stopOpacity={1} />
                  <stop offset="100%" stopColor={CHART.expense} stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="gradSavings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.savings} stopOpacity={1} />
                  <stop offset="100%" stopColor={CHART.savings} stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: CHART.axis, fontSize: 11, fontWeight: 500 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: CHART.axis, fontSize: 10 }}
                tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                width={36}
              />
              <Tooltip content={<Tip />} cursor={{ fill: CHART.cursor }} />
              <ReferenceLine y={0} stroke={CHART.grid} />
              <Bar dataKey="income" fill="url(#gradIncome)" radius={[6, 6, 0, 0]} maxBarSize={22} />
              <Bar dataKey="expense" fill="url(#gradExpense)" radius={[6, 6, 0, 0]} maxBarSize={22} />
              <Bar dataKey="savings" fill="url(#gradSavings)" radius={[6, 6, 0, 0]} maxBarSize={22} />
              <Line
                type="monotone"
                dataKey="net"
                stroke={CHART.net}
                strokeWidth={2.5}
                dot={{ r: 4, fill: CHART.net, stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: CHART.net, stroke: CHART.savings, strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
