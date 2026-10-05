import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. No database credential is embedded in source code.");
}

const client = new pg.Client({ connectionString: databaseUrl });

try {
  await client.connect();
  const result = await client.query(
    "SELECT id, name, email, role_key, assumed_role_key FROM employees",
  );
  console.log(result.rows);
} finally {
  await client.end().catch(() => {});
}
