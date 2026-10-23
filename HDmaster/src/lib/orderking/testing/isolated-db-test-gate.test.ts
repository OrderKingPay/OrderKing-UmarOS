import { afterEach, describe, expect, it, vi } from "vitest";
import { canRunDbMutationTests } from "./isolated-db-test-gate";

afterEach(() => vi.unstubAllEnvs());

describe("database integration safety", () => {
  it("rejects absent or partial opt-in", () => {
    vi.stubEnv("CI", "");
    vi.stubEnv("ORDERKING_TEST_DB_MUTATIONS", "");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("ORDERKING_TEST_DATABASE_URL", "");
    expect(canRunDbMutationTests()).toBe(false);
  });

  it("rejects enabled test mutation on production CI", () => {
    const db = "postgresql://test-user@localhost:5432/orderking_test_sandbox?sslmode=verify-full";
    vi.stubEnv("CI", "true");
    vi.stubEnv("ORDERKING_TEST_DB_MUTATIONS", "YES_ISOLATED_ONLY");
    vi.stubEnv("DATABASE_URL", db);
    vi.stubEnv("ORDERKING_TEST_DATABASE_URL", db);
    expect(canRunDbMutationTests()).toBe(false);
  });

  it("refuses mismatched DB, production hostname and insecure TLS", () => {
    vi.stubEnv("CI", "");
    vi.stubEnv("ORDERKING_TEST_DB_MUTATIONS", "YES_ISOLATED_ONLY");
    vi.stubEnv("DATABASE_URL", "postgresql://test-user@db.production.example/orderking_test_sandbox?sslmode=verify-full");
    vi.stubEnv("ORDERKING_TEST_DATABASE_URL", "postgresql://test-user@localhost/orderking_test_sandbox?sslmode=verify-full");
    expect(canRunDbMutationTests()).toBe(false);
    vi.stubEnv("ORDERKING_TEST_DATABASE_URL", process.env.DATABASE_URL);
    expect(canRunDbMutationTests()).toBe(false);
    const noTls = "postgresql://test-user@localhost/orderking_test_sandbox?sslmode=no-verify";
    vi.stubEnv("DATABASE_URL", noTls);
    vi.stubEnv("ORDERKING_TEST_DATABASE_URL", noTls);
    expect(canRunDbMutationTests()).toBe(false);
  });

  it("permits only explicit dedicated test DB and never connects from this unit test", () => {
    const db = "postgresql://test-user@localhost/orderking_test_sandbox?sslmode=verify-full";
    vi.stubEnv("CI", "");
    vi.stubEnv("ORDERKING_TEST_DB_MUTATIONS", "YES_ISOLATED_ONLY");
    vi.stubEnv("DATABASE_URL", db);
    vi.stubEnv("ORDERKING_TEST_DATABASE_URL", db);
    expect(canRunDbMutationTests()).toBe(true);
  });
});
