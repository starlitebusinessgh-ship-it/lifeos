import {
  ANNUAL_SAVINGS_RATE_TARGET,
  FINANCE_ASSUMPTIONS,
  FINANCIAL_MEMORY_SEED,
  PORTFOLIO,
  getEmergencyTargets,
} from "./assumptions";
import { computeRemainingLoan } from "./agent";
import type { FinanceEntry } from "./types";
import {
  filterEntriesByMonth,
  formatAmount,
  formatPct1,
  monthLabel,
  projectedBankAtContractEnd,
  remainingSalaryMonths,
} from "./utils";

export type FinanceInsight = {
  headline: string;
  detail?: string;
  kind: "status" | "plan" | "forecast";
};

export type MemoryEvent = {
  sortKey: string;
  month: string;
  text: string;
};

type InsightInput = {
  entries: FinanceEntry[];
  monthKey: string;
  savingsRate: number;
  monthlySavings: number;
  income: number;
  expenses: number;
  loanBalance: number;
  bankBalance: number;
  monthsLeftContract: number;
};

export function generateInsights(input: InsightInput): FinanceInsight[] {
  const insights: FinanceInsight[] = [];
  const { loanBalance, monthsLeftContract, bankBalance, monthKey } = input;
  const monthEntries = filterEntriesByMonth(input.entries, monthKey);
  const hasIncome = input.income > 0;
  const monthName = monthLabel(monthKey).split(" ")[0];
  const efTarget6 = getEmergencyTargets()[1];
  const efBalance = FINANCE_ASSUMPTIONS.emergencyFundBalance;
  const salaryMonthsLeft = remainingSalaryMonths(
    new Date().toISOString().slice(0, 10),
    FINANCE_ASSUMPTIONS.contractEnd
  );
  const projectedEnd = projectedBankAtContractEnd(bankBalance, salaryMonthsLeft);

  if (!hasIncome && monthEntries.length === 0) {
    insights.push({
      kind: "status",
      headline: `${monthName}: salary not received yet.`,
      detail: "No transactions logged this month. Budgets show targets only until you log pay day.",
    });
    insights.push({
      kind: "plan",
      headline: `Plan when paid: save ${formatPct1(ANNUAL_SAVINGS_RATE_TARGET)} of income.`,
      detail: `GH₵${FINANCE_ASSUMPTIONS.monthlyIncome.toLocaleString()} in, GH₵${(FINANCE_ASSUMPTIONS.monthlyEssentialSpending).toLocaleString()} expenses, GH₵${FINANCE_ASSUMPTIONS.plannedMonthlyNetSavings.toLocaleString()} to savings.`,
    });
  } else if (hasIncome) {
    insights.push({
      kind: "status",
      headline: `You saved ${formatPct1(input.savingsRate)} of your income this month.`,
      detail:
        input.savingsRate >= ANNUAL_SAVINGS_RATE_TARGET
          ? "Above your monthly savings target."
          : `Target is ${formatPct1(ANNUAL_SAVINGS_RATE_TARGET)}. Logged expenses: ${formatAmount(input.expenses)}.`,
    });
  } else if (monthEntries.length > 0) {
    insights.push({
      kind: "status",
      headline: `${monthName}: expenses logged before income.`,
      detail: `GH₵${Math.round(input.expenses).toLocaleString()} spent so far. Log salary when received.`,
    });
  }

  if (efTarget6.amount > 0) {
    const efGap = Math.max(0, efTarget6.amount - efBalance);
    if (efGap === 0) {
      insights.push({
        kind: "status",
        headline: "6-month emergency fund target reached.",
        detail: `${formatAmount(efBalance)} set aside for essentials.`,
      });
    } else {
      const monthsToEf = Math.ceil(
        efGap / FINANCE_ASSUMPTIONS.plannedMonthlyNetSavings
      );
      insights.push({
        kind: "forecast",
        headline: `Emergency fund: ${formatAmount(efBalance)} of ${formatAmount(efTarget6.amount)}.`,
        detail: `At GH₵${FINANCE_ASSUMPTIONS.plannedMonthlyNetSavings.toLocaleString()}/mo from savings, fully funded in ~${monthsToEf} salary month${monthsToEf === 1 ? "" : "s"}. Bank balance is separate until you allocate.`,
      });
    }
  }

  if (salaryMonthsLeft > 0) {
    insights.push({
      kind: "forecast",
      headline: `${salaryMonthsLeft} salary month${salaryMonthsLeft === 1 ? "" : "s"} left through November.`,
      detail: `If you save GH₵${FINANCE_ASSUMPTIONS.plannedMonthlyNetSavings.toLocaleString()}/mo, bank could reach ~${formatAmount(projectedEnd)} by contract end. No salary in December.`,
    });
  }

  const investable = PORTFOLIO.tbills + PORTFOLIO.liquidity;
  if (investable > 0) {
    insights.push({
      kind: "status",
      headline: `${formatPct1(PORTFOLIO.tbills / investable)} of investable funds in T-Bills.`,
      detail: "Cash stays liquid while T-Bills earn short-term yield.",
    });
  }

  if (loanBalance === 0 && FINANCE_ASSUMPTIONS.currentLoanBalance > 0) {
    insights.push({
      kind: "status",
      headline: "You are debt free.",
      detail: "All loan payments are cleared.",
    });
  }

  if (monthsLeftContract <= 3 && monthsLeftContract > 0) {
    insights.push({
      kind: "forecast",
      headline: `Contract ends in ${monthsLeftContract} months.`,
      detail: "Plan runway before income stops in December.",
    });
  }

  return insights.slice(0, 5);
}

export function buildFinancialMemory(entries: FinanceEntry[]): MemoryEvent[] {
  const events: MemoryEvent[] = FINANCIAL_MEMORY_SEED.map((e) => ({ ...e }));

  const loanPayments = entries
    .filter((e) => e.category === "Loan Payment")
    .sort((a, b) => b.date.localeCompare(a.date));

  if (loanPayments.length > 0 && computeRemainingLoan(entries) === 0) {
    const last = loanPayments[0];
    const key = last.date.slice(0, 7);
    if (!events.some((e) => e.text.includes("cleared your"))) {
      events.push({
        sortKey: key,
        month: monthLabel(key),
        text: "You cleared your loan.",
      });
    }
  }

  return events.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}
