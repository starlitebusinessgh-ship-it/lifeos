// Force-seed recurring templates for Chris (one-time).
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    process.env[t.slice(0, i).trim()] ??= t.slice(i + 1).trim();
  }
}

const DEFAULT = [
  { id: "salary", type: "Income", category: "Salary", amount: 2850, intent: null, description: "National service salary" },
  { id: "tithe", type: "Expense", category: "Tithe", amount: 300, intent: "Giving", description: "Monthly tithe" },
  { id: "offering", type: "Expense", category: "Offering", amount: 300, intent: "Giving", description: "Sunday offerings (~3×100)" },
  { id: "grandma", type: "Expense", category: "Grandma", amount: 300, intent: "Giving", description: "Grandma support" },
  { id: "family", type: "Expense", category: "Family Support", amount: 200, intent: "Giving", description: "Family reserve" },
  { id: "savings", type: "Savings", category: "Savings Transfer", amount: 4000, intent: "Investment", description: "Monthly savings (20k goal)" },
];

async function main() {
  loadEnv();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  await supabase.from("finance_settings").upsert({
    key: "recurring_templates",
    value: DEFAULT,
    updated_at: new Date().toISOString(),
  });
  console.log("Recurring templates saved to database (6 items).");
  console.log("Browser will pick them up on next Home visit.");
}

main();
