// Update promised payments: 500 + 50 + 50 (not paid yet, target 1 July).
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    process.env[t.slice(0, i).trim()] ??= t.slice(i + 1).trim();
  }
}

async function main() {
  loadEnvLocal();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Remove old single "Friend 500" row; re-seed all three promises.
  await supabase.from("finance_debts").delete().eq("direction", "i_owe").eq("note", "Promised");
  await supabase.from("finance_debts").delete().eq("direction", "i_owe").eq("counterparty", "Friend").eq("amount", 500);

  const promises = [
    { direction: "i_owe", counterparty: "Friend", amount: 500, paid: 0, due_date: "2026-07-01", note: "Promised" },
    { direction: "i_owe", counterparty: "Friend 2", amount: 50, paid: 0, due_date: "2026-07-01", note: "Promised" },
    { direction: "i_owe", counterparty: "Friend 3", amount: 50, paid: 0, due_date: "2026-07-01", note: "Promised" },
  ];

  const { error } = await supabase.from("finance_debts").insert(promises);
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  // Keep owed-to-me + MTN untouched
  console.log("Promises updated:");
  console.log("  I owe Friend   GH\u20b5500 · due 1 Jul");
  console.log("  I owe Friend 2 GH\u20b550  · due 1 Jul");
  console.log("  I owe Friend 3 GH\u20b550  · due 1 Jul");
  console.log("  Total promised: GH\u20b5600");
  console.log("Tap each in Debts to rename friends.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
