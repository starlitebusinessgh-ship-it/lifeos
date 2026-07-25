import { supabase } from "@/lib/supabase";
import type { Debt } from "./debts";
import { remaining } from "./debts";
import { notifyFinanceChanged } from "./debtEntrySync";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Pick expense category when paying a debt. */
export function expenseCategoryForDebt(d: Debt): string {
  const note = (d.note ?? "").toLowerCase();
  const name = d.counterparty.toLowerCase();
  if (note.includes("mtn") || note.includes("loan") || name.includes("mtn")) return "Loan Payment";
  if (note.includes("promised") || name.includes("friend")) return "Gifts";
  return "Other";
}

export interface PayResult {
  entryId?: number;
  newPaid: number;
  settled: boolean;
}

/** Log payment as transaction and update debt paid amount. */
export async function payDebt(
  debt: Debt,
  amount?: number
): Promise<PayResult> {
  const rem = remaining(debt);
  const payAmount = amount ?? rem;
  if (payAmount <= 0) return { newPaid: Number(debt.paid), settled: rem <= 0 };

  const newPaid = Math.min(Number(debt.amount), Number(debt.paid) + payAmount);
  const settled = newPaid >= Number(debt.amount);

  if (debt.direction === "i_owe") {
    const { data, error } = await supabase
      .from("finance_entries")
      .insert({
        date: todayISO(),
        description: `Paid ${debt.counterparty}${debt.note ? ` · ${debt.note}` : ""}`,
        category: expenseCategoryForDebt(debt),
        type: "Expense",
        intent: debt.note?.toLowerCase().includes("promised") ? "Giving" : "Necessary",
        amount: payAmount,
        debt_id: debt.id,
      })
      .select("id")
      .single();
    if (error) throw error;

    await supabase.from("finance_debts").update({ paid: newPaid }).eq("id", debt.id);
    notifyFinanceChanged();
    return { entryId: data?.id as number, newPaid, settled };
  }

  // owed_to_me — log as income when marking received
  const { data, error } = await supabase
    .from("finance_entries")
    .insert({
      date: todayISO(),
      description: `Received from ${debt.counterparty}`,
      category: "Other Income",
      type: "Income",
      intent: null,
      amount: payAmount,
      debt_id: debt.id,
    })
    .select("id")
    .single();
  if (error) throw error;

  await supabase.from("finance_debts").update({ paid: newPaid }).eq("id", debt.id);
  notifyFinanceChanged();
  return { entryId: data?.id as number, newPaid, settled };
}
