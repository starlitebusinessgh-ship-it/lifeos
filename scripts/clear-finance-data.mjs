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

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY required in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { error: e1 } = await supabase.from("finance_entries").delete().gte("id", 0);
  const { error: e2 } = await supabase.from("finance_budget").delete().gte("id", 0);

  if (e1) {
    console.error("Failed to clear entries:", e1.message);
    process.exit(1);
  }
  if (e2) {
    console.error("Failed to clear budget:", e2.message);
    process.exit(1);
  }

  const { count: entryCount } = await supabase
    .from("finance_entries")
    .select("*", { count: "exact", head: true });
  const { count: budgetCount } = await supabase
    .from("finance_budget")
    .select("*", { count: "exact", head: true });

  console.log(`Cleared finance data. Entries: ${entryCount ?? 0}, Budget rows: ${budgetCount ?? 0}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
