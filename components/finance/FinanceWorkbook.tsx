"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FINANCE_ASSUMPTIONS,
  GOALS,
  PORTFOLIO,
  getEmergencyTargets,
  PRINCIPLES_CONTENT,
  WEEKLY_CHECKLIST,
  WEEKLY_QUESTIONS,
  CATEGORIES_REF,
  TYPES_REF,
} from "@/lib/finance/assumptions";
import {
  DEFAULT_MONTH,
  DEFAULT_YEAR,
  EXPENSE_COLORS,
  INCOME_COLORS,
  SAVINGS_COLORS,
  AVAILABLE_YEARS,
} from "@/lib/finance/theme";
import type {
  AgentAction,
  AgentChatMessage,
  CategoryBudgetRow,
  FinanceAgentResponse,
  FinanceBudget,
  FinanceEntry,
  FinanceTabId,
} from "@/lib/finance/types";
import {
  buildCategoryRows,
  computeActualNetWorth,
  computeLoanBalance,
  computeMonthSnapshot,
  computeMonthStats,
  computeMonthlyTrend,
  computeTrackedByCategory,
  computeRunningBalance,
  contractMonthsRemaining,
  formatAmount,
  formatDateShort,
  formatPct,
  formatPct1,
  formatRowAmount,
  generateAllMonthKeys,
  generateMonthOptions,
  getWeeksInMonth,
  monthBounds,
  monthLabel,
  normalizeType,
  projectedBankAtContractEnd,
  projectedNetWorth,
  remainingSalaryMonths,
  sumRows,
} from "@/lib/finance/utils";
import { FinanceAgentPanel } from "./FinanceAgentPanel";
import { FinanceInsightsFeed } from "./FinanceInsightsFeed";
import { FinanceTabBar } from "./FinanceTabBar";
import { FinanceShell, FinanceSection } from "./FinanceShell";
import {
  card,
  cell,
  ChartBox,
  DataTable,
  StatRow,
  ErrorBanner,
  FinanceSelect,
  KpiGrid,
  LoadingText,
  SheetTitle,
  ACCENT,
  BG,
  BORDER,
  TEXT,
  TEXT_MUTED,
} from "./shared";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  buildFinancialMemory,
  generateInsights,
} from "@/lib/finance/insights";

function ExcelSection({
  title,
  headerBg,
  rows,
}: {
  title: string;
  headerBg: string;
  rows: CategoryBudgetRow[];
}) {
  const totals = sumRows(rows);
  const totalPct = totals.budget > 0 ? totals.tracked / totals.budget : 0;
  const colHeaders = ["Category", "Tracked", "Budget", "% Compl.", "Remaining", "Excess"];

  return (
    <>
      <tr>
        <td
          colSpan={6}
          style={{
            ...cell,
            fontWeight: 700,
            fontSize: 13,
            backgroundColor: headerBg,
            borderTop: `2px solid ${BORDER}`,
          }}
        >
          {title}
        </td>
      </tr>
      <tr style={{ backgroundColor: "#F3F4F6" }}>
        {colHeaders.map((h, i) => (
          <th
            key={h}
            style={{
              ...cell,
              fontWeight: 600,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "#6B7280",
              textAlign: i === 0 ? "left" : "right",
            }}
          >
            {h}
          </th>
        ))}
      </tr>
      {rows.map((row) => (
        <tr key={`${row.type}-${row.category}`}>
          <td style={{ ...cell, fontWeight: 500 }}>{row.category}</td>
          <td style={{ ...cell, textAlign: "right", fontWeight: 500, color: row.tracked > 0 ? TEXT : TEXT_MUTED }}>
            {formatAmount(row.tracked)}
          </td>
          <td style={{ ...cell, textAlign: "right", color: "#6B7280" }}>
            {formatAmount(row.budget)}
          </td>
          <td style={{ ...cell, textAlign: "right" }}>{formatPct(row.pctComplete)}</td>
          <td style={{ ...cell, textAlign: "right" }}>{formatAmount(row.remaining)}</td>
          <td
            style={{
              ...cell,
              textAlign: "right",
              color: row.excess > 0 ? "#DC2626" : TEXT,
              fontWeight: row.excess > 0 ? 600 : 400,
            }}
          >
            {formatAmount(row.excess)}
          </td>
        </tr>
      ))}
      <tr style={{ backgroundColor: "#F9FAFB", fontWeight: 700 }}>
        <td style={cell}>Total</td>
        <td style={{ ...cell, textAlign: "right" }}>{formatAmount(totals.tracked)}</td>
        <td style={{ ...cell, textAlign: "right" }}>{formatAmount(totals.budget)}</td>
        <td style={{ ...cell, textAlign: "right" }}>{formatPct(totalPct)}</td>
        <td style={{ ...cell, textAlign: "right" }}>{formatAmount(totals.remaining)}</td>
        <td style={{ ...cell, textAlign: "right" }}>{formatAmount(totals.excess)}</td>
      </tr>
      <tr>
        <td
          colSpan={6}
          style={{
            ...cell,
            height: 10,
            padding: 0,
            backgroundColor: BG,
            borderLeft: "none",
            borderRight: "none",
          }}
        />
      </tr>
    </>
  );
}

