import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL?.trim();
const isProduction = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

if (isProduction && !databaseUrl) {
  throw new Error("Rider production database is not configured: DATABASE_URL is required.");
}

const sql = postgres(
  databaseUrl || "postgres://postgres:postgres@localhost:5432/orderking",
  {
    max: 10,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  },
);

export { sql };
