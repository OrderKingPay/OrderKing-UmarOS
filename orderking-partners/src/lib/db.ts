import { pendingMigrations } from "../../scripts/migration-plan.mjs";

export type DbSource = "neon" | "unconfigured";
const rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : undefined;
let databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : undefined;
if (databaseUrl && databaseUrl.includes("your_supabase_pooler")) {
  databaseUrl = undefined;
}

export const dbSource: DbSource = databaseUrl ? "neon" : "unconfigured";

export interface Sql {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;
  transaction<T>(cb: (tx: Sql) => Promise<T>): Promise<T>;
}

const globalRef = globalThis as typeof globalThis & {
  __pgSqlPromise__?: Promise<Sql>;
};

const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v: string) => v;
type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

function toSql(
  run: Run,
  transaction?: <T>(fn: (tx: Sql) => Promise<T>) => Promise<T>,
): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += "$" + (i + 1) + strings[i + 1];
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    run<T>(text, params);
  sql.transaction = async <T>(cb: (tx: Sql) => Promise<T>): Promise<T> => {
    if (!transaction) throw new Error("Database transactions are unavailable");
    return transaction(cb);
  };
  return sql;
}

function createNeonSql(): Promise<Sql> {
  globalRef.__pgSqlPromise__ ??= (async () => {
    const { Pool, types } = await import("pg");
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, identity);
    types.setTypeParser(OID_INTERVAL, identity);
    const pool = new Pool({ connectionString: databaseUrl });
    pool.on('error', (err) => console.error('pg pool error:', err.message));
    const makeClientSql = (client: import("pg").PoolClient) =>
      toSql(async <T>(text: string, params: unknown[]) => {
        const res = await client.query(text, params);
        return res.rows as T[];
      });

    return toSql(
      async <T>(text: string, params: unknown[]) => {
        const res = await pool.query(text, params);
        return res.rows as T[];
      },
      async <T>(fn: (tx: Sql) => Promise<T>) => {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const result = await fn(makeClientSql(client));
          await client.query("COMMIT");
          return result;
        } catch (error) {
          try { await client.query("ROLLBACK"); } catch { /* preserve original */ }
          throw error;
        } finally {
          client.release();
        }
      },
    );
  })().catch((err) => {
    globalRef.__pgSqlPromise__ = undefined;
    throw err;
  });
  return globalRef.__pgSqlPromise__;
}

let sqlPromise: Promise<Sql> | null = null;

async function createSql(): Promise<Sql> {
  if (typeof window !== "undefined") {
    throw new Error("@/lib/db is server-only");
  }
  if (dbSource === "unconfigured") {
    const missingDatabase: Run = async () => {
      throw new Error("DATABASE_URL is required for Partner server-side database operations.");
    };
    return toSql(missingDatabase);
  }
  return createNeonSql();
}

export function getSql(): Promise<Sql> {
  sqlPromise ??= createSql().catch((err) => {
    sqlPromise = null; 
    throw err;
  });
  return sqlPromise;
}

export async function getPglite(): Promise<any> { throw new Error("PGLite is intentionally removed."); }

export async function ensureDbReady(): Promise<void> {
  const sql = await getSql();
  await sql.query("select 1 as ok");
}
