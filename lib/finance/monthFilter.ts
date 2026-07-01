import type { FinanceEntry } from "./types";

const MONTH_KEY = "lifeos.finance.month";

export function currentMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function readStoredMonth(): string {
  if (typeof window === "undefined") return currentMonthISO();
  return localStorage.getItem(MONTH_KEY) ?? currentMonthISO();
}

export function storeMonth(iso: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MONTH_KEY, iso);
}

export function monthLabel(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function filterByMonth(entries: FinanceEntry[], monthIso: string): FinanceEntry[] {
  return entries.filter((e) => e.date.startsWith(monthIso));
}

export function shiftMonth(iso: string, delta: number): string {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
