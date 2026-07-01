export type TxnType = "Income" | "Expense" | "Savings";
export type Intent = "Necessary" | "Giving" | "Optional" | "Investment";

export interface FinanceEntry {
  id: number;
  date: string;
  description: string;
  category: string;
  type: TxnType;
  intent: string | null;
  amount: number;
  debt_id: number | null;
  created_at: string;
}

/** Draft used by the add/edit sheet before it hits Supabase. */
export interface EntryDraft {
  id?: number;
  date: string;
  description: string;
  category: string;
  type: TxnType;
  intent: string | null;
  amount: number;
  debt_id?: number | null;
}

export interface CategoryMeta {
  name: string;
  type: TxnType;
  /** lucide icon name */
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  // Income
  { name: "Salary", type: "Income", icon: "Briefcase", color: "#2ed47a" },
  { name: "Allowance", type: "Income", icon: "Wallet", color: "#16c79a" },
  { name: "Other Income", type: "Income", icon: "TrendingUp", color: "#39c4a3" },
  // Expense
  { name: "Tithe", type: "Expense", icon: "Church", color: "#c08bff" },
  { name: "Offering", type: "Expense", icon: "HandCoins", color: "#b07cff" },
  { name: "Grandma", type: "Expense", icon: "Users", color: "#ff9f5c" },
  { name: "Family Support", type: "Expense", icon: "Users", color: "#ff8a5c" },
  { name: "Transport", type: "Expense", icon: "Car", color: "#5ca8ff" },
  { name: "Food", type: "Expense", icon: "Utensils", color: "#ffb020" },
  { name: "Personal Spending", type: "Expense", icon: "ShoppingBag", color: "#ff5a8a" },
  { name: "Miscellaneous", type: "Expense", icon: "CircleDollarSign", color: "#9aa0aa" },
  { name: "Health", type: "Expense", icon: "HeartPulse", color: "#ff6b6b" },
  { name: "Gifts", type: "Expense", icon: "Gift", color: "#f06bd0" },
  { name: "Loan Payment", type: "Expense", icon: "Landmark", color: "#8b95ff" },
  { name: "Other", type: "Expense", icon: "CircleDollarSign", color: "#9aa0aa" },
  // Savings
  { name: "Savings Transfer", type: "Savings", icon: "PiggyBank", color: "#2f6bff" },
];

export const INTENTS: Intent[] = ["Necessary", "Giving", "Optional", "Investment"];

export const INTENT_COLORS: Record<string, string> = {
  Necessary: "#5b61ff",
  Giving: "#c08bff",
  Optional: "#ff8a5c",
  Investment: "#16c79a",
  Unassigned: "#5a626a",
};

export interface Budget {
  id: number;
  category: string;
  type: TxnType;
  monthly_budget: number;
}

const FALLBACK: Record<TxnType, CategoryMeta> = {
  Income: { name: "Income", type: "Income", icon: "TrendingUp", color: "#2ed47a" },
  Expense: { name: "Other", type: "Expense", icon: "CircleDollarSign", color: "#9aa0aa" },
  Savings: { name: "Savings", type: "Savings", icon: "PiggyBank", color: "#2f6bff" },
};

export function categoryMeta(name: string, type: TxnType): CategoryMeta {
  return CATEGORIES.find((c) => c.name === name) ?? FALLBACK[type];
}

export function categoriesFor(type: TxnType): CategoryMeta[] {
  return CATEGORIES.filter((c) => c.type === type);
}
