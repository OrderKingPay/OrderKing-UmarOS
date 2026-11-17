#!/usr/bin/env node
/**
 * Deploy-time database migrator (node-postgres, `pg`).
 *
 * Runs during `npm run build` — on every Vercel deploy — applying pending files
 * in ../migrations to DATABASE_URL. Each file is applied in one transaction and
 * recorded in a `_migrations` table, so it runs once and is safe to re-run.
 *
 * The read is non-recursive, so the opt-in auth schema under migrations/auth/
 * is not applied to an app that never asked for sign-in.
 *
 * No DATABASE_URL (local / preview builds) -> skip; the PGLite fallback applies
 * the same files at startup instead (see src/lib/db.ts).
 */
import dns from "node:dns";
try { if (typeof dns.setDefaultResultOrder === "function") dns.setDefaultResultOrder("ipv4first"); } catch (_) {}
import { readFileSync, existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { pendingMigrations } from "./migration-plan.mjs";

let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".env");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf8");
    const m = content.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (m && m[1]) {
      databaseUrl = m[1].trim();
    }
  }
}
if (!databaseUrl || !databaseUrl.startsWith("postgres")) {
  databaseUrl = "postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=no-verify";
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

async function main() {
  let entries;
  try {
    entries = await readdir(migrationsDir);
  } catch {
    console.log("[migrate] no migrations/ directory — nothing to do.");
    return;
  }
  // An app with no schema of its own must not pay for a database connection.
  if (pendingMigrations(entries, []).length === 0) {
    console.log("[migrate] no migrations — nothing to do.");
    return;
  }

  const effectiveUrl = databaseUrl.replace(":6543", ":5432");
  const host = effectiveUrl.includes("@") ? effectiveUrl.split("@")[1].split(/[:\/?]/)[0] : undefined;
  const isRemote = effectiveUrl.includes("neon.tech") || effectiveUrl.includes("sslmode=") || effectiveUrl.includes("supabase.co") || effectiveUrl.includes("supabase.com") || !effectiveUrl.includes("localhost");
  const pool = new pg.Pool({
    connectionString: effectiveUrl,
    ssl: isRemote ? { rejectUnauthorized: false, servername: host } : undefined,
    connectionTimeoutMillis: 25000,
    idleTimeoutMillis: 15000,
    max: 1,
  });
  const client = await pool.connect();
  try {
    await client.query(
      "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
    );
    const applied = (await client.query("SELECT name FROM _migrations")).rows.map(
      (r) => r.name,
    );

    let count = 0;
    for (const { name } of pendingMigrations(entries, applied)) {
      const text = await readFile(join(migrationsDir, name), "utf8");
      try {
        await client.query("BEGIN");
        // pg's simple-query protocol runs a whole multi-statement file at once.
        await client.query(text);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [name]);
        await client.query("COMMIT");
      } catch (err) {
        console.error(`[migrate] error applying ${name}`);
        try {
          await client.query("ROLLBACK");
        } catch {
          // ROLLBACK fails when the connection died — keep the original error.
        }
        throw err;
      }
      console.log(`[migrate] applied ${name}`);
      count += 1;
    }
    console.log(count ? `[migrate] done — ${count} migration(s) applied.` : "[migrate] up to date.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[migrate] failed:", err?.message || err);
  // pg errors carry the context needed to debug a bad SQL file.
  for (const key of ["code", "detail", "hint", "position", "where"]) {
    if (err?.[key] != null) console.error(`[migrate]   ${key}: ${err[key]}`);
  }
  process.exit(1);
});
