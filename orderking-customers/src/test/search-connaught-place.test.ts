import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Search must never invent restaurants", () => {
  it.each(["", "&q=Biryani", "&q=Dosa"])("fails closed when catalog database is unavailable (%s)", async (query) => {
    vi.resetModules();
    vi.doMock("@/lib/db", () => ({
      getSql: async () => { throw new Error("Database unavailable in test"); },
    }));
    const { Route } = await import("../routes/api/search");
    const handler = (Route.options as any)?.server?.handlers?.GET;
    expect(handler).toBeDefined();
    const url = "http://localhost:8082/api/search?lat=28.6315&lng=77.2167" + query;
    const request = new Request(url, { headers: { "x-forwarded-for": "10.18.26." + (query === "" ? "1" : query.includes("Biryani") ? "2" : "3") } });
    const response = await handler({ request });
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.error).toBe("RESTAURANT_CATALOG_UNAVAILABLE");
    expect(data.deliveryAvailable).toBe(false);
    expect(data.restaurants).toEqual([]);
    expect(data.dishes).toEqual([]);
    vi.doUnmock("@/lib/db");
  });
});
