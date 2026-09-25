import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/orderking", {
  max: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

export { sql };
