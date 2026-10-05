import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl && (process.env.NODE_ENV === "production" || process.env.DATA_MODE === "PRODUCTION")) {
  throw new Error("DATABASE_URL is required for Rider production database operations.");
}
const sql = postgres(databaseUrl || "postgres://postgres:postgres@localhost:5432/orderking", {
  max: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

export { sql };
