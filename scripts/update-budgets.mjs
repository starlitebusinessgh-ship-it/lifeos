// Update budgets from Chris's real numbers + log June grandma payment if missing.
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Transport: Mon–Fri ~18.5 avg (16–21) × 22 days + Sun church 15 × 4
  const transportBudget = Math.round(18.5 * 22 + 15 * 4); // 467 → 467

  // Food: allowance cash after transport — mom gives 50–100/day on workdays;
  // typical food spend ~35–40/day × 22 ≈ 770, rounded down for conservative budget
  const foodBudget = 750;

  // Allowance income target: ~75/day weekdays + 100 Sat + 100 Sun
  const allowanceTarget = Math.round(75 * 22 + 100 * 4 + 100 * 4); // 2450

  console.log("Updating budgets:");
  await upsertBudget(supabase, "Family Support", "Expense", 200);
  await upsertBudget(supabase, "Grandma", "Expense", 300);
  await upsertBudget(supabase, "Transport", "Expense", transportBudget);
  await upsertBudget(supabase, "Food", "Expense", foodBudget);
  await upsertBudget(supabase, "Tithe", "Expense", 300);
  await upsertBudget(supabase, "Offering", "Expense", 300); // 3 Sundays × 100 (last Sunday is tithe)
  await upsertBudget(supabase, "Miscellaneous", "Expense", 150);
  await upsertBudget(supabase, "Allowance", "Income", allowanceTarget);

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
