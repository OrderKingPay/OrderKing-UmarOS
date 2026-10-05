import pg from "pg";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("DATABASE_URL is required. No database credential is stored in source control.");
}

const client = new Client({ connectionString });

try {
  await client.connect();
  const result = await client.query(
    "SELECT id, name, email, role_key, assumed_role_key FROM employees",
  );
  console.log(result.rows);
} finally {
  await client.end().catch(() => {});
}
