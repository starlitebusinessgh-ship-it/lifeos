import { supabase } from "@/lib/supabase";
import type { FinanceEntry } from "./types";

function entryAmount(entry: Pick<FinanceEntry, "amount">): number {
  return Math.abs(Number(entry.amount)) || 0;
}

/** Reverse debt progress when a linked payment/receipt entry is deleted. */
export async function reverseDebtForEntry(entry: Pick<FinanceEntry, "debt_id" | "amount">): Promise<void> {
  if (!entry.debt_id) return;

  const { data: debt, error } = await supabase
    .from("finance_debts")
    .select("id, paid")
    .eq("id", entry.debt_id)
    .single();

  if (error || !debt) return;

  const delta = entryAmount(entry);
  const newPaid = Math.max(0, Number(debt.paid) - delta);
  await supabase.from("finance_debts").update({ paid: newPaid }).eq("id", entry.debt_id);
}

/** Re-apply debt progress when a linked entry is restored (undo delete). */
export async function applyDebtForEntry(entry: Pick<FinanceEntry, "debt_id" | "amount">): Promise<void> {
  if (!entry.debt_id) return;

  const { data: debt, error } = await supabase
    .from("finance_debts")
    .select("id, paid, amount")
    .eq("id", entry.debt_id)
    .single();

  if (error || !debt) return;

  const delta = entryAmount(entry);
  const newPaid = Math.min(Number(debt.amount), Number(debt.paid) + delta);
  await supabase.from("finance_debts").update({ paid: newPaid }).eq("id", entry.debt_id);
}

export function notifyFinanceChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("lifeos:finance-changed"));
}
