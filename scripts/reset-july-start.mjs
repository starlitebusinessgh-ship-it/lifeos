// Fresh start from July 2026 — no June transaction logs.
// Opening balance reflects everything already done/paid this month.
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

async function main() {
  loadEnvLocal();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Clear all transaction logs — user starts logging from July.
  const { error: delErr } = await supabase.from("finance_entries").delete().gte("id", 0);
  if (delErr) {
    console.error("Delete failed:", delErr.message);
    process.exit(1);
  }

  const { error: insErr } = await supabase.from("finance_entries").insert({
    date: "2026-07-01",
    description: "Starting balance",
    category: "Opening Balance",
    type: "Income",
    intent: null,
    amount: 6400,
  });
  if (insErr) {
    console.error("Opening balance failed:", insErr.message);
    process.exit(1);
  }
  console.log("Starting balance GH\u20b56,400 set for 2026-07-01 (no June logs).");

  // Savings goal: GH₵20,000 by end of national service (Nov 2026).
  const goal = {
    amount: 20000,
    deadline: "2026-11-30",
    label: "End of national service",
  };
  const { error: goalErr } = await supabase
    .from("finance_settings")
    .upsert({ key: "savings_goal", value: goal, updated_at: new Date().toISOString() });
  if (goalErr) console.error("Savings goal failed:", goalErr.message);
  else console.log("Savings goal: GH\u20b520,000 by Nov 2026.");

  // Monthly savings target to hit 20k in 5 months (Jul–Nov).
  const { data: savRow } = await supabase
    .from("finance_budget")
    .select("id")
    .eq("category", "Savings Transfer")
    .maybeSingle();
  if (savRow?.id) {
    await supabase.from("finance_budget").update({ monthly_budget: 4000 }).eq("id", savRow.id);
    console.log("Monthly savings budget target: GH\u20b54,000.");
  }

  console.log("Done — start logging from July.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
