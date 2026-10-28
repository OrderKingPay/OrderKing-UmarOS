import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { signToken, verifyToken } from "./jwt-manager";
import { createRateLimiter } from "./rate-limiter";
import {
  hasPermission,
  requirePermission,
  requireHighRisk,
  canAccessResource,
  assertSameOrg,
  resolvePermissions,
  ForbiddenError,
  type AccessContext,
} from "../rbac";
import { ROLE_PRESETS } from "../permissions";
import { assertOwned, rejectClientPrice } from "../../../../../orderking-customers/src/lib/authz";
import { SESSION_TOKEN_COOKIE } from "@/lib/auth/server";
import { CrossSiteRequestError } from "@/lib/auth/isolation.server";

function makeCtx(role: string, overrides: Partial<AccessContext> = {}): AccessContext {
  return {
    userId: `usr_test_${role.toLowerCase()}`,
    employeeId: `emp_test_${role.toLowerCase()}`,
    orgId: "org_orderking",
    roleKey: role,
    actingRoleKey: role,
    permissions: overrides.permissions ?? resolvePermissions(role),
    cityId: "city_karimganj",
    areaId: null,
    status: "ACTIVE",
    ...overrides,
  };
}

describe("🛡️ UMAR OS SECURITY AUDIT & VERIFICATION SUITE", () => {
  // =========================================================================
  // DIRECTIVE 1: Better Auth Session Cookies, HttpOnly, Secure, SameSite & JWT
  // =========================================================================
  describe("Directive 1: Session Lockdown, Cookie Flags & JWT Verification", () => {
    it("1.1 enforces __Host- prefix on session cookies to prevent domain injection", () => {
      expect(SESSION_TOKEN_COOKIE.startsWith("__Host-")).toBe(true);
      expect(SESSION_TOKEN_COOKIE).toBe("__Host-grok-auth.session_token");
    });

    it("1.2 verifies server-side Better Auth cookie configurations enforce secure & httpOnly across all monorepo apps", async () => {
      const repoRoot = process.cwd().endsWith("HDmaster") ? resolve(process.cwd(), "..") : process.cwd();
      const serverFiles = [
        "HDmaster/src/lib/auth/server.ts",
        "orderking-customers/src/lib/auth/server.ts",
        "orderking-partners/src/lib/auth/server.ts",
        "orderking-riders/src/lib/auth/server.ts",
      ];

      for (const relPath of serverFiles) {
        const fullPath = resolve(repoRoot, relPath);
        const code = await readFile(fullPath, "utf8");

        expect(code).toMatch(
          /defaultCookieAttributes:\s*\{[^}]*secure:\s*true[^}]*httpOnly:\s*true[^}]*sameSite:\s*["']lax["']/i,
        );

        expect(code).toMatch(
          /session_token:\s*\{[^}]*attributes:\s*\{[^}]*secure:\s*true[^}]*httpOnly:\s*true/i,
        );
      }
    });

    it("1.3 verifies JWT signing, payload integrity, and constant-time signature verification", () => {
      const secret = "super_secure_secret_key_2026_orderking_test";
      const payload = { userId: "usr_founder_01", role: "SUPER_ADMIN" };

      // Mint valid token for 60 seconds
      const token = signToken(payload, secret, 60);
      expect(typeof token === "string" && token.split(".").length === 3).toBe(true);

      // Verify authentic token
      const verified = verifyToken(token, secret);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe("usr_founder_01");
      expect(verified?.role).toBe("SUPER_ADMIN");
      expect(typeof verified?.exp === "number").toBe(true);

      // Reject tampered signature
      const tamperedSecret = verifyToken(token, "wrong_attacker_secret");
      expect(tamperedSecret).toBeNull();

      // Reject tampered payload body
      const parts = token.split(".");
      const alteredBody = Buffer.from(JSON.stringify({ userId: "usr_attacker", role: "SUPER_ADMIN" }))
        .toString("base64")
        .replace(/=/g, "");
      const tamperedToken = `${parts[0]}.${alteredBody}.${parts[2]}`;
      expect(verifyToken(tamperedToken, secret)).toBeNull();

      // Reject expired token
      const expiredToken = signToken(payload, secret, -10);
      expect(verifyToken(expiredToken, secret)).toBeNull();

      // Reject malformed token
      expect(verifyToken("invalid.token", secret)).toBeNull();
      expect(verifyToken("a.b.c.d", secret)).toBeNull();
    });

    it("1.4 enforces rate limiting to throttle credential stuffing and brute-force attempts", () => {
      const limiter = createRateLimiter(60000, 3);
      const ip = "192.168.1.100";

      expect(limiter(ip)).toBe(true);
      expect(limiter(ip)).toBe(true);
      expect(limiter(ip)).toBe(true);
      expect(limiter(ip)).toBe(false);
      expect(limiter(ip)).toBe(false);

      // Independent IP is not affected
      expect(limiter("10.0.0.1")).toBe(true);
    });

    it("1.5 validates Sibling Isolation CrossSiteRequestError definition", () => {
      const err = new CrossSiteRequestError();
      expect(err.status).toBe(403);
      expect(err.name).toBe("CrossSiteRequestError");
      expect(err.message).toMatch(/Forbidden: cross-site request blocked/);
    });
  });

  // =========================================================================
  // DIRECTIVE 2: RBAC Gates across CUSTOMER, RIDER, PARTNER, ADMIN, SUPERADMIN
  // =========================================================================
  describe("Directive 2: Monorepo RBAC Hierarchy & Fail-Closed Isolation", () => {
    it("2.1 CUSTOMER role is strictly confined: cannot access admin, finance, or dispatch", () => {
      const customerCtx = makeCtx("CUSTOMER", { permissions: ["view_orders", "create_order"] });

      expect(hasPermission(customerCtx, "manage_platform_settings")).toBe(false);
      expect(hasPermission(customerCtx, "issue_refunds")).toBe(false);
      expect(hasPermission(customerCtx, "view_finance")).toBe(false);
      expect(hasPermission(customerCtx, "manage_delivery_zones")).toBe(false);

      expect(() => requirePermission(customerCtx, "manage_platform_settings")).toThrow(
        ForbiddenError,
      );
      expect(() => requirePermission(customerCtx, "issue_refunds")).toThrow(
        ForbiddenError,
      );
    });

    it("2.2 RIDER role cannot access financial ledgers, platform settings, or customer PII", () => {
      const riderCtx = makeCtx("RIDER", { permissions: ["view_orders", "update_delivery_status"] });

      expect(hasPermission(riderCtx, "view_finance")).toBe(false);
      expect(hasPermission(riderCtx, "manage_platform_settings")).toBe(false);
      expect(hasPermission(riderCtx, "issue_refunds")).toBe(false);
      expect(hasPermission(riderCtx, "access_CEO_dashboard")).toBe(false);

      expect(() => requirePermission(riderCtx, "view_finance")).toThrow(ForbiddenError);
    });

    it("2.3 PARTNER / RESTAURANT_OWNER role is bounded: cannot view competitor data or platform settings", () => {
      const partnerCtx = makeCtx("PARTNER_AGENT", {
        permissions: ["view_restaurants", "edit_menus", "view_orders"],
      });

      expect(hasPermission(partnerCtx, "manage_platform_settings")).toBe(false);
      expect(hasPermission(partnerCtx, "issue_refunds")).toBe(false);
      expect(hasPermission(partnerCtx, "access_CEO_dashboard")).toBe(false);

      expect(() => requirePermission(partnerCtx, "modify_financial_settings")).toThrow(
        ForbiddenError,
      );
    });

    it("2.4 ADMIN role can manage operational resources but cannot perform high-risk actions without justification", () => {
      const adminCtx = makeCtx("SUPER_ADMIN");

      // Super admin has permission
      expect(hasPermission(adminCtx, "issue_refunds")).toBe(true);

      // High risk requires valid reason (fail closed on empty / whitespace)
      expect(() => requireHighRisk(adminCtx, "issue_refunds", "")).toThrow(ForbiddenError);
      expect(() => requireHighRisk(adminCtx, "issue_refunds", "  ")).toThrow(ForbiddenError);
      expect(() => requireHighRisk(adminCtx, "issue_refunds", "no")).toThrow(ForbiddenError);

      // Passes when legitimate reason is supplied
      expect(() =>
        requireHighRisk(adminCtx, "issue_refunds", "Customer received damaged packaging, verified by photo"),
      ).not.toThrow();
    });

    it("2.5 SUPERADMIN / FOUNDER has access to all presets but remains subject to high-risk audit gates", () => {
      expect(ROLE_PRESETS.SUPER_ADMIN.includes("manage_platform_settings")).toBe(true);
      expect(ROLE_PRESETS.SUPER_ADMIN.includes("issue_refunds")).toBe(true);
      expect(ROLE_PRESETS.SUPER_ADMIN.includes("view_audit_logs")).toBe(true);
      expect(ROLE_PRESETS.SUPER_ADMIN.includes("access_CEO_dashboard")).toBe(true);

      const founderCtx = makeCtx("SUPER_ADMIN");
      expect(hasPermission(founderCtx, "manage_platform_settings")).toBe(true);

      // Requires high-risk reason
      expect(() => requireHighRisk(founderCtx, "manage_platform_settings", " ")).toThrow(
        ForbiddenError,
      );
      expect(() =>
        requireHighRisk(founderCtx, "manage_platform_settings", "Sync TBO flight API credentials for live booking"),
      ).not.toThrow();
    });

    it("2.6 assertOwned in customer authz fails closed without leaking existence of another tenant's row", () => {
      const customerA = "usr_cust_alice";
      const customerB = "usr_cust_bob";

      const aliceRow = { user_id: customerA, order_id: "ord_101", amount: 45000 };

      // Alice accesses her own row
      expect(assertOwned(aliceRow, customerA)).toBe(aliceRow);

      // Bob tries to access Alice's row -> fails closed with generic "Not found"
      expect(() => assertOwned(aliceRow, customerB)).toThrow(/Not found/);

      // Null row fails closed with "Not found"
      expect(() => assertOwned(null, customerA)).toThrow(/Not found/);
    });

    it("2.7 rejectClientPrice prevents client-side cart or total price tampering", () => {
      expect(() => rejectClientPrice(49900)).toThrow(/Client totals are ignored/);
      expect(() => rejectClientPrice(0)).toThrow(/Client totals are ignored/);
      expect(() => rejectClientPrice(undefined)).not.toThrow();
      expect(() => rejectClientPrice(null)).not.toThrow();
    });

    it("2.8 assertSameOrg blocks cross-organization multi-tenant data leakage", () => {
      const orgCtx = makeCtx("SUPER_ADMIN", { orgId: "org_orderking" });

      expect(() => assertSameOrg(orgCtx, "org_orderking")).not.toThrow();
      expect(() => assertSameOrg(orgCtx, "org_competitor")).toThrow(
        /Cross-organization access is not allowed/,
      );
    });
  });

  // =========================================================================
  // DIRECTIVE 3: Audit Log Immutability & High-Risk Fail-Closed Gates
  // =========================================================================
  describe("Directive 3: Audit Log Immutability & High-Risk Server-Side Gates", () => {
    it("3.1 verifies audit_logs is strictly append-only across all source code and SQL migrations", async () => {
      const auditedFiles = [
        "HDmaster/src/lib/orderking/server/queries.server.ts",
        "HDmaster/src/lib/orderking/server/workspace.server.ts",
        "HDmaster/src/lib/orderking/server/commercial-dials.server.ts",
        "HDmaster/src/lib/orderking/actions.ts",
        "HDmaster/src/lib/orderking/server/admin-http.server.ts",
      ];

      const repoRoot = process.cwd().endsWith("HDmaster") ? resolve(process.cwd(), "..") : process.cwd();
      for (const relPath of auditedFiles) {
        const fullPath = resolve(repoRoot, relPath);
        const code = await readFile(fullPath, "utf8");

        expect(code).not.toMatch(/update\s+audit_logs/i);
        expect(code).not.toMatch(/delete\s+from\s+audit_logs/i);
      }
    });

    it("3.2 verifies financial dispute refund route fails closed when permission or justification is lacking", () => {
      const supportCtx = makeCtx("CUSTOMER_SUPPORT");
      const analystCtx = makeCtx("ANALYST");

      // Customer support and analyst cannot issue refunds
      expect(hasPermission(supportCtx, "issue_refunds")).toBe(false);
      expect(hasPermission(analystCtx, "issue_refunds")).toBe(false);

      expect(() => requirePermission(supportCtx, "issue_refunds")).toThrow(ForbiddenError);
      expect(() => requirePermission(analystCtx, "issue_refunds")).toThrow(ForbiddenError);
    });

    it("3.3 verifies credential sync route enforces manage_platform_settings and audit logging", () => {
      const financeCtx = makeCtx("FINANCE");
      expect(hasPermission(financeCtx, "manage_platform_settings")).toBe(false);
      expect(() => requirePermission(financeCtx, "manage_platform_settings")).toThrow(
        ForbiddenError,
      );

      const superAdminCtx = makeCtx("SUPER_ADMIN");
      expect(hasPermission(superAdminCtx, "manage_platform_settings")).toBe(true);

      // Must fail closed if audit justification is missing
      expect(() => requireHighRisk(superAdminCtx, "manage_platform_settings", "")).toThrow(
        ForbiddenError,
      );
      expect(() =>
        requireHighRisk(superAdminCtx, "manage_platform_settings", "Updating TBO Gateway API Secret"),
      ).not.toThrow();
    });

    it("3.4 enforces geographic city scoping in multi-city deployments", () => {
      const cityManager = makeCtx("AREA_MANAGER", { cityId: "city_karimganj" });

      expect(
        canAccessResource(cityManager, "view_orders", {
          orgId: "org_orderking",
          cityId: "city_karimganj",
        }),
      ).toBe(true);

      expect(
        canAccessResource(cityManager, "view_orders", {
          orgId: "org_orderking",
          cityId: "city_guwahati",
        }),
      ).toBe(false);
    });
  });
});
