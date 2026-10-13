import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  queries: [] as { sql: string; values: unknown[] }[],
  order: { id: "order-one", public_id: "OK-1", status: "PREPARING", placed_at: new Date(Date.now()-60*60000).toISOString(), total_paise: 20000, restaurant_id: "r-one" } as any,
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => { const b: any = { middleware: () => b, validator: () => b, handler: (h: any) => h }; return b; },
}));
vi.mock("@/lib/auth/middleware", () => ({ authMiddleware: {} }));
vi.mock("@/lib/db", () => ({
  getSql: async () => async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const sql = strings.join("?");
    state.queries.push({ sql, values });
    if (/select .* from orders/i.test(sql)) return state.order ? [state.order] : [];
    return [];
  },
}));
import { diagnoseAndResolveOrder } from "../lib/server/ai-support";
const request = (issueType: string, context = { userId: "user-one" }) =>
  (diagnoseAndResolveOrder as any)({ context, data: { orderId: "order-one", issueType, details: "Customer report" } });
beforeEach(() => {
  state.queries.length = 0;
  state.order = { id: "order-one", public_id: "OK-1", status: "PREPARING", placed_at: new Date(Date.now()-60*60000).toISOString(), total_paise: 20000, restaurant_id: "r-one" };
});
describe("support cannot fabricate compensation or refunds", () => {
  it("repeated delay checks are read-only", async () => {
    const first = await request("where_order");
    await request("where_order");
    expect(state.queries.filter(q => /insert|update|delete/i.test(q.sql))).toEqual([]);
    expect(first.compensationPaise).toBeUndefined();
    expect(first.actionTaken).toBe("STATUS_REPORT");
  });
  it("cancellation requests never bypass the order/payment state machine", async () => {
    const result = await request("cancel_order");
    expect(state.queries.some(q => /update orders|loyalty_accounts|loyalty_transactions/i.test(q.sql))).toBe(false);
    expect(result.actionTaken).toBe("REQUEST_RECORDED");
    expect(result.explanation).not.toMatch(/refund has been initiated|successfully cancelled/i);
  });
  it.each(["missing_item", "food_spilled"])("records %s as open without creating credits", async issue => {
    const result = await request(issue);
    expect(result.actionTaken).toBe("REQUEST_RECORDED");
    expect(result.compensationPaise).toBeUndefined();
    expect(state.queries.some(q => /loyalty_accounts|loyalty_transactions/i.test(q.sql))).toBe(false);
    expect(state.queries.some(q => /insert into support_tickets/i.test(q.sql) && /'open'/.test(q.sql))).toBe(true);
    expect(result.ticketId).toBeTruthy();
  });
  it("checks authentication before reading records", async () => {
    await expect(request("where_order", {} as any)).rejects.toThrow(/sign in/i);
    expect(state.queries).toEqual([]);
  });
  it("does not fabricate a rider assignment for a READY order", async () => {
    state.order.status = "READY";
    const result = await request("where_order");
    expect(result.explanation).not.toMatch(/partner has been assigned/i);
  });
  it("rejects unknown issue types before writing tickets", async () => {
    await expect(request("grant_money")).rejects.toThrow(/issue type/i);
    expect(state.queries.filter(q => /insert|update/i.test(q.sql))).toEqual([]);
  });
  it("does not disclose or mutate an inaccessible order", async () => {
    state.order = null;
    await expect(request("where_order")).rejects.toThrow(/not found|access denied/i);
    expect(state.queries[0].sql).toMatch(/user_id/);
    expect(state.queries[0].values).toContain("user-one");
    expect(state.queries.filter(q => /insert|update/i.test(q.sql))).toEqual([]);
  });
});

vi.mock("@/lib/ai/providers/gemini-provider", () => ({
  GoogleGeminiProvider: class {
    isConfigured = true;
    async generateStructuredOutput() { throw new Error("Test provider unavailable"); }
  },
}));
describe("support guidance during a provider outage", () => {
  it.each(["Where is my late order?", "Can I get a refund?", "Is KingPay Later available?"])("does not invent completed financial actions: %s", async query => {
    const { askAiSupportAssistant } = await import("../lib/server/ai-support");
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const result = await (askAiSupportAssistant as any)({ context: { userId: "user-one" }, data: { query } });
      expect(result.reply).not.toMatch(/₹50|₹2,500|100%|instant.*refund|automatically disburses|0% interest/i);
      expect(state.queries.filter(q => /insert|update|delete/i.test(q.sql))).toEqual([]);
      expect(result.reply.length).toBeGreaterThan(30);
    } finally { errorLog.mockRestore(); }
  });
});