function DonutCard({
  title,
  data,
  colors,
  emptyMsg,
}: {
  title: string;
  data: { name: string; value: number }[];
  colors: string[];
  emptyMsg: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div style={{ ...card, padding: 12, flex: 1, minWidth: 0 }}>
      <p
        style={{
          textAlign: "center",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          color: "#6B7280",
          marginBottom: 8,
        }}
      >
        {title}
      </p>
      {total > 0 ? (
        <ChartBox height={140}>
          <div style={{ position: "relative", height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={2}
                stroke="none"
              >
                {data.map((d, i) => (
                  <Cell key={d.name} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatAmount(Number(v) || 0)} />
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>Total</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{formatAmount(total)}</span>
          </div>
        </div>
        </ChartBox>
      ) : (
        <p
          style={{
            height: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "#9CA3AF",
            textAlign: "center",
            margin: 0,
          }}
        >
          {emptyMsg}
        </p>
      )}
    </div>
  );
}

export default function FinanceWorkbook() {
  const [activeTab, setActiveTab] = useState<FinanceTabId>("executive");
  const [selectedMonth, setSelectedMonth] = useState(DEFAULT_MONTH);
  const [selectedYear, setSelectedYear] = useState(DEFAULT_YEAR);
  const [allEntries, setAllEntries] = useState<FinanceEntry[]>([]);
  const [budgets, setBudgets] = useState<FinanceBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentLoadingLabel, setAgentLoadingLabel] = useState("Working…");
  const [agentMessages, setAgentMessages] = useState<AgentChatMessage[]>([]);
  const [cursorAgentId, setCursorAgentId] = useState<string | null>(null);
  const [forceCursor, setForceCursor] = useState(false);
  const [weeklyChecks, setWeeklyChecks] = useState<Record<string, boolean>>({});
  const [weeklyNotes, setWeeklyNotes] = useState("");

  const monthOptions = useMemo(
    () => generateMonthOptions(selectedYear),
    [selectedYear]
  );

  useEffect(() => {
    if (!monthOptions.some((o) => o.value === selectedMonth)) {
      setSelectedMonth(monthOptions[0]?.value ?? DEFAULT_MONTH);
    }
  }, [monthOptions, selectedMonth]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lifeos-cursor-agent-id");
      if (saved) setCursorAgentId(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const monthStats = useMemo(
    () => computeMonthStats(allEntries, selectedMonth),
    [allEntries, selectedMonth]
  );

  const trackedByCategory = useMemo(
    () => computeTrackedByCategory(allEntries, selectedMonth),
    [allEntries, selectedMonth]
  );

  const categoryRows = useMemo(
    () => buildCategoryRows(budgets, trackedByCategory),
    [budgets, trackedByCategory]
  );

  const incomeRows = categoryRows.filter((r) => r.type === "Income");
  const expenseRows = categoryRows.filter((r) => r.type === "Expense");
  const savingsRows = categoryRows.filter((r) => r.type === "Savings");

  const trendMonths = useMemo(
    () => generateAllMonthKeys(`${selectedYear}-01`, `${selectedYear}-12`),
    [selectedYear]
  );

  const monthlyTrend = useMemo(
    () => computeMonthlyTrend(allEntries, trendMonths),
    [allEntries, trendMonths]
  );

  const netWorthMonths = useMemo(
    () => generateAllMonthKeys("2026-06", "2026-11"),
    []
  );

  const netWorthChartData = useMemo(() => {
    const invested = PORTFOLIO.tbills + PORTFOLIO.liquidity;
    return netWorthMonths.map((key) => {
      const { end } = monthBounds(key);
      const hasData = allEntries.some((e) => e.date <= end);
      return {
        month: monthLabel(key).replace(" ", "\n"),
        planned: projectedNetWorth(key, allEntries) + invested,
        actual: hasData
          ? computeActualNetWorth(allEntries, key) + invested
          : null,
      };
    });
  }, [allEntries, netWorthMonths]);

  const loanBalance = useMemo(
    () => computeLoanBalance(allEntries),
    [allEntries]
  );

  const runningBalance = useMemo(
    () => computeRunningBalance(allEntries),
    [allEntries]
  );

  const todayIso = new Date().toISOString().slice(0, 10);

  const financeInsights = useMemo(
    () =>
      generateInsights({
        entries: allEntries,
        monthKey: selectedMonth,
        savingsRate: monthStats.savingsRate,
        monthlySavings: monthStats.savings,
        income: monthStats.income,
        expenses: monthStats.expenses,
        loanBalance,
        bankBalance: runningBalance.bank,
        monthsLeftContract: contractMonthsRemaining(
          todayIso,
          FINANCE_ASSUMPTIONS.contractEnd
        ),
      }),
    [allEntries, selectedMonth, monthStats, loanBalance, runningBalance.bank, todayIso]
  );

  const financialMemory = useMemo(
    () => buildFinancialMemory(allEntries),
    [allEntries]
  );

  const barData = categoryRows
    .filter((r) => r.budget > 0 || r.tracked > 0)
    .map((r) => ({
      name: r.category.length > 8 ? `${r.category.slice(0, 7)}…` : r.category,
      fullName: r.category,
      tracked: r.tracked,
      budget: r.budget,
    }));

  const fetchFinanceData = useCallback(async () => {
    setError(null);
    const [entriesResult, budgetResult] = await Promise.all([
      supabase
        .from("finance_entries")
        .select("id, date, description, category, type, intent, amount, created_at")
        .order("date", { ascending: false }),
      supabase
        .from("finance_budget")
        .select("id, category, type, monthly_budget")
        .order("type")
        .order("category"),
    ]);

    if (entriesResult.error) {
      setError(`Entries: ${entriesResult.error.message}`);
      return;
    }
    if (budgetResult.error) {
      setError(`Budget: ${budgetResult.error.message}`);
      return;
    }

    setAllEntries(entriesResult.data ?? []);
    setBudgets(budgetResult.data ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await fetchFinanceData();
      setLoading(false);
    })();
  }, [fetchFinanceData]);

  useEffect(() => {
    try {
      const checks = localStorage.getItem(`finance-weekly-${selectedMonth}`);
      const notes = localStorage.getItem(`finance-notes-${selectedMonth}`);
      setWeeklyChecks(checks ? (JSON.parse(checks) as Record<string, boolean>) : {});
      setWeeklyNotes(notes ?? "");
    } catch {
      setWeeklyChecks({});
      setWeeklyNotes("");
    }
  }, [selectedMonth]);

  function persistWeeklyChecks(next: Record<string, boolean>) {
    setWeeklyChecks(next);
    localStorage.setItem(`finance-weekly-${selectedMonth}`, JSON.stringify(next));
  }

  function persistWeeklyNotes(next: string) {
    setWeeklyNotes(next);
    localStorage.setItem(`finance-notes-${selectedMonth}`, next);
  }

  async function executeActions(actions: AgentAction[]) {
    let needRefresh = false;
    for (const action of actions) {
      switch (action.type) {
        case "log": {
          if (action.transactions.length === 0) break;
          const rows = action.transactions.map((t) => ({
            date: t.date,
            description: t.description,
            category: t.category,
            type: t.type,
            intent: t.intent,
            amount: t.amount,
          }));
          const { error: err } = await supabase.from("finance_entries").insert(rows);
          if (err) {
            setError(err.message);
            return;
          }
          needRefresh = true;
          break;
        }
        case "delete": {
          const { error: err } = await supabase
            .from("finance_entries")
            .delete()
            .eq("id", action.entryId);
          if (err) {
            setError(err.message);
            return;
          }
          needRefresh = true;
          break;
        }
        case "switch_tab":
          setActiveTab(action.tab);
          break;
        case "set_month":
          setSelectedMonth(action.month);
          break;
        case "set_year":
          setSelectedYear(action.year);
          break;
      }
    }
    if (needRefresh) await fetchFinanceData();
  }

  async function handleAgentSubmit(
    text: string,
    options?: { forceCursor?: boolean; newSession?: boolean }
  ) {
    setAgentLoading(true);
    setAgentLoadingLabel(
      options?.forceCursor ? "Cursor agent working (may take a minute)…" : "Working…"
    );
    setError(null);
    const userMsg: AgentChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      timestamp: Date.now(),
    };
    setAgentMessages((m) => [...m, userMsg]);

    try {
      const history = agentMessages.slice(-10).map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));

      const res = await fetch("/api/lifeos-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          history,
          cursorAgentId: options?.newSession ? undefined : cursorAgentId ?? undefined,
          forceCursor: options?.forceCursor ?? false,
          newSession: options?.newSession ?? false,
        }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const errText =
          data && typeof data === "object" && "error" in data
            ? String((data as { error: string }).error)
            : "Agent failed to respond.";
        setError(errText);
        setAgentMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: "agent",
            text: errText,
            timestamp: Date.now(),
          },
        ]);
        return;
      }
      const result = data as FinanceAgentResponse;
      if (result.cursorAgentId) {
        setCursorAgentId(result.cursorAgentId);
        try {
          localStorage.setItem("lifeos-cursor-agent-id", result.cursorAgentId);
        } catch {
          /* ignore */
        }
      }
      await executeActions(result.actions);
      if (result.source === "cursor") {
        await fetchFinanceData();
      }
      setAgentMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "agent",
          text: result.reply,
          timestamp: Date.now(),
        },
      ]);
    } catch {
      const errText = "LifeOS agent failed. Check connection and API keys.";
      setError(errText);
      setAgentMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "agent",
          text: errText,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setAgentLoading(false);
      setAgentLoadingLabel("Working…");
    }
  }

  function handleNewCursorSession() {
    setCursorAgentId(null);
    try {
      localStorage.removeItem("lifeos-cursor-agent-id");
    } catch {
      /* ignore */
    }
  }

  const investedTotal = PORTFOLIO.tbills + PORTFOLIO.liquidity;
  const totalAssets = runningBalance.bank + investedTotal;
  const currentNetWorth = totalAssets - loanBalance;
  const salaryMonthsLeft = remainingSalaryMonths(todayIso);
  const atContractEndNW =
    projectedBankAtContractEnd(runningBalance.bank, salaryMonthsLeft) +
    PORTFOLIO.tbills +
    PORTFOLIO.liquidity;
  const savingsRateLabel =
    monthStats.income > 0 ? formatPct1(monthStats.savingsRate) : "Awaiting salary";
  const savedThisMonthLabel =
    monthStats.income > 0 ? formatAmount(monthStats.savings) : "GH₵0";

  const monthsLeft = contractMonthsRemaining(
    todayIso,
    FINANCE_ASSUMPTIONS.contractEnd
  );
  const projectedAtEnd =
    runningBalance.bank +
    monthsLeft * FINANCE_ASSUMPTIONS.plannedMonthlyNetSavings;
  const fiNumber =
    FINANCE_ASSUMPTIONS.monthlyEssentialSpending * 12 * FINANCE_ASSUMPTIONS.fiMultiple;
  const fiProgress = currentNetWorth / fiNumber;
  const weeks = getWeeksInMonth(selectedMonth);

  const PERIOD_TABS: FinanceTabId[] = ["executive", "budget", "monthly", "weekly"];

  const monthYearToolbar = (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, color: TEXT_MUTED }}>Month</span>
        <FinanceSelect
          ariaLabel="Select month"
          value={selectedMonth}
          onChange={setSelectedMonth}
          options={monthOptions}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, color: TEXT_MUTED }}>Year</span>
        <FinanceSelect
          ariaLabel="Select year"
          value={selectedYear}
          onChange={(y) => {
            setSelectedYear(y);
            setSelectedMonth(`${y}-06`);
          }}
          options={AVAILABLE_YEARS.map((y) => ({ value: y, label: y }))}
          compact
        />
      </div>
    </div>
  );

  function renderExecutive() {
    return (
      <>
        <FinanceSection>
          <div style={{ ...card, padding: "24px 22px" }}>
            <p style={{ margin: 0, fontSize: 12, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Net worth
            </p>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 36,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              {formatAmount(currentNetWorth)}
            </p>
            <p style={{ margin: "10px 0 0", fontSize: 14, color: TEXT_MUTED }}>
              Bank {formatAmount(runningBalance.bank)} · Debt {formatAmount(loanBalance)}
            </p>
          </div>
        </FinanceSection>

        <FinanceSection title="This month">
          <StatRow
            items={[
              { label: "Savings rate", value: loading ? "…" : savingsRateLabel },
              { label: "Saved", value: loading ? "…" : savedThisMonthLabel },
              { label: "Salary months left", value: String(monthsLeft) },
              {
                label: "Projected Nov",
                value: formatAmount(atContractEndNW),
                sub: "if plan holds",
              },
            ]}
          />
        </FinanceSection>

        <div className="finance-split">
          <FinanceSection title="Net worth trend">
            <div style={{ ...card, padding: 16 }}>
              <ChartBox height={220}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={netWorthChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: TEXT_MUTED }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: TEXT_MUTED }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip formatter={(v) => formatAmount(Number(v) || 0)} />
                    <Line type="monotone" dataKey="planned" stroke={TEXT_MUTED} strokeDasharray="4 4" name="Planned" dot={false} strokeWidth={1.5} />
                    <Line type="monotone" dataKey="actual" stroke={ACCENT} name="Actual" connectNulls={false} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>
          </FinanceSection>

          <FinanceSection title="Insights">
            <FinanceInsightsFeed insights={financeInsights} memory={financialMemory} />
          </FinanceSection>
        </div>
      </>
    );
  }

  function renderBudget() {
    return (
      <>
        <SheetTitle
          title="Budget Dashboard"
          subtitle="Tracked = logged this month · Budget = monthly target"
        />
        <div style={{ ...card, overflow: "hidden", marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: "#F9FAFB" }}>
                {[
                  "Month",
                  "Period Compl.",
                  "Period Tracking Balance",
                  "Period Savings Rate",
                ].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      ...cell,
                      textAlign: i === 0 ? "left" : "right",
                      fontWeight: 600,
                      color: TEXT_MUTED,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...cell, fontWeight: 500 }}>{monthLabel(selectedMonth)}</td>
                <td style={{ ...cell, textAlign: "right", fontWeight: 700, fontSize: 16 }}>
                  {loading ? "…" : formatPct(monthStats.periodComplete)}
                </td>
                <td style={{ ...cell, textAlign: "right", fontWeight: 700, fontSize: 16 }}>
                  {loading ? "…" : formatAmount(Math.max(0, monthStats.trackingBalance))}
                </td>
                <td
                  style={{
                    ...cell,
                    textAlign: "right",
                    fontWeight: 600,
                    color: monthStats.income > 0 ? ACCENT : TEXT_MUTED,
                  }}
                >
                  {loading
                    ? "…"
                    : monthStats.income > 0
                      ? `You are saving ${formatPct1(monthStats.savingsRate)} of your income`
                      : "No income logged yet"}
                </td>
              </tr>
              <tr>
                <td colSpan={4} style={{ ...cell, fontSize: 12, color: TEXT_MUTED, borderBottom: "none" }}>
                  Tracked income left to be allocated
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {loading ? (
          <LoadingText />
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 20,
              alignItems: "flex-start",
            }}
          >
            <div style={{ flex: "1 1 520px", minWidth: 0 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>
                Breakdown — {monthLabel(selectedMonth)}
              </h2>
              <div style={{ ...card, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      minWidth: 520,
                      borderCollapse: "collapse",
                      fontSize: 13,
                    }}
                  >
                    <tbody>
                      <ExcelSection title="Income" headerBg="#F9FAFB" rows={incomeRows} />
                      <ExcelSection title="Expenses" headerBg="#F9FAFB" rows={expenseRows} />
                      <ExcelSection title="Savings" headerBg="#F9FAFB" rows={savingsRows} />
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div style={{ flex: "1 1 340px", minWidth: 0 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>
                Summary — {monthLabel(selectedMonth)}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <DonutCard
                  title="Income"
                  data={incomeRows
                    .filter((r) => r.tracked > 0)
                    .map((r) => ({ name: r.category, value: r.tracked }))}
                  colors={INCOME_COLORS}
                  emptyMsg="No income logged"
                />
                <DonutCard
                  title="Expenses"
                  data={expenseRows
                    .filter((r) => r.tracked > 0)
                    .map((r) => ({ name: r.category, value: r.tracked }))}
                  colors={EXPENSE_COLORS}
                  emptyMsg="No expenses logged"
                />
                <DonutCard
                  title="Savings"
                  data={savingsRows
                    .filter((r) => r.tracked > 0)
                    .map((r) => ({ name: r.category, value: r.tracked }))}
                  colors={SAVINGS_COLORS}
                  emptyMsg="No savings logged"
                />
                <div style={{ ...card, padding: 14 }}>
                  <p style={{ fontWeight: 700, fontSize: 12, margin: "0 0 10px" }}>
                    Tracked vs Budget
                  </p>
                  <div style={{ height: 180, minWidth: 0 }}>
                    <ChartBox height={180}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 9, fill: "#6B7280" }}
                          angle={-35}
                          textAnchor="end"
                          interval={0}
                          height={50}
                        />
                        <YAxis tick={{ fontSize: 9, fill: "#6B7280" }} />
                        <Tooltip
                          formatter={(v) => formatAmount(Number(v) || 0)}
                          labelFormatter={(_, p) => p?.[0]?.payload?.fullName ?? ""}
                        />
                        <Bar dataKey="tracked" fill={ACCENT} name="Tracked" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="budget" fill="#D1D5DB" name="Budget" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    </ChartBox>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  function renderMonthly() {
    const budgetVsActual = (rows: CategoryBudgetRow[], col4: string) => {
      const totals = sumRows(rows);
      const tableRows = rows.map((r) => [
        r.category,
        formatAmount(r.budget),
        formatAmount(r.tracked),
        col4 === "Variance"
          ? formatAmount(r.tracked - r.budget)
          : formatAmount(r.remaining),
      ]);
      tableRows.push([
        `Total ${rows[0]?.type ?? ""}`,
        formatAmount(totals.budget),
        formatAmount(totals.tracked),
        col4 === "Variance"
          ? formatAmount(totals.tracked - totals.budget)
          : formatAmount(totals.remaining),
      ]);
      return tableRows;
    };

    return (
      <>
        <SheetTitle
          title="Monthly Budget"
          subtitle="Budget vs actual — actuals pull automatically from Transactions"
        />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ flex: "1 1 400px" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 8px" }}>INCOME</h3>
            <DataTable
              headers={["Category", "Budget", "Actual", "Variance"]}
              rows={budgetVsActual(incomeRows, "Variance")}
            />
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: "16px 0 8px" }}>EXPENSES</h3>
            <DataTable
              headers={["Category", "Budget", "Actual", "Remaining"]}
              rows={budgetVsActual(expenseRows, "Remaining")}
            />
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: "16px 0 8px" }}>SAVINGS</h3>
            <DataTable
              headers={["Category", "Budget", "Actual", "Variance"]}
              rows={budgetVsActual(savingsRows, "Variance")}
            />
            <div style={{ ...card, padding: 14, marginTop: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>SUMMARY</h3>
              <DataTable
                headers={["Metric", "Value"]}
                rows={[
                  ["Net Cash Flow (unallocated)", formatAmount(monthStats.netCashFlow)],
                  ["Savings Rate", monthStats.income > 0 ? formatPct1(monthStats.savingsRate) : "Awaiting salary"],
                  ["Savings Goal", formatAmount(sumRows(savingsRows).budget)],
                  [
                    "Goal Status",
                    monthStats.income === 0
                      ? "Awaiting salary"
                      : monthStats.savings >= sumRows(savingsRows).budget
                        ? "On track"
                        : "Below target",
                  ],
                ]}
                alignRightFrom={1}
              />
            </div>
          </div>
          <div style={{ flex: "1 1 360px" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 8px" }}>
              {selectedYear} Monthly Trend
            </h3>
            <DataTable
              headers={["Month", "Income", "Expenses", "Savings", "Net", "Save %"]}
              rows={monthlyTrend.map((t) => [
                t.label.split(" ")[0],
                formatAmount(t.income),
                formatAmount(t.expenses),
                formatAmount(t.savings),
                formatAmount(t.net),
                t.income > 0 ? formatPct1(t.savePct) : "0%",
              ])}
            />
            <div style={{ ...card, padding: 14, marginTop: 16 }}>
              <ChartBox height={200}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 8, fill: "#6B7280" }}
                      tickFormatter={(v) => String(v).split(" ")[0]}
                    />
                    <YAxis tick={{ fontSize: 9, fill: "#6B7280" }} />
                    <Tooltip formatter={(v) => formatAmount(Number(v) || 0)} />
                    <Legend />
                    <Bar dataKey="income" fill="#22C55E" name="Income" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                    <Bar dataKey="savings" fill={ACCENT} name="Savings" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderNetWorth() {
    const invested = PORTFOLIO.tbills + PORTFOLIO.liquidity;
    const rows = netWorthMonths.map((key) => {
      const snap = computeMonthSnapshot(allEntries, key);
      const monthTotalAssets = snap.bank + invested;
      const monthNetWorth = monthTotalAssets - snap.loan;
      return [
        monthLabel(key),
        formatAmount(snap.bank),
        "—",
        formatAmount(invested),
        "—",
        formatAmount(monthTotalAssets),
        formatAmount(snap.loan),
        "—",
        formatAmount(snap.loan),
        formatAmount(monthNetWorth),
        snap.hasActual ? formatAmount(monthNetWorth) : "—",
      ];
    });

    return (
      <>
        <SheetTitle
          title="Net Worth"
          subtitle="Through Nov 2026 — no salary growth after contract ends"
        />
        <KpiGrid
          items={[
            {
              label: "Bank Balance",
              value: formatAmount(runningBalance.bank),
            },
            {
              label: "Loan Remaining",
              value: formatAmount(loanBalance),
              sub: loanBalance === 0 ? "Paid off" : undefined,
            },
            {
              label: "Investments",
              value: formatAmount(investedTotal),
              sub: "T-Bills + Liquidity",
            },
            {
              label: "Total Assets",
              value: formatAmount(totalAssets),
            },
            {
              label: "Net Worth",
              value: formatAmount(currentNetWorth),
            },
          ]}
        />
        <DataTable
          headers={[
            "Month",
            "Bank",
            "Cash",
            "Investments",
            "Other Assets",
            "Total Assets",
            "Loan",
            "Other Debts",
            "Total Liab.",
            "Net Worth",
            "Actual NW",
          ]}
          rows={rows}
          alignRightFrom={1}
        />
        <div style={{ ...card, padding: 14, marginTop: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 12px" }}>
            Planned vs Actual Net Worth
          </p>
          <ChartBox height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={netWorthChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 8, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 9, fill: "#6B7280" }} />
                <Tooltip formatter={(v) => formatAmount(Number(v) || 0)} />
                <Legend />
                <Line type="monotone" dataKey="planned" stroke="#9CA3AF" name="Planned" />
                <Line type="monotone" dataKey="actual" stroke={ACCENT} name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
      </>
    );
  }

  function renderWeekly() {
    return (
      <>
        <SheetTitle
          title="Weekly Finance Review"
          subtitle="Every Sunday - 15 minutes - mark each week's column"
        />
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
              <thead>
                <tr style={{ backgroundColor: "#F3F4F6" }}>
                  <th style={{ ...cell, textAlign: "left", fontWeight: 600 }}>
                    15-MINUTE CHECKLIST
                  </th>
                  {weeks.map((w) => (
                    <th key={w.id} style={{ ...cell, textAlign: "center", fontWeight: 600 }}>
                      {w.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WEEKLY_CHECKLIST.map((item, i) => (
                  <tr key={item}>
                    <td style={cell}>
                      {i + 1}. {item}
                    </td>
                    {weeks.map((w) => {
                      const key = `${w.id}-${i}`;
                      return (
                        <td key={key} style={{ ...cell, textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={!!weeklyChecks[key]}
                            onChange={(e) =>
                              persistWeeklyChecks({
                                ...weeklyChecks,
                                [key]: e.target.checked,
                              })
                            }
                            style={{ width: 18, height: 18, cursor: "pointer" }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ ...card, padding: 14, marginTop: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>ASK YOURSELF</h3>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#4B5563", fontSize: 14 }}>
            {WEEKLY_QUESTIONS.map((q) => (
              <li key={q} style={{ marginBottom: 6 }}>
                {q}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ ...card, padding: 14, marginTop: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>
            Notes for this week
          </h3>
          <textarea
            value={weeklyNotes}
            onChange={(e) => persistWeeklyNotes(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              padding: 12,
              fontSize: 14,
              fontFamily: "inherit",
              resize: "vertical",
            }}
            placeholder="Reflections, wins, adjustments…"
          />
        </div>
        <p
          style={{
            marginTop: 16,
            fontSize: 13,
            fontStyle: "italic",
            color: "#6B7280",
            textAlign: "center",
          }}
        >
          &ldquo;{PRINCIPLES_CONTENT.quote}&rdquo;
        </p>
      </>
    );
  }

  function renderPrinciples() {
    return (
      <>
        <SheetTitle
          title={PRINCIPLES_CONTENT.title}
          subtitle={PRINCIPLES_CONTENT.subtitle}
        />
        <div style={{ ...card, padding: 16, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700 }}>
            {PRINCIPLES_CONTENT.formula.title}
          </h3>
          <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, color: ACCENT }}>
            {PRINCIPLES_CONTENT.formula.equation}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>
            {PRINCIPLES_CONTENT.formula.note}
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {PRINCIPLES_CONTENT.columns.map((col) => (
            <div key={col.name} style={{ ...card, padding: 14 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700 }}>{col.name}</h3>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#4B5563" }}>
                {col.bullets.map((b) => (
                  <li key={b} style={{ marginBottom: 6 }}>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </>
    );
  }

  function renderTransactions() {
    return (
      <>
        <SheetTitle
          title="Transactions"
          subtitle="All entries feed every chart and dashboard tab automatically"
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <div style={{ flex: "1 1 600px" }}>
            <div style={{ ...card, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: 560,
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#F3F4F6" }}>
                      {["Date", "Description", "Category", "Type", "Amount"].map((h, i) => (
                        <th
                          key={h}
                          style={{
                            ...cell,
                            fontWeight: 600,
                            fontSize: 11,
                            textTransform: "uppercase",
                            color: "#6B7280",
                            textAlign: i === 4 ? "right" : "left",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{ ...cell, textAlign: "center", color: "#9CA3AF" }}
                        >
                          Loading…
                        </td>
                      </tr>
                    )}
                    {!loading && allEntries.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{ ...cell, textAlign: "center", color: "#9CA3AF" }}
                        >
                          No transactions yet.
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      allEntries.map((e) => (
                        <tr key={e.id}>
                          <td style={cell}>{formatDateShort(e.date)}</td>
                          <td style={{ ...cell, fontWeight: 500 }}>{e.description}</td>
                          <td style={cell}>{e.category}</td>
                          <td style={cell}>{e.type}</td>
                          <td
                            style={{
                              ...cell,
                              textAlign: "right",
                              fontWeight: 600,
                              color:
                                normalizeType(e.type) === "income" ||
                                normalizeType(e.type) === "savings"
                                  ? "#16A34A"
                                  : TEXT,
                            }}
                          >
                            {formatRowAmount(e.amount, e.type)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div style={{ flex: "0 1 200px" }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>
              Categories (ref)
            </h4>
            <div style={{ ...card, padding: 10, fontSize: 12 }}>
              {CATEGORIES_REF.map((c) => (
                <div key={c} style={{ padding: "4px 0", borderBottom: `1px solid ${BORDER}` }}>
                  {c}
                </div>
              ))}
            </div>
            <h4 style={{ fontSize: 12, fontWeight: 700, margin: "12px 0 8px" }}>Types (ref)</h4>
            <div style={{ ...card, padding: 10, fontSize: 12 }}>
              {TYPES_REF.map((t) => (
                <div key={t} style={{ padding: "4px 0", borderBottom: `1px solid ${BORDER}` }}>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderContract() {
    const essential = FINANCE_ASSUMPTIONS.monthlyEssentialSpending;
    const fund = FINANCE_ASSUMPTIONS.emergencyFundBalance;
    const bankFund = runningBalance.bank;
    const survivable =
      essential > 0 ? bankFund / essential : 0;
    const emergencyTargets = getEmergencyTargets(essential);

    return (
      <>
        <SheetTitle
          title="Contract Runway & Emergency Fund"
          subtitle="Your contract ends soon — this is your most important sheet."
        />
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>CONTRACT</h3>
        <DataTable
          headers={["Field", "Value"]}
          rows={[
            ["Contract Start", FINANCE_ASSUMPTIONS.contractStart ? formatDateShort(FINANCE_ASSUMPTIONS.contractStart) : "—"],
            ["Contract End", FINANCE_ASSUMPTIONS.contractEnd ? formatDateShort(FINANCE_ASSUMPTIONS.contractEnd) : "—"],
            ["Today", formatDateShort(todayIso)],
            ["Months Remaining", String(monthsLeft)],
            ["Current Savings", formatAmount(fund)],
            [
              "Monthly Net Savings",
              formatAmount(FINANCE_ASSUMPTIONS.plannedMonthlyNetSavings),
            ],
            ["Projected Savings at Contract End", formatAmount(projectedAtEnd)],
          ]}
          alignRightFrom={1}
        />
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: "20px 0 10px" }}>EMERGENCY FUND</h3>
        <DataTable
          headers={["Field", "Value"]}
          rows={[
            ["Monthly Essential Spending", formatAmount(essential)],
            ["Current Emergency Fund", formatAmount(fund)],
            ["Bank balance (separate)", formatAmount(bankFund)],
            [
              "Months Survivable Without Income",
              `${survivable.toFixed(1)} mo`,
            ],
          ]}
          alignRightFrom={1}
        />
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: "20px 0 10px" }}>TARGETS</h3>
        <DataTable
          headers={["Target", "Amount Needed", "Funded", "Status"]}
          rows={emergencyTargets.map((t) => {
            const funded = t.amount > 0 ? Math.min(1, fund / t.amount) : 0;
            const gap = Math.max(0, t.amount - fund);
            return [
              `${t.months} months`,
              formatAmount(t.amount),
              formatPct1(funded),
              funded >= 1
                ? "Funded"
                : `${formatAmount(gap)} to go`,
            ];
          })}
          alignRightFrom={1}
        />
      </>
    );
  }

  function renderGoals() {
    const annualExpenses = FINANCE_ASSUMPTIONS.monthlyEssentialSpending * 12;
    const goalsWithProgress = GOALS.map((g) => {
      let current = g.current;
      let status = g.status;
      if (g.name.toLowerCase().includes("loan")) {
        current = FINANCE_ASSUMPTIONS.currentLoanBalance - loanBalance;
        if (loanBalance === 0) status = "Done";
      } else if (g.name.toLowerCase().includes("net worth")) {
        current = currentNetWorth;
      } else if (g.name.toLowerCase().includes("emergency")) {
        current = FINANCE_ASSUMPTIONS.emergencyFundBalance;
      } else if (
        g.name.toLowerCase().includes("savings") ||
        g.name.includes("10,000") ||
        g.name.includes("20,000") ||
        g.name.toLowerCase().includes("reach")
      ) {
        current = runningBalance.bank;
      }
      return {
        ...g,
        current,
        status,
        progress: Math.min(1, current / g.target),
      };
    });

    return (
      <>
        <SheetTitle
          title="Goals & FIRE"
          subtitle="Progress updates automatically from your savings and net worth"
        />
        <DataTable
          headers={["Goal", "Target", "Current", "Progress", "Target Date", "Status"]}
          rows={goalsWithProgress.map((g) => [
            g.name,
            formatAmount(g.target),
            formatAmount(g.current),
            formatPct1(g.progress),
            formatDateShort(g.targetDate),
            g.status,
          ])}
          alignRightFrom={1}
        />
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: "24px 0 10px" }}>
          FINANCIAL INDEPENDENCE (FIRE)
        </h3>
        <DataTable
          headers={["Metric", "Value"]}
          rows={[
            [
              "Monthly Essential Spending",
              formatAmount(FINANCE_ASSUMPTIONS.monthlyEssentialSpending),
            ],
            ["Annual Expenses", formatAmount(annualExpenses)],
            ["FI Multiple (25× = 4% rule)", String(FINANCE_ASSUMPTIONS.fiMultiple)],
            ["FI Number (target net worth)", formatAmount(fiNumber)],
            ["Current Net Worth", formatAmount(currentNetWorth)],
            ["FI Progress", formatPct1(fiProgress)],
          ]}
          alignRightFrom={1}
        />
        <div style={{ ...card, padding: 14, marginTop: 16 }}>
          <div
            style={{
              height: 12,
              backgroundColor: "#E5E7EB",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min(100, fiProgress * 100)}%`,
                height: "100%",
                backgroundColor: ACCENT,
                transition: "width 0.3s",
              }}
            />
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#6B7280", textAlign: "center" }}>
            {formatPct1(fiProgress)} toward FI number of {formatAmount(fiNumber)}
          </p>
        </div>
      </>
    );
  }

  const tabContent: Record<FinanceTabId, () => ReactNode> = {
    executive: renderExecutive,
    budget: renderBudget,
    monthly: renderMonthly,
    networth: renderNetWorth,
    weekly: renderWeekly,
    principles: renderPrinciples,
    transactions: renderTransactions,
    contract: renderContract,
    goals: renderGoals,
  };

  return (
    <FinanceShell>
      <main
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "16px 20px 0",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <header style={{ marginBottom: 16 }}>
          <Link
            href="/spaces"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: TEXT_MUTED,
              fontSize: 13,
              textDecoration: "none",
              marginBottom: 10,
            }}
          >
            <ArrowLeft size={15} aria-hidden />
            Spaces
          </Link>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Finance</h1>
        </header>

        <FinanceTabBar active={activeTab} onChange={setActiveTab} />

        {PERIOD_TABS.includes(activeTab) && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 12,
              padding: "14px 0 20px",
              borderBottom: `1px solid ${BORDER}`,
              marginBottom: 24,
            }}
          >
            {monthYearToolbar}
          </div>
        )}

        {error && <ErrorBanner message={error} />}
        <div key={activeTab} className="finance-fade-in" style={{ flex: 1, paddingBottom: 24 }}>
          {tabContent[activeTab]()}
        </div>

        <div
          style={{
            position: "sticky",
            bottom: "calc(4.5rem + env(safe-area-inset-bottom))",
            zIndex: 30,
            backgroundColor: BG,
            paddingTop: 12,
            paddingBottom: 8,
            borderTop: `1px solid ${BORDER}`,
            marginTop: "auto",
          }}
        >
          <FinanceAgentPanel
            onSubmit={handleAgentSubmit}
            messages={agentMessages}
            loading={agentLoading}
            loadingLabel={agentLoadingLabel}
            forceCursor={forceCursor}
            onForceCursorChange={setForceCursor}
            hasCursorSession={!!cursorAgentId}
            onNewSession={handleNewCursorSession}
          />
        </div>
      </main>
    </FinanceShell>
  );
}
