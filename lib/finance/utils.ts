import { FINANCE_ASSUMPTIONS } from "./assumptions";
import { computeRemainingLoan, computeRunningBalance } from "./agent";
import type {
  CategoryBudgetRow,
  FinanceBudget,
  FinanceEntry,
  MonthStats,
  MonthlyTrendRow,
} from "./types";

export function normalizeType(type: string) {
  return type.trim().toLowerCase();
}

export function budgetKey(category: string, type: string) {
  return `${category}::${normalizeType(type)}`;
}

export function monthKeyFromDate(date: string) {
  return date.slice(0, 7);
}

export function monthBounds(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const start = `${monthKey}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${monthKey}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function monthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });
}

export function generateMonthOptions(year: string) {
  const y = Number(year);
  return Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    const key = `${y}-${m}`;
    return { value: key, label: monthLabel(key) };
  });
}

export function generateAllMonthKeys(from = "2026-01", to = "2027-05") {
  const keys: string[] = [];
  let [y, m] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    keys.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return keys;
}

export function formatAmount(n: number) {
  return `GH₵${Math.round(n).toLocaleString()}`;
}

export function formatPct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function formatPct1(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export function formatRowAmount(amount: number, type: string) {
  const v = Math.abs(Number(amount));
  const s = `GH₵${v.toLocaleString()}`;
  const t = normalizeType(type);
  return t === "income" || t === "savings" ? `+${s}` : `-${s}`;
}

export function formatDateShort(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function filterEntriesByMonth(entries: FinanceEntry[], monthKey: string) {
  const { start, end } = monthBounds(monthKey);
  return entries.filter((e) => e.date >= start && e.date <= end);
}

export function computeTrackedByCategory(
  entries: FinanceEntry[],
  monthKey: string
) {
  const tracked = new Map<string, number>();
  for (const entry of filterEntriesByMonth(entries, monthKey)) {
    const key = budgetKey(entry.category, entry.type);
    tracked.set(key, (tracked.get(key) ?? 0) + Math.abs(Number(entry.amount)));
  }
  return tracked;
}

export function buildCategoryRow(
  category: string,
  type: string,
  budget: number,
  tracked: number
): CategoryBudgetRow {
  const remaining = Math.max(0, budget - tracked);
  const excess = Math.max(0, tracked - budget);
  const pctComplete = budget > 0 ? tracked / budget : tracked > 0 ? 1 : 0;
  return { category, type, budget, tracked, remaining, excess, pctComplete };
}

export function buildCategoryRows(
  budgets: FinanceBudget[],
  trackedByCategory: Map<string, number>
) {
  return budgets.map((row) => {
    const budget = Math.abs(Number(row.monthly_budget));
    const tracked =
      trackedByCategory.get(budgetKey(row.category, row.type)) ?? 0;
    return buildCategoryRow(row.category, row.type, budget, tracked);
  });
}

export function sumRows(rows: CategoryBudgetRow[]) {
  return rows.reduce(
    (t, r) => ({
      tracked: t.tracked + r.tracked,
      budget: t.budget + r.budget,
      remaining: t.remaining + r.remaining,
      excess: t.excess + r.excess,
    }),
    { tracked: 0, budget: 0, remaining: 0, excess: 0 }
  );
}

export function computeMonthStats(
  entries: FinanceEntry[],
  monthKey: string
): MonthStats {
  const monthEntries = filterEntriesByMonth(entries, monthKey);
  let income = 0;
  let expenses = 0;
  let savings = 0;
  for (const e of monthEntries) {
    const amt = Math.abs(Number(e.amount));
    const t = normalizeType(e.type);
    if (t === "income") income += amt;
    else if (t === "expense") expenses += amt;
    else if (t === "savings") savings += amt;
  }
  const effectiveSavings =
    income > 0
      ? savings > 0
        ? savings
        : Math.max(0, income - expenses)
      : 0;
  const savingsRate = income > 0 ? effectiveSavings / income : 0;
  const trackingBalance = income - expenses - savings;
  const periodComplete =
    income > 0 ? Math.min(1, (expenses + Math.max(savings, effectiveSavings)) / income) : 0;
  return {
    income,
    expenses,
    savings: effectiveSavings,
    savingsRate,
    trackingBalance,
    periodComplete,
    netCashFlow: trackingBalance,
  };
}

export function computeMonthlyTrend(
  entries: FinanceEntry[],
  monthKeys: string[]
): MonthlyTrendRow[] {
  return monthKeys.map((key) => {
    const s = computeMonthStats(entries, key);
    return {
      key,
      label: monthLabel(key),
      income: s.income,
      expenses: s.expenses,
      savings: s.savings,
      net: s.trackingBalance,
      savePct: s.savingsRate,
    };
  });
}

export function computeActualNetWorth(
  entries: FinanceEntry[],
  monthKey: string
) {
  const monthEntries = filterEntriesByMonth(entries, monthKey);
  if (monthEntries.length === 0 && monthKey !== "2026-06") {
    return projectedNetWorth(monthKey, entries);
  }

  const upToMonth = entries.filter((e) => e.date <= monthBounds(monthKey).end);
  const { netWorth } = computeRunningBalance(upToMonth);
  return netWorth;
}

export function computeBankBalance(entries: FinanceEntry[], monthKey: string) {
  const upToMonth = entries.filter((e) => e.date <= monthBounds(monthKey).end);
  return computeRunningBalance(upToMonth).bank;
}

export function computeLoanBalance(entries: FinanceEntry[]) {
  return computeRemainingLoan(entries);
}

export { computeRemainingLoan, computeRunningBalance };

export function computeMonthSnapshot(entries: FinanceEntry[], monthKey: string) {
  const { start, end } = monthBounds(monthKey);
  const upToMonth = entries.filter((e) => e.date <= end);
  const hasActual = upToMonth.length > 0;

  if (hasActual) {
    const { bank, loan, netWorth } = computeRunningBalance(upToMonth);
    return { bank, loan, netWorth, hasActual: true };
  }

  const bank = projectedBankBalance(monthKey);
  const beforeMonth = entries.filter((e) => e.date < start);
  const loan =
    beforeMonth.length > 0
      ? computeRunningBalance(beforeMonth).loan
      : monthKey === "2026-06"
        ? FINANCE_ASSUMPTIONS.currentLoanBalance
        : 0;

  return { bank, loan, netWorth: bank - loan, hasActual: false };
}

export function projectedNetWorth(monthKey: string, entries: FinanceEntry[] = []) {
  const bank = projectedBankBalance(monthKey);
  const { start } = monthBounds(monthKey);
  const beforeMonth = entries.filter((e) => e.date < start);
  const loan =
    beforeMonth.length > 0
      ? computeRunningBalance(beforeMonth).loan
      : monthKey === "2026-06"
        ? FINANCE_ASSUMPTIONS.currentLoanBalance
        : 0;
  return bank - loan;
}

export function projectedBankBalance(monthKey: string) {
  const { startingBankBalance, plannedMonthlyNetSavings, contractEnd } =
    FINANCE_ASSUMPTIONS;
  const contractEndKey = contractEnd.slice(0, 7);
  const keys = generateAllMonthKeys("2026-06", monthKey);
  let bank = startingBankBalance;
  for (let i = 1; i < keys.length; i++) {
    if (keys[i] <= contractEndKey) {
      bank += plannedMonthlyNetSavings;
    }
  }
  return bank;
}

/** Salary months from today through contract end (inclusive) */
export function remainingSalaryMonths(
  today: string,
  contractEnd = FINANCE_ASSUMPTIONS.contractEnd
) {
  const todayKey = today.slice(0, 7);
  const endKey = contractEnd.slice(0, 7);
  if (todayKey > endKey) return 0;
  const keys = generateAllMonthKeys(todayKey, endKey);
  return keys.length;
}

export function projectedBankAtContractEnd(
  currentBank: number,
  salaryMonthsLeft: number,
  monthlySave = FINANCE_ASSUMPTIONS.plannedMonthlyNetSavings
) {
  return currentBank + salaryMonthsLeft * monthlySave;
}

export function monthsBetween(start: string, end: string) {
  const s = new Date(`${start}T12:00:00`);
  const e = new Date(`${end}T12:00:00`);
  return (
    (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  );
}

export function contractMonthsRemaining(today: string, contractEnd: string) {
  return Math.max(0, monthsBetween(today, contractEnd));
}

export function getWeeksInMonth(monthKey: string) {
  return [1, 2, 3, 4].map((w) => ({
    id: `${monthKey}-w${w}`,
    label: `Wk ${w}`,
  }));
}
