import postgres from "postgres";

const rawUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/orderking";
const dbUrl = rawUrl.replace(/&connection_limit=\d+/, "");

const sql = postgres(dbUrl, {
  max: 1,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  ssl: dbUrl.includes("supabase") || dbUrl.includes("neon") ? { rejectUnauthorized: false } : undefined,
});

export { sql };
