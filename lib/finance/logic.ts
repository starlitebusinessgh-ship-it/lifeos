import type { FinanceEntry } from "./types";

export const CURRENCY = "GH₵";

/** Format a number as GH₵ with thousands separators and 2 decimals. */
export function formatMoney(amount: number, withDecimals = true): string {
  const abs = Math.abs(amount);
  const str = abs.toLocaleString("en-US", {
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  });
  return `${amount < 0 ? "-" : ""}${CURRENCY}${str}`;
}

/** Split a formatted amount into the whole part and the ".xx" cents part. */
export function splitMoney(amount: number): { whole: string; cents: string } {
  const fixed = Math.abs(amount).toFixed(2);
  const [whole, cents] = fixed.split(".");
  const grouped = Number(whole).toLocaleString("en-US");
  return { whole: `${amount < 0 ? "-" : ""}${CURRENCY}${grouped}`, cents: `.${cents}` };
}

/** Running bank balance = income - expense - savings across ALL entries. */
export function computeBalance(entries: FinanceEntry[]): number {
  return entries.reduce((acc, e) => {
    const amt = Math.abs(Number(e.amount));
    if (e.type === "Income") return acc + amt;
    return acc - amt; // Expense + Savings both leave the main account
  }, 0);
}

/** Total moved into the savings pocket across all time. */
export function savingsTotal(entries: FinanceEntry[]): number {
  return entries.reduce(
    (acc, e) => (e.type === "Savings" ? acc + Math.abs(Number(e.amount)) : acc),
    0
  );
}

export interface MonthSummary {
  income: number;
  expense: number;
  savings: number;
  net: number;
}

function inMonth(dateStr: string, year: number, month: number): boolean {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.getFullYear() === year && d.getMonth() === month;
}

export function monthSummary(entries: FinanceEntry[], ref = new Date()): MonthSummary {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  let income = 0,
    expense = 0,
    savings = 0;
  for (const e of entries) {
    if (!inMonth(e.date, y, m)) continue;
    const amt = Math.abs(Number(e.amount));
    if (e.type === "Income") income += amt;
    else if (e.type === "Expense") expense += amt;
    else savings += amt;
  }
  return { income, expense, savings, net: income - expense - savings };
}

export interface CategorySlice {
  category: string;
  total: number;
}

/** Expense totals by category for the reference month (for the donut). */
export function spendingByCategory(entries: FinanceEntry[], ref = new Date()): CategorySlice[] {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.type !== "Expense" || !inMonth(e.date, y, m)) continue;
    map.set(e.category, (map.get(e.category) ?? 0) + Math.abs(Number(e.amount)));
  }
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export interface MonthPoint {
  ym: string; // YYYY-MM
  label: string; // e.g. "Jan"
  income: number;
  expense: number;
  savings: number;
  net: number;
}

/** Income/expense/savings totals for the last `count` months, oldest first. */
export function monthlySeries(entries: FinanceEntry[], count = 6, ref = new Date()): MonthPoint[] {
  const points: MonthPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    let income = 0,
      expense = 0,
      savings = 0;
    for (const e of entries) {
      if (!inMonth(e.date, y, m)) continue;
      const amt = Math.abs(Number(e.amount));
      if (e.type === "Income") income += amt;
      else if (e.type === "Expense") expense += amt;
      else savings += amt;
    }
    points.push({
      ym: `${y}-${String(m + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      income,
      expense,
      savings,
      net: income - expense - savings,
    });
  }
  return points;
}

export interface IntentSlice {
  intent: string;
  total: number;
}

/** Outflow (expense + savings) grouped by intent for the reference month. */
export function intentBreakdown(entries: FinanceEntry[], ref = new Date()): IntentSlice[] {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.type === "Income" || !inMonth(e.date, y, m)) continue;
    const key = e.intent || "Unassigned";
    map.set(key, (map.get(key) ?? 0) + Math.abs(Number(e.amount)));
  }
  return [...map.entries()]
    .map(([intent, total]) => ({ intent, total }))
    .sort((a, b) => b.total - a.total);
}

/** Spent (expense) per category for the reference month, keyed by category. */
export function spentByCategoryMap(entries: FinanceEntry[], ref = new Date()): Map<string, number> {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const map = new Map<string, number>();
  for (const e of entries) {
    if (!inMonth(e.date, y, m)) continue;
    map.set(e.category, (map.get(e.category) ?? 0) + Math.abs(Number(e.amount)));
  }
  return map;
}

/** All entries within the reference month, newest first. */
export function monthEntries(entries: FinanceEntry[], ref = new Date()): FinanceEntry[] {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  return entries
    .filter((e) => inMonth(e.date, y, m))
    .sort((a, b) => (a.date !== b.date ? b.date.localeCompare(a.date) : b.created_at.localeCompare(a.created_at)));
}

/** Build a CSV string for a set of entries. */
export function toCSV(entries: FinanceEntry[]): string {
  const header = ["Date", "Description", "Category", "Type", "Intent", "Amount"];
  const rows = entries.map((e) => [
    e.date,
    `"${(e.description ?? "").replace(/"/g, '""')}"`,
    e.category,
    e.type,
    e.intent ?? "",
    String(e.amount),
  ]);
  return [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export interface DayGroup {
  label: string;
  iso: string;
  entries: FinanceEntry[];
}

function dayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(d, today)) return "Today";
  if (same(d, yest)) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
}

/** Group entries by day, newest first. */
export function groupByDay(entries: FinanceEntry[]): DayGroup[] {
  const sorted = [...entries].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.created_at.localeCompare(a.created_at);
  });
  const groups: DayGroup[] = [];
  for (const e of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.iso === e.date) {
      last.entries.push(e);
    } else {
      groups.push({ label: dayLabel(e.date), iso: e.date, entries: [e] });
    }
  }
  return groups;
}
