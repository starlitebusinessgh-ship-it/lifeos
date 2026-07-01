import type { FinanceEntry } from "./types";

const CACHE_KEY = "lifeos.finance.entries.v1";

export function readEntriesCache(): FinanceEntry[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FinanceEntry[];
  } catch {
    return null;
  }
}

export function writeEntriesCache(entries: FinanceEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {}
}
