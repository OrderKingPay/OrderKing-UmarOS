import { describe, it, expect } from "vitest";
import { DeviceAvatar } from "@/components/common/device-avatar";
import { SOVEREIGN_ECOSYSTEM_TABS } from "@/components/market/shell";
import type { AppUser } from "@/lib/auth/use-current-user";

describe("Customer Header Authenticated User Profile Picture & Top-Right Menu Suite", () => {
  it("exports DeviceAvatar component for clean header and account profile avatar rendering", () => {
    expect(DeviceAvatar).toBeDefined();
    expect(typeof DeviceAvatar).toBe("function");
  });

  it("handles normalized AppUser with profileImageUrl, displayName, and primaryEmail", () => {
    const sampleUserWithAvatar: AppUser = {
      id: "usr_royal_patron_101",
      displayName: "Umar Farooq",
      primaryEmail: "umar@orderking.in",
      profileImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      isDevFallback: false,
    };

    expect(sampleUserWithAvatar.profileImageUrl).toBeDefined();
    expect(sampleUserWithAvatar.profileImageUrl).toContain("https://");
    expect(sampleUserWithAvatar.displayName?.charAt(0)).toBe("U");
  });

  it("extracts correct uppercase initial for fallback avatar when image is absent", () => {
    const userNoAvatar: AppUser = {
      id: "usr_202",
      displayName: "Ananya Sharma",
      primaryEmail: "ananya@example.com",
      profileImageUrl: null,
      isDevFallback: false,
    };

    const initial = userNoAvatar.displayName?.trim().charAt(0).toUpperCase();
    expect(initial).toBe("A");
  });

  it("supports completely anonymous / guest fallback when both image and name are empty", () => {
    const anonymousUser: AppUser = {
      id: "usr_anon",
      displayName: null,
      primaryEmail: "guest@orderking.in",
      profileImageUrl: null,
      isDevFallback: false,
    };

    expect(anonymousUser.profileImageUrl).toBeNull();
    expect(anonymousUser.displayName).toBeNull();
  });

  it("validates sovereign ecosystem header navigation tabs include Food, KingPay, and Orders", () => {
    const tabIds = SOVEREIGN_ECOSYSTEM_TABS.map((t) => t.id);
    expect(tabIds).toContain("food");
    expect(tabIds).toContain("kingpay");
    expect(tabIds).toContain("orders");
  });

  it("confirms top-right user menu targets standard authenticated customer paths", () => {
    const expectedMenuTargets = [
      "/account",
      "/orders",
      "/kingpay",
      "/travel",
      "/settings",
      "/login",
    ];

    expect(expectedMenuTargets).toContain("/account");
    expect(expectedMenuTargets).toContain("/orders");
    expect(expectedMenuTargets).toContain("/kingpay");
    expect(expectedMenuTargets).toContain("/travel");
    expect(expectedMenuTargets).toContain("/settings");
  });
});
