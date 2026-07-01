// One-off: align starting data with Chris's real finances.
// - Re-date opening balance to June (June salary already received & included)
// - Set confident budgets (Tithe, Offering, Grandma, Miscellaneous)
// - Seed known debts (friend owes 5,500; MTN loan 161; promised 500)
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

async function upsertBudget(supabase, category, type, amount) {
  const { data } = await supabase
    .from("finance_budget")
    .select("id")
    .eq("category", category)
    .maybeSingle();
  if (data?.id) {
    await supabase.from("finance_budget").update({ monthly_budget: amount, type }).eq("id", data.id);
  } else {
    await supabase.from("finance_budget").insert({ category, type, monthly_budget: amount });
  }
  console.log(`  budget: ${category} = GH\u20b5${amount}`);
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, key);

  // 1) Re-date opening balance to June (it already includes the June salary).
  const { error: dateErr } = await supabase
    .from("finance_entries")
    .update({ date: "2026-06-01", description: "Opening balance (incl. June salary)" })
    .eq("category", "Opening Balance");
  if (dateErr) console.error("Re-date failed:", dateErr.message);
  else console.log("Opening balance re-dated to 2026-06-01.");

  // 2) Budgets we're confident about.
  console.log("Budgets:");
  await upsertBudget(supabase, "Tithe", "Expense", 300);
  await upsertBudget(supabase, "Offering", "Expense", 400);
  await upsertBudget(supabase, "Grandma", "Expense", 300);
  await upsertBudget(supabase, "Miscellaneous", "Expense", 150);

  // 3) Debts — clear and seed the known ones.
  await supabase.from("finance_debts").delete().gte("id", 0);
  const { error: debtErr } = await supabase.from("finance_debts").insert([
    { direction: "owed_to_me", counterparty: "Friend", amount: 5500, paid: 0, due_date: null, note: "3,800 + 1,700" },
    { direction: "i_owe", counterparty: "MTN", amount: 161, paid: 0, due_date: "2026-07-28", note: "MTN loan" },
    { direction: "i_owe", counterparty: "Friend", amount: 500, paid: 0, due_date: "2026-07-01", note: "Promised" },
    { direction: "i_owe", counterparty: "Friend 2", amount: 50, paid: 0, due_date: "2026-07-01", note: "Promised" },
    { direction: "i_owe", counterparty: "Friend 3", amount: 50, paid: 0, due_date: "2026-07-01", note: "Promised" },
  ]);
  if (debtErr) console.error("Debt seed failed:", debtErr.message);
  else console.log("Debts seeded: owed to me GH\u20b55,500 · I owe GH\u20b5661.");

  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
