import { describe, expect, it } from "vitest";
import { CUSTOMER_PRIMARY_TABS, resolvePlatformContext } from "@/components/navigation/floating-bottom-nav";

describe("Stable OrderKing customer navigation", () => {
  it("keeps five direct, non-shifting destinations", () => {
    expect(CUSTOMER_PRIMARY_TABS.map((tab) => tab.to)).toEqual(["/", "/tutor", "/king-pay", "/travel", "/orders"]);
    expect(CUSTOMER_PRIMARY_TABS.map((tab) => tab.label)).toEqual(["Food", "Learn", "KingPay", "Travel", "Orders"]);
    expect(new Set(CUSTOMER_PRIMARY_TABS.map((tab) => tab.to)).size).toBe(5);
  });
  it("preserves correct page context for Food, Tutor, KingPay and Travel", () => {
    expect(resolvePlatformContext("/")).toBe("delivery");
    expect(resolvePlatformContext("/tutor")).toBe("tutor");
    expect(resolvePlatformContext("/king-pay")).toBe("kingpay");
    expect(resolvePlatformContext("/travel")).toBe("travel");
  });
});
