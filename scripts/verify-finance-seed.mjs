import fs from "node:fs";
import path from "node:path";

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
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(
  "."
)[0];

const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        SELECT date, description, category, type, amount
        FROM public.finance_entries
        WHERE date >= '2026-06-01' AND date <= '2026-06-07'
        ORDER BY date;
      `,
    }),
  }
);

const body = await response.text();
if (!response.ok) {
  console.error("Query failed:", body);
  process.exit(1);
}

const rows = JSON.parse(body);
console.log(`Found ${rows.length} seed rows:\n`);
for (const row of rows) {
  console.log(
    `  ${row.date} | ${row.description} | ${row.category} | ${row.type} | GH₵${row.amount}`
  );
}

if (rows.length < 5) {
  console.error("\nExpected at least 5 rows.");
  process.exit(1);
}

console.log("\nSeed verification passed.");
