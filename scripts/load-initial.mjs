// One-off: set the opening bank balance as a dated entry.
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, key);

  // Dated to end of last month so it sets the balance without skewing this month's stats.
  const { error } = await supabase.from("finance_entries").insert({
    date: "2026-05-31",
    description: "Opening balance",
    category: "Opening Balance",
    type: "Income",
    intent: null,
    amount: 6400,
  });
  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }
  console.log("Opening balance of GH\u20b56,400 set (dated 2026-05-31).");
}

main().catch((e) => { console.error(e); process.exit(1); });
