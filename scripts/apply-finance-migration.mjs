import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import pg from "pg";

const MIGRATION_FILE = path.join(
  "supabase",
  "migrations",
  "20260615140000_create_finance_entries.sql"
);

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

function getProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  try {
    const hostname = new URL(url).hostname;
    return hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

async function applyWithDatabaseUrl(connectionString) {
  const sql = fs.readFileSync(MIGRATION_FILE, "utf8");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

function applyWithSupabaseCli(projectRef, password) {
  const link = spawnSync(
    "npx",
    [
      "supabase",
      "link",
      "--project-ref",
      projectRef,
      "--password",
      password,
      "--yes",
    ],
    { stdio: "inherit", shell: true }
  );

  if (link.status !== 0) {
    process.exit(link.status ?? 1);
  }

  const push = spawnSync("npx", ["supabase", "db", "push", "--yes"], {
    stdio: "inherit",
    shell: true,
  });

  if (push.status !== 0) {
    process.exit(push.status ?? 1);
  }
}

async function applyWithAccessToken(projectRef) {
  const sql = fs.readFileSync(MIGRATION_FILE, "utf8");
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Supabase API error (${response.status}): ${body}`);
  }

  console.log(body || "Query executed successfully.");
}

async function main() {
  loadEnvLocal();

  const projectRef = getProjectRef();
  if (!projectRef) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL in .env.local (cannot determine project ref)."
    );
    process.exit(1);
  }

  if (process.env.DATABASE_URL) {
    console.log("Applying migration via DATABASE_URL...");
    await applyWithDatabaseUrl(process.env.DATABASE_URL);
    console.log("finance_entries table created.");
    return;
  }

  if (process.env.SUPABASE_DB_PASSWORD) {
    const connectionString = `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`;
    console.log("Applying migration via database password...");
    await applyWithDatabaseUrl(connectionString);
    console.log("finance_entries table created.");
    return;
  }

  if (process.env.SUPABASE_ACCESS_TOKEN) {
    console.log("Applying migration via Supabase Management API...");
    await applyWithAccessToken(projectRef);
    console.log("finance_entries table created.");
    return;
  }

  console.error(`
Could not apply migration — no database credentials found in .env.local.

Add ONE of the following, then run: npm run db:migrate:finance

1) SUPABASE_DB_PASSWORD (recommended)
   Supabase Dashboard → Project Settings → Database → Database password
   (Click "Reveal" or reset if needed)

2) DATABASE_URL (full Postgres connection string)
   Supabase Dashboard → Project Settings → Database → Connection string → URI
   Use the "Direct connection" string and replace [YOUR-PASSWORD]

3) SUPABASE_ACCESS_TOKEN
   https://supabase.com/dashboard/account/tokens → Generate new token
`);
  process.exit(1);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
