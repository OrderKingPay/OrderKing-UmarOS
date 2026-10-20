import { afterEach, describe, expect, it, vi } from "vitest";
import { AmadeusFlightProvider } from "./amadeus-flight-provider";

describe("Amadeus sandbox is not production ticketing", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("never enables test credentials as a public production flight feed", () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    vi.stubEnv("NODE_ENV", "production");
    expect(new AmadeusFlightProvider().isAvailable()).toBe(false);
  });

  it("never reports a sandbox flight order as a confirmed paid e-ticket", async () => {
    vi.stubEnv("AMADEUS_CLIENT_ID", "test-id");
    vi.stubEnv("AMADEUS_CLIENT_SECRET", "test-secret");
    const provider = new AmadeusFlightProvider();
    const outcome = await provider.book({} as never);
    expect(outcome.success).toBe(false);
    expect(outcome.status).toBe("BLOCKED_BY_EXTERNAL_PROVIDER");
    expect(outcome.pnr).toBeUndefined();
  });
});
