import type { TxnType } from "./types";

export interface RecurringTemplate {
  id: string;
  type: TxnType;
  category: string;
  amount: number;
  intent: string | null;
  description: string;
}

/** Chris's monthly repeats — seeded once when none exist. */
export const DEFAULT_RECURRING: RecurringTemplate[] = [
  { id: "salary", type: "Income", category: "Salary", amount: 2850, intent: null, description: "National service salary" },
  { id: "tithe", type: "Expense", category: "Tithe", amount: 300, intent: "Giving", description: "Monthly tithe" },
  { id: "offering", type: "Expense", category: "Offering", amount: 300, intent: "Giving", description: "Sunday offerings (~3×100)" },
  { id: "grandma", type: "Expense", category: "Grandma", amount: 300, intent: "Giving", description: "Grandma support" },
  { id: "family", type: "Expense", category: "Family Support", amount: 200, intent: "Giving", description: "Family reserve" },
  { id: "savings", type: "Savings", category: "Savings Transfer", amount: 4000, intent: "Investment", description: "Monthly savings (20k goal)" },
];

export const RECURRING_KEY = "lifeos.finance.recurring";
export const RECURRING_SEEDED_KEY = "lifeos.finance.recurringSeeded";

export function loadRecurringTemplates(): RecurringTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECURRING_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RecurringTemplate[];
      if (parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

export function seedRecurringIfEmpty(): RecurringTemplate[] {
  const existing = loadRecurringTemplates();
  if (existing.length > 0) return existing;
  if (localStorage.getItem(RECURRING_SEEDED_KEY)) return existing;

  localStorage.setItem(RECURRING_KEY, JSON.stringify(DEFAULT_RECURRING));
  localStorage.setItem(RECURRING_SEEDED_KEY, "1");
  return DEFAULT_RECURRING;
}
