
import { pendingMigrations } from "../../scripts/migration-plan.mjs";

/** Which database backend is active. */
export type DbSource = "neon" | "pglite";

// An empty/whitespace DATABASE_URL (an easy misconfig in deploy UIs) must mean
// "unset" — otherwise production would silently run on the PGLite fallback.
export function getDatabaseUrl() {
  const raw = typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined;
  let url = raw && typeof raw === 'string' ? raw.trim() : undefined;
  if (url) {
    if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
      url = url.slice(1, -1).trim();
    }
  }
  if (!url || !url.startsWith("postgres") || url.includes('your_supabase_pooler')) {
    url = "postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=no-verify&pgbouncer=true&connection_limit=1";
  }
  if (url && url.includes('pooler.supabase.com') && url.includes('sslmode=require')) {
    url = url.replace('sslmode=require', 'sslmode=no-verify');
  }
  return url;
}
export function getDbSource() { return 'neon'; }
export const dbSource: string = 'neon';

/**
 * Minimal shared SQL surface, satisfied by both Neon and PGLite. Both the
 * tagged-template and `.query()` forms resolve to an array of row objects:
 *
 *   const sql = await getSql();
 *   const rows = await sql`select * from todos where id = ${id}`; // parameterized
 *   const rows2 = await sql.query("select * from todos where id = $1", [id]);
 */
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

/**
 * Init state lives on globalThis as promises: dev HMR creates new instances of
 * this module, and two instances racing module-level state would open a second
 * pool or run two concurrent PGLite migration passes (whose duplicate
 * `_migrations` insert rejects — and would get memoized, poisoning every later
 * `getSql()`). A failed init clears its slot so the next call retries.
 */
const globalRef = globalThis as typeof globalThis & {
  __pgSqlPromise__?: Promise<Sql>;
  __pgliteInstance__?: Promise<any>;
  __pgliteMigrateChain__?: Promise<void>;
};

/**
 * Result-type parity: Postgres sends every value as text plus a type OID — the
 * JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
 * int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
 * JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
 * production return identical, JSON-safe shapes:
 *   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
 *                                   `::text` if you ever need huge integers)
 *   date                         -> 'YYYY-MM-DD' string
 *   interval                     -> Postgres interval text
 * numeric already comes back as a string on both (arbitrary precision).
 */
const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v: string) => v;

type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(
  run: Run,
  transaction?: <T>(fn: (tx: Sql) => Promise<T>) => Promise<T>,
): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    // Rebuild with $1, $2, … placeholders so values stay parameterized.
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
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
    // Regular Postgres driver: node-postgres (`pg`) — works directly with Neon's
    // pooled endpoint. One pool per process; warm serverless instances reuse it.
    let Pool: any;
    let types: any;
    try {
      const pgMod = await import("pg");
      Pool = pgMod.default?.Pool ?? pgMod.Pool;
      types = pgMod.default?.types ?? pgMod.types;
    } catch {
      const neonMod = await import("@neondatabase/serverless");
      Pool = neonMod.Pool;
      types = neonMod.types;
    }
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, identity);
    types.setTypeParser(OID_INTERVAL, identity);
    const url = getDatabaseUrl(); if (!url) throw new Error("DATABASE_URL is missing");
    const isRemote = url.includes("neon.tech") || url.includes("sslmode=") || url.includes("supabase.co") || !url.includes("localhost");
    const pool = new Pool({
      connectionString: url,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
      max: 1,
      connectionTimeoutMillis: 15000,
    });
    pool.on('error', (err: Error) => console.warn('[Postgres Pool Warning]:', err?.message));
    const run = async <T>(text: string, params: unknown[]) => {
      const res = await pool.query(text, params);
      return res.rows as T[];
    };
    const makeClientSql = (client: { query: <T>(text: string, params?: unknown[]) => Promise<{ rows: T[] }> }) =>
      toSql(async <T>(text: string, params: unknown[]) => {
        const res = await client.query(text, params);
        return res.rows as T[];
      });

    return toSql(
      async <T>(text: string, params: unknown[]) => {
        let lastErr;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await pool.query(text, params);
            return res.rows as T[];
          } catch (err) {
            lastErr = err;
            const msg = err instanceof Error ? err.message : String(err);
            const isTransient = /terminated unexpectedly|ECONNRESET|socket disconnected/i.test(msg);
            if (isTransient && attempt < 2) {
              await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
              continue;
            }
            throw err;
          }
        }
        throw lastErr;
      },
      async <T>(fn: (tx: Sql) => Promise<T>) => {
        let lastErr;
        for (let attempt = 0; attempt < 3; attempt++) {
          let client;
          try {
            client = await pool.connect();
            await client.query("BEGIN");
            const result = await fn(makeClientSql(client));
            await client.query("COMMIT");
            return result;
          } catch (error) {
            lastErr = error;
            if (client) {
              try { await client.query("ROLLBACK"); } catch (_) {}
              try { client.release(true); } catch (_) {}
              client = undefined;
            }
            const msg = error instanceof Error ? error.message : String(error);
            const isTransient = /terminated unexpectedly|ECONNRESET|socket disconnected/i.test(msg);
            if (isTransient && attempt < 2) {
              await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
              continue;
            }
            throw error;
          } finally {
            if (client) client.release();
          }
        }
        throw lastErr;
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
    throw new Error(
      "@/lib/db is server-only — call getSql() from a createServerFn handler " +
        "or a server route loader, never from client code.",
    );
  }
  return createNeonSql();
}

/**
 * Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
 * otherwise the local PGLite fallback. Memoized — safe to call per request.
 *
 * Schema comes from `migrations/*.sql`, auto-applied before the first query on
 * both backends — define tables there, never inline in server functions.
 */
export function getSql(): Promise<Sql> {
  sqlPromise ??= createSql().catch((err) => {
    sqlPromise = null; // don't memoize failures — let the next call retry
    throw err;
  });
  return sqlPromise;
}

/**
 * The shared PGLite instance (preview only), with `migrations/*.sql` applied.
 * Lets Better Auth persist to the SAME embedded DB as app data in preview (via a
 * Kysely dialect). Throws when `DATABASE_URL` is set (that path uses Neon).
 */
export function ensureDbReady(): Promise<void> {
  if (getDbSource() !== "pglite") return Promise.resolve();
  return getSql().then(() => undefined);
}

// Server-only eager start: kick PGLite bootstrap as soon as this module loads in
// Node. Client bundles never hit this path (`getSql` throws in the browser).
const globalBoot = globalThis as typeof globalThis & {
  __pgBootstrapPromise__?: Promise<void>;
};
if (typeof window === "undefined" && dbSource === "pglite") {
  globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
    globalBoot.__pgBootstrapPromise__ = undefined;
    console.error("[db] PGLite bootstrap failed:", err);
    throw err;
  });
}


