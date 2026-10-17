import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const { sql, gatewayConfig } = vi.hoisted(() => ({
  sql: vi.fn(() => { throw new Error("Database should not be accessed without verified coverage"); }),
  gatewayConfig: vi.fn(() => ({ hasCredentials: true, keyId: "test-only", keySecret: "test-only" })),
}));
// Exercise the actual RPC handlers; replace only framework transport and external services.
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder: any = {
      middleware: () => builder,
      validator: () => builder,
      handler: (handler: any) => handler,
    };
    return builder;
  },
}));
vi.mock("@/lib/auth/middleware", () => ({ authMiddleware: {} }));
vi.mock("@/lib/db", () => ({ getSql: sql }));
vi.mock("../lib/server/load-config", () => ({ loadConfig: vi.fn(async () => ({
  marketplace: { launchMode: "live" },
})) }));
vi.mock("../lib/server/razorpay.server", () => ({ getRazorpayConfig: gatewayConfig }));

import { buildQuote } from "../lib/server/quote";
import { createRazorpayOrder } from "../lib/server/razorpay-order";
import { placeOrderViaHDmaster } from "../lib/server/hdmaster-orders";

const cart = {
  restaurantId: "unverified-kitchen", zoneId: "unverified-zone", lat: 10.0, lng: 10.0,
  lines: [{ itemId: "unverified-item", quantity: 1, variantId: null, addonIds: [], instructions: "" }],
};
const payment = { ...cart, amountPaise: 10000, tipPaise: 0, currency: "INR", receipt: "test-receipt-123" };
let network: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.clearAllMocks();
  network = vi.fn(async () => new Response(JSON.stringify({ id: "order_test", amount: 10000, currency: "INR" })));
  vi.stubGlobal("fetch", network);
});
afterEach(() => vi.unstubAllGlobals());

describe("unverified delivery is rejected before checkout side effects", () => {
  it("does not price an unverified delivery location, even in live launch mode", async () => {
    await expect(buildQuote(cart, false)).rejects.toThrow(/verified delivery|delivery.*unavailable/i);
    expect(sql).not.toHaveBeenCalled();
  });
  it("does not accept missing or invalid coordinates", async () => {
    for (const lat of [NaN, Infinity, 91]) {
      await expect(buildQuote({ ...cart, lat }, false)).rejects.toThrow(/coordinates|delivery.*unavailable/i);
    }
    expect(sql).not.toHaveBeenCalled();
  });
  it("rejects unauthenticated payment creation before contacting the gateway", async () => {
    await expect((createRazorpayOrder as any)({ context: {}, data: payment })).rejects.toThrow(/sign in|authentication/i);
    expect(network).not.toHaveBeenCalled();
  });
  it("rejects payment creation for an unverified location before contacting the gateway", async () => {
    await expect((createRazorpayOrder as any)({ context: { userId: "test-user" }, data: payment })).rejects.toThrow(/verified delivery|delivery.*unavailable/i);
    expect(network).not.toHaveBeenCalled();
  });
  it("rejects a legacy amount-only payment request", async () => {
    await expect((createRazorpayOrder as any)({ context: { userId: "test-user" }, data: { amountPaise: 10000, receipt: "legacy" } })).rejects.toThrow(/cart|delivery|coordinates/i);
    expect(network).not.toHaveBeenCalled();
  });
  it("does not forward an unverified order to HDmaster", async () => {
    await expect((placeOrderViaHDmaster as any)({ context: { userId: "test-user" }, data: {
      ...cart, address: { line1: "Test address", area: "Test area" }, paymentMethod: "COD", idempotencyKey: "test-idempotency",
    } })).rejects.toThrow(/verified delivery|delivery.*unavailable/i);
    expect(network).not.toHaveBeenCalled();
  });
});

describe("gateway prerequisites after a verified server quote", () => {
  // These isolated fixtures exercise gateway failure handling, not live service availability.
  afterEach(() => vi.restoreAllMocks());
  async function pricedCart() {
    const quoteModule = await import("../lib/server/quote");
    vi.spyOn(quoteModule, "buildQuote").mockResolvedValue({
      result: { isDeliverable: true, quote: { totalPaise: 10000, blockers: [] } },
    } as any);
  }
  it("does not create a payment when the provider is unconfigured", async () => {
    await pricedCart();
    gatewayConfig.mockReturnValueOnce({ hasCredentials: false, keyId: "", keySecret: "" });
    await expect((createRazorpayOrder as any)({ context: { userId: "test-user" }, data: payment })).rejects.toThrow(/provider.*unavailable/i);
    expect(network).not.toHaveBeenCalled();
  });
  it("rejects browser amount tampering before contacting the provider", async () => {
    await pricedCart();
    await expect((createRazorpayOrder as any)({ context: { userId: "test-user" }, data: { ...payment, amountPaise: 1 } })).rejects.toThrow(/amount changed/i);
    expect(network).not.toHaveBeenCalled();
  });
  it("rejects a provider outage without exposing its response body", async () => {
    await pricedCart();
    network.mockResolvedValueOnce(new Response("sensitive-provider-detail", { status: 503 }));
    await expect((createRazorpayOrder as any)({ context: { userId: "test-user" }, data: payment })).rejects.toThrow("Payment provider could not prepare checkout.");
  });
  it("rejects mismatched provider amounts", async () => {
    await pricedCart();
    network.mockResolvedValueOnce(new Response(JSON.stringify({ id: "order_test", amount: 1, currency: "INR" })));
    await expect((createRazorpayOrder as any)({ context: { userId: "test-user" }, data: payment })).rejects.toThrow(/invalid checkout/i);
  });
});
