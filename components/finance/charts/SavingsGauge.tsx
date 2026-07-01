"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { formatMoney } from "@/lib/finance/logic";
import { CHART } from "@/lib/finance/chartTheme";

export function SavingsGauge({
  saved,
  goal,
  label,
  monthsLeft,
}: {
  saved: number;
  goal: number;
  label: string | null;
  monthsLeft: number | null;
}) {
  const pct = goal > 0 ? Math.min(100, (saved / goal) * 100) : 0;
  const toGo = Math.max(0, goal - saved);
  const monthlyNeed = monthsLeft && monthsLeft > 0 ? Math.ceil(toGo / monthsLeft) : 0;

  const data = [{ name: "saved", value: pct, fill: CHART.income }];

  return (
    <div className="rv-chart-panel rv-savings-gauge">
      <div className="rv-chart-panel-head">
        <div>
          <h3>Savings goal</h3>
          <p>{label ?? "Progress toward target"}</p>
        </div>
        {monthsLeft !== null && <span className="rv-dash-badge">{monthsLeft} mo left</span>}
      </div>

      <div className="rv-gauge-layout">
        <div className="rv-gauge-ring">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="72%"
              outerRadius="100%"
              barSize={14}
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background={{ fill: "var(--rv-surface-2)" }}
                dataKey="value"
                cornerRadius={10}
                angleAxisId={0}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="rv-gauge-center">
            <div className="pct">{Math.round(pct)}%</div>
            <div className="sub">{formatMoney(saved, false)}</div>
          </div>
        </div>

        <div className="rv-gauge-stats">
          <div className="rv-gauge-stat">
            <span className="k">Target</span>
            <span className="v">{formatMoney(goal, false)}</span>
          </div>
          <div className="rv-gauge-stat">
            <span className="k">Still need</span>
            <span className="v" style={{ color: CHART.net }}>{formatMoney(toGo, false)}</span>
          </div>
          {monthlyNeed > 0 && (
            <div className="rv-gauge-stat">
              <span className="k">Per month</span>
              <span className="v" style={{ color: CHART.savings }}>~{formatMoney(monthlyNeed, false)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
