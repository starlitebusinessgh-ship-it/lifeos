export type FinanceEntry = {
  id: number;
  date: string;
  description: string;
  category: string;
  type: string;
  intent: string;
  amount: number;
  created_at: string;
};

export type FinanceBudget = {
  id: number;
  category: string;
  type: string;
  monthly_budget: number;
};

export type CategoryBudgetRow = {
  category: string;
  type: string;
  budget: number;
  tracked: number;
  remaining: number;
  excess: number;
  pctComplete: number;
};

export type MonthStats = {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  trackingBalance: number;
  periodComplete: number;
  netCashFlow: number;
};

export type MonthlyTrendRow = {
  key: string;
  label: string;
  income: number;
  expenses: number;
  savings: number;
  net: number;
  savePct: number;
};

export type PendingTransaction = {
  description: string;
  category: string;
  type: string;
  intent: string;
  amount: number;
  date: string;
  note?: string;
};

export type AgentAction =
  | { type: "log"; transactions: PendingTransaction[] }
  | { type: "delete"; entryId: number }
  | { type: "switch_tab"; tab: FinanceTabId }
  | { type: "set_month"; month: string }
  | { type: "set_year"; year: string };

export type FinanceAgentResponse = {
  reply: string;
  actions: AgentAction[];
  source?: "finance" | "cursor" | "local";
  cursorAgentId?: string;
  meta?: {
    usdToGhs?: number;
    loanBalance?: number;
    runId?: string;
    status?: string;
  };
};

export type AgentChatMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
  transactions?: PendingTransaction[];
  timestamp: number;
};

export type FinanceTabId =
  | "executive"
  | "budget"
  | "monthly"
  | "networth"
  | "weekly"
  | "principles"
  | "transactions"
  | "contract"
  | "goals";

export type GoalRow = {
  name: string;
  target: number;
  current: number;
  targetDate: string;
  status: string;
};
