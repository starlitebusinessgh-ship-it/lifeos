export interface InsightItem {
  title: string;
  body: string;
  tone: "positive" | "warning" | "neutral" | "critical";
}

export interface FinanceMetrics {
  month: string;
  currency: string;
  income: number;
  expense: number;
  savings: number;
  net: number;
  balance: number;
  topCategories: { category: string; total: number }[];
  budgets: { category: string; spent: number; budget: number; type: string }[];
  savingsTotal: number;
  savingsGoal: number;
  savingsDeadline: string | null;
  savingsMonthsLeft: number | null;
  monthlySavingsTarget: number;
  debtsOwedToMe: number;
  debtsIOwe: number;
  debtsDueSoon: { counterparty: string; amount: number; daysUntil: number; direction: string }[];
  nationalServiceEnds: string;
  salaryTypical: number;
}
