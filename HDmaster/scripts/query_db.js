import pg from "pg";

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  throw new Error("DATABASE_URL is required. This helper never contains embedded credentials.");
}

const { Client } = pg;
const client = new Client({ connectionString });

try {
  await client.connect();
  const result = await client.query(
    "SELECT id, name, email, role_key, assumed_role_key FROM employees",
  );
  console.log(JSON.stringify(result.rows, null, 2));
} finally {
  await client.end().catch(() => undefined);
}
