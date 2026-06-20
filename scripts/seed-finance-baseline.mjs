import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

const BUDGET_ROWS = [
  { category: "Salary", type: "Income", monthly_budget: 2800 },
  { category: "Other Income", type: "Income", monthly_budget: 0 },
  { category: "Family Support", type: "Expense", monthly_budget: 400 },
  { category: "Tithe", type: "Expense", monthly_budget: 300 },
  { category: "Personal Spending", type: "Expense", monthly_budget: 100 },
  { category: "Transport", type: "Expense", monthly_budget: 0 },
  { category: "Food", type: "Expense", monthly_budget: 0 },
  { category: "Health", type: "Expense", monthly_budget: 0 },
  { category: "Gifts", type: "Expense", monthly_budget: 0 },
  { category: "Loan Payment", type: "Expense", monthly_budget: 0 },
  { category: "Other", type: "Expense", monthly_budget: 0 },
  { category: "Savings Transfer", type: "Savings", monthly_budget: 2000 },
];

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY required in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  await supabase.from("finance_budget").delete().gte("id", 0);

  const { error } = await supabase.from("finance_budget").insert(BUDGET_ROWS);
  if (error) {
    console.error("Failed to seed budget:", error.message);
    process.exit(1);
  }

  const { count } = await supabase
    .from("finance_budget")
    .select("*", { count: "exact", head: true });

  console.log(`Finance budget seeded: ${count ?? 0} categories`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
