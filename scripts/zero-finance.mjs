// Zeroes finance data for a fresh start:
//  - deletes ALL finance_entries (balance -> 0)
//  - keeps finance_budget category rows but sets monthly_budget = 0
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const k = trimmed.slice(0, i).trim();
    const v = trimmed.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env vars in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const { error: delErr } = await supabase.from("finance_entries").delete().gte("id", 0);
  if (delErr) {
    console.error("Failed to clear entries:", delErr.message);
    process.exit(1);
  }

  const { error: budErr } = await supabase
    .from("finance_budget")
    .update({ monthly_budget: 0 })
    .gte("id", 0);
  if (budErr) {
    console.error("Failed to zero budgets:", budErr.message);
    process.exit(1);
  }

  const { count: entryCount } = await supabase
    .from("finance_entries")
    .select("*", { count: "exact", head: true });
  const { data: budgets } = await supabase
    .from("finance_budget")
    .select("category, monthly_budget");

  console.log(`Done. Entries remaining: ${entryCount ?? 0}. Budget rows: ${budgets?.length ?? 0} (all set to 0).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
