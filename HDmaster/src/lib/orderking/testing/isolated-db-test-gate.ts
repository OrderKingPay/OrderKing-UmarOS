/**
 * These integration tests can WRITE to the target database. They must never
 * run against default CI or a production DB, even if an environment variable
 * (or an old source-code fallback) accidentally points to production.
 *
 * To run intentionally: provision a SEPARATE database named orderking_test_*,
 * set DATABASE_URL and ORDERKING_TEST_DATABASE_URL to the same secured URL,
 * and explicitly set ORDERKING_TEST_DB_MUTATIONS=YES_ISOLATED_ONLY.
 */
export function canRunDbMutationTests(): boolean {
  if (process.env.CI === "true") return false;
  if (process.env.ORDERKING_TEST_DB_MUTATIONS !== "YES_ISOLATED_ONLY") return false;
  const db = process.env.DATABASE_URL?.trim();
  const expected = process.env.ORDERKING_TEST_DATABASE_URL?.trim();
  if (!db || !expected || db !== expected) return false;
  try {
    const u = new URL(db);
    const dbName = decodeURIComponent(u.pathname.replace(/^\//, ""));
    const tls = u.searchParams.get("sslmode")?.toLowerCase();
    return (
      (u.protocol === "postgres:" || u.protocol === "postgresql:") &&
      dbName.startsWith("orderking_test_") &&
      !["no-verify", "disable"].includes(tls ?? "") &&
      !/(?:^|[.-])(prod|production)(?:[.-]|$)/i.test(u.hostname)
    );
  } catch {
    return false;
  }
}
