import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { SignJWT } from "jose";

// Security & RBAC / ABAC imports
import {
  hasPermission,
  canAccessResource,
  requirePermission,
  assertSameOrg,
  cityScopeSql,
  requireHighRisk,
  ForbiddenError,
  type AccessContext,
} from "../rbac.ts";
import { IAMPolicyEnforcer } from "./zero-trust/iam-policy-enforcer.ts";
import { TenantIsolation } from "./zero-trust/tenant-isolation.ts";
import { validateAgentTask } from "./agent-boundary.server.ts";
import {
  verifyBearerJwt,
  requireJwtSubject,
  requireJwtRole,
} from "./rbac-vault.ts";
import { CrossSiteRequestError } from "../../auth/isolation.server.ts";
import { sessionBoundToGateIdentity } from "../../auth/gate-identity.server.ts";
import { SecretsScanner } from "./zero-trust/secrets-scanner.ts";
import { founderPrivacyShield } from "./founder-privacy-shield.ts";
import { encrypt, decrypt } from "./crypto-vault.ts";

describe("UmarOS Security Hardening & DevSecOps Suite", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. Cloudflare Edge, Wrangler Config & HTTP Security Headers
  // ───────────────────────────────────────────────────────────────────────────
  describe("Cloudflare Edge, Routing & Security Headers", () => {
    const apps = [
      { name: "HDmaster", dir: path.resolve(__dirname, "../../../..") },
      { name: "orderking-customers", dir: path.resolve(__dirname, "../../../../../orderking-customers") },
      { name: "orderking-partners", dir: path.resolve(__dirname, "../../../../../orderking-partners") },
      { name: "orderking-riders", dir: path.resolve(__dirname, "../../../../../orderking-riders") },
    ];

    it("verifies wrangler.toml compatibility date and nodejs_compat flags across all apps", () => {
      for (const app of apps) {
        const wranglerPath = path.join(app.dir, "wrangler.toml");
        expect(fs.existsSync(wranglerPath), `Missing wrangler.toml in ${app.name}`).toBe(true);
        const content = fs.readFileSync(wranglerPath, "utf8");
        expect(content).toContain('compatibility_date = "2026-10-06"');
        expect(content).toContain('compatibility_flags = ["nodejs_compat"]');
        expect(content).toContain('pages_build_output_dir = "dist"');
      }
    });

    it("verifies Cloudflare Pages _headers file contains complete modern security headers", () => {
      const requiredHeaders = [
        "X-Content-Type-Options: nosniff",
        "X-Frame-Options: DENY",
        "Referrer-Policy: strict-origin-when-cross-origin",
        "Permissions-Policy:",
        "Strict-Transport-Security: max-age=63072000; includeSubDomains; preload",
        "X-XSS-Protection: 1; mode=block",
        "Cross-Origin-Opener-Policy: same-origin-allow-popups",
        "Cross-Origin-Resource-Policy: same-origin",
        "Content-Security-Policy: default-src 'self'",
      ];

      for (const app of apps) {
        const headersPath = path.join(app.dir, "public", "_headers");
        expect(fs.existsSync(headersPath), `Missing public/_headers in ${app.name}`).toBe(true);
        const content = fs.readFileSync(headersPath, "utf8");
        for (const hdr of requiredHeaders) {
          expect(content, `${app.name} _headers missing header: ${hdr}`).toContain(hdr);
        }
      }
    });

    it("verifies Cloudflare Pages _routes.json config routes dynamic paths and preserves static cache bypass", () => {
      for (const app of apps) {
        const routesPath = path.join(app.dir, "public", "_routes.json");
        expect(fs.existsSync(routesPath), `Missing _routes.json in ${app.name}`).toBe(true);
        const routes = JSON.parse(fs.readFileSync(routesPath, "utf8"));
        expect(routes.version).toBe(1);
        expect(routes.include).toContain("/*");
        expect(routes.exclude).toContain("/assets/*");
        expect(routes.exclude).toContain("/manifest.json");
        expect(routes.exclude).toContain("/favicon.ico");
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. RBAC & ABAC Permission Gates
  // ───────────────────────────────────────────────────────────────────────────
  describe("RBAC & ABAC Permission Gates", () => {
    const baseCtx: AccessContext = {
      userId: "usr-001",
      employeeId: "emp-001",
      orgId: "org-bangalore",
      roleKey: "STORE_MANAGER",
      actingRoleKey: "STORE_MANAGER",
      permissions: ["view_orders", "manage_orders", "view_inventory"],
      cityId: "city-blr",
      areaId: "area-koramangala",
      status: "ACTIVE",
    };

    it("evaluates permission checks correctly based on user context and status", () => {
      expect(hasPermission(baseCtx, "view_orders")).toBe(true);
      expect(hasPermission(baseCtx, "cancel_orders")).toBe(false);

      // Inactive status instantly denies all permissions
      const inactiveCtx: AccessContext = { ...baseCtx, status: "SUSPENDED" };
      expect(hasPermission(inactiveCtx, "view_orders")).toBe(false);
    });

    it("grants full access when acting role is SUPER_ADMIN", () => {
      const superAdminCtx: AccessContext = {
        ...baseCtx,
        actingRoleKey: "SUPER_ADMIN",
        permissions: [],
      };
      expect(hasPermission(superAdminCtx, "cancel_orders")).toBe(true);
      expect(hasPermission(superAdminCtx, "modify_financial_settings")).toBe(true);
    });

    it("enforces multi-attribute ABAC scoping across org, city, and area", () => {
      // Same org, same city, same area -> allowed
      expect(
        canAccessResource(baseCtx, "view_orders", {
          orgId: "org-bangalore",
          cityId: "city-blr",
          areaId: "area-koramangala",
        })
      ).toBe(true);

      // Cross-organization access attempt -> blocked
      expect(
        canAccessResource(baseCtx, "view_orders", {
          orgId: "org-mumbai",
          cityId: "city-blr",
        })
      ).toBe(false);

      // Cross-city access attempt -> blocked
      expect(
        canAccessResource(baseCtx, "view_orders", {
          orgId: "org-bangalore",
          cityId: "city-delhi",
        })
      ).toBe(false);

      // Cross-area access attempt -> blocked
      expect(
        canAccessResource(baseCtx, "view_orders", {
          orgId: "org-bangalore",
          cityId: "city-blr",
          areaId: "area-indiranagar",
        })
      ).toBe(false);
    });

    it("throws ForbiddenError when requirePermission fails", () => {
      expect(() =>
        requirePermission(baseCtx, "modify_financial_settings")
      ).toThrow(ForbiddenError);

      expect(() =>
        requirePermission(baseCtx, "view_orders", { orgId: "org-other" })
      ).toThrow(ForbiddenError);

      expect(() =>
        assertSameOrg(baseCtx, "org-other")
      ).toThrow("Cross-organization access is not allowed");
    });

    it("constructs safe parameterized SQL city scoping and prevents SQL injection", () => {
      const scoped = cityScopeSql(baseCtx, "ord");
      expect(scoped.clause).toBe(' and "ord".city_id = $city');
      expect(scoped.params).toEqual(["city-blr"]);

      // Malicious table alias must be rejected
      expect(() => cityScopeSql(baseCtx, "ord; DROP TABLE users;--")).toThrow(
        "Invalid SQL table alias identifier"
      );
    });

    it("enforces mandatory audit reasoning for high-risk permissions", () => {
      const adminCtx: AccessContext = {
        ...baseCtx,
        permissions: ["manage_roles", "refund_override"],
      };

      // Fails when reason is missing or too short
      expect(() =>
        requireHighRisk(adminCtx, "manage_roles", "")
      ).toThrow("High-risk actions require a reason");

      expect(() =>
        requireHighRisk(adminCtx, "manage_roles", "ok")
      ).toThrow("High-risk actions require a reason");

      // Succeeds with valid rationale
      expect(() =>
        requireHighRisk(adminCtx, "manage_roles", "Promoting onboarding support agent to tier 2")
      ).not.toThrow();
    });

    it("verifies IAMPolicyEnforcer role gates", () => {
      const enforcer = new IAMPolicyEnforcer();

      // Superadmin bypass
      expect(
        enforcer.enforce({ tenantId: "t-1", userId: "u-1", roles: ["superadmin"] }, "delete", "orders")
      ).toBe(true);

      // Admin required for admin action
      expect(() =>
        enforcer.enforce({ tenantId: "t-1", userId: "u-2", roles: ["viewer"] }, "admin", "settings")
      ).toThrow("IAM Policy Violation");

      // Denies empty roles
      expect(() =>
        enforcer.enforce({ tenantId: "t-1", userId: "u-3", roles: [] }, "read", "orders")
      ).toThrow("no roles assigned");
    });

    it("enforces strict TenantIsolation in queries and records", () => {
      // Query injection
      const baseQuery = { select: "*", where: { status: "DELIVERED" } };
      const isolatedQuery = TenantIsolation.injectTenantFilter(baseQuery, "tenant-alpha");
      expect(isolatedQuery.where.tenantId).toBe("tenant-alpha");
      expect(isolatedQuery.where.status).toBe("DELIVERED");

      expect(() => TenantIsolation.injectTenantFilter(baseQuery, "")).toThrow(
        "Tenant ID missing"
      );

      // Ownership verification
      expect(() =>
        TenantIsolation.verifyRecordOwnership({ tenantId: "tenant-alpha" }, "tenant-alpha")
      ).not.toThrow();

      expect(() =>
        TenantIsolation.verifyRecordOwnership({ tenantId: "tenant-beta" }, "tenant-alpha")
      ).toThrow("Cross-tenant access attempted");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Token Isolation & Agent Boundary Security
  // ───────────────────────────────────────────────────────────────────────────
  describe("Token Isolation & Agent Boundary Guards", () => {
    const TEST_SECRET = "super_secret_jwt_key_that_is_at_least_32_bytes_long_123456";

    beforeEach(() => {
      process.env.ORDERKING_JWT_SECRET = TEST_SECRET;
      process.env.ORDERKING_JWT_ISSUER = "https://auth.orderking.in";
      process.env.ORDERKING_JWT_AUDIENCE = "orderking-services";
    });

    it("verifies bearer JWT token and extracts claims", async () => {
      const secret = new TextEncoder().encode(TEST_SECRET);
      const token = await new SignJWT({ role: "ADMIN", tenantId: "org-1" })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("user-founder-101")
        .setIssuer("https://auth.orderking.in")
        .setAudience("orderking-services")
        .setExpirationTime("1h")
        .sign(secret);

      const verified = await verifyBearerJwt(`Bearer ${token}`);
      expect(verified.payload.sub).toBe("user-founder-101");
      expect(requireJwtSubject(verified.payload)).toBe("user-founder-101");
      expect(requireJwtRole(verified.payload, ["ADMIN", "SUPER_ADMIN"])).toBe("ADMIN");

      // Invalid role rejected
      expect(() => requireJwtRole(verified.payload, ["OPERATOR"])).toThrow("Forbidden");

      // Missing Bearer prefix rejected
      await expect(verifyBearerJwt(token)).rejects.toThrow("Unauthorized");
    });

    it("verifies CrossSiteRequestError status is 403", () => {
      const err = new CrossSiteRequestError();
      expect(err.status).toBe(403);
      expect(err.name).toBe("CrossSiteRequestError");
    });

    it("verifies session bound to gate identity", () => {
      const accounts = [
        { providerId: "google", accountId: "goog-123" },
        { providerId: "grok-gate", accountId: "grok-usr-999" },
      ];
      expect(sessionBoundToGateIdentity(accounts, "grok-usr-999", "grok-gate")).toBe(true);
      expect(sessionBoundToGateIdentity(accounts, "grok-usr-000", "grok-gate")).toBe(false);
    });

    it("blocks destructive SQL actions and enforces founder MFA on financial tasks", () => {
      // Destructive SQL is blocked for all users
      expect(() =>
        validateAgentTask({ query: "DROP TABLE orders; --" }, "FOUNDER")
      ).toThrow("destructive SQL");

      expect(() =>
        validateAgentTask({ sql: "TRUNCATE TABLE ledger;" }, "FOUNDER")
      ).toThrow("destructive SQL");

      // Financial task requires FOUNDER role
      expect(() =>
        validateAgentTask({ action: "TRANSFER_FUNDS", amount: 50000 }, "ADMIN")
      ).toThrow("Financial tasks require FOUNDER role");

      // Financial task requires Founder MFA override token
      expect(() =>
        validateAgentTask({ action: "TRANSFER_FUNDS", amount: 50000 }, "FOUNDER")
      ).toThrow("require Founder MFA override");

      // Valid financial task with MFA succeeds
      expect(
        validateAgentTask(
          { action: "TRANSFER_FUNDS", metadata: { isFinancial: true, founderMfaToken: "mfa-valid-999" } },
          "FOUNDER"
        )
      ).toBe(true);

      // Unauthenticated or guest blocked
      expect(() => validateAgentTask({ action: "VIEW_STATS" }, "GUEST")).toThrow(
        "not permitted to execute agent tasks"
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Secret Leak Prevention & Privacy Shield
  // ───────────────────────────────────────────────────────────────────────────
  describe("Secret Leak Prevention & Privacy Shield", () => {
    it("detects and blocks sensitive keys in outgoing API response payloads", () => {
      // Razorpay secret blocked
      expect(() =>
        SecretsScanner.scanResponse({ orderId: "123", key: "rzp_live_secret_samplekey123" })
      ).toThrow("Sensitive secret detected");

      // OpenAI key blocked
      expect(() =>
        SecretsScanner.scanResponse({ text: "Generated", token: "sk-proj-abc1234567890abcdef" })
      ).toThrow("Sensitive secret detected");

      // Clean response passes
      expect(() =>
        SecretsScanner.scanResponse({ status: "OK", orderId: "ord_1001" })
      ).not.toThrow();
    });

    it("sanitizes sensitive fields by redaction", () => {
      const raw = {
        name: "OrderKing Config",
        apiKey: "untrusted_value_123",
        secret: "super_secret_456",
        password: "my_password",
        nested: {
          token: "session_token_789",
          publicInfo: "safe_value",
        },
      };

      const sanitized = SecretsScanner.sanitize(raw);
      expect(sanitized.apiKey).toBe("[REDACTED]");
      expect(sanitized.secret).toBe("[REDACTED]");
      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.nested.token).toBe("[REDACTED]");
      expect(sanitized.nested.publicInfo).toBe("safe_value");
    });

    it("enforces zero founder personal identity leaks with FounderPrivacyShield", () => {
      const leakedInput = "Payment authorized by Hasan Habibullah for sovereign delivery node.";
      const masked = founderPrivacyShield.maskText(leakedInput);
      expect(masked).not.toContain("Hasan Habibullah");
      expect(masked).toContain("Chief Sovereign Executive (OrderKing)");

      const audit = founderPrivacyShield.verifyZeroIdentityLeak({
        payer: "Hasan",
        account: "Habibullah",
      });
      expect(audit.leakDetected).toBe(true);
      expect(audit.leakedTokens.length).toBeGreaterThan(0);
      expect(audit.safePayload).not.toContain("Hasan");
      expect(audit.safePayload).not.toContain("Habibullah");

      // Public invoice shielding
      const publicInvoice = founderPrivacyShield.sanitizePublicInvoice({
        orderId: "ord-999",
        amount: 2500,
      });
      expect(publicInvoice.issuerLegalName).toBe(
        "King Pay Network Technologies (Section 79 IT Act Compliant Intermediary)"
      );
      expect(publicInvoice.founderIdentityProtected).toBe(true);
      expect(publicInvoice.sovereignAuditSignature).toContain("SHIELD-");
    });

    it("verifies CryptoVault AES-256-GCM encryption and decryption roundtrip", () => {
      const key = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // 32 bytes hex
      const secretMessage = "ORDERKING_HIGH_VALUE_SETTLEMENT_PAYOUT_₹5,00,000";

      const encrypted = encrypt(secretMessage, key);
      expect(encrypted).toContain(":");
      const parts = encrypted.split(":");
      expect(parts.length).toBe(3); // iv:ciphertext:tag

      const decrypted = decrypt(encrypted, key);
      expect(decrypted).toBe(secretMessage);

      // Tampered ciphertext must fail auth tag verification
      const tampered = `${parts[0]}:deadbeef${parts[1].slice(8)}:${parts[2]}`;
      expect(() => decrypt(tampered, key)).toThrow();
    });
  });
});
