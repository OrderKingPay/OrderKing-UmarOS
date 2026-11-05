import { describe, it, expect } from "vitest";
import { handleAdminHttp } from "@/lib/orderking/server/admin-http.server";
import { handleMasterAiHttp } from "@/lib/orderking/server/master-ai-http.server";
import { founderPrivacyShield, DEFAULT_PUBLIC_IDENTITY } from "./founder-privacy-shield";
import { getSql } from "@/lib/db";

describe("Umar OS Security Specialist (93b44198): Administrative Access Lockdown & Zero Founder Leak Protocol", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. Fail-Closed Administrative API Gate Verification
  // ───────────────────────────────────────────────────────────────────────────
  describe("Fail-Closed Server-Side Administrative Gate", () => {
    it("rejects unauthenticated GET /v1/admin/dashboard with HTTP 401", async () => {
      const request = new Request("https://admin.orderkingpay.com/v1/admin/dashboard", {
        method: "GET",
        headers: new Headers(),
      });

      const response = await handleAdminHttp(request, { _splat: "dashboard" });
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.code).toBe("UNAUTHORIZED");
      expect(json.error).toBe("Unauthorized");
    });

    it("rejects unauthenticated GET /v1/admin/settings with HTTP 401", async () => {
      const request = new Request("https://admin.orderkingpay.com/v1/admin/settings", {
        method: "GET",
        headers: new Headers(),
      });

      const response = await handleAdminHttp(request, { _splat: "settings" });
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.code).toBe("UNAUTHORIZED");
    });

    it("rejects unauthenticated GET /v1/admin/orders with HTTP 401", async () => {
      const request = new Request("https://admin.orderkingpay.com/v1/admin/orders", {
        method: "GET",
        headers: new Headers(),
      });

      const response = await handleAdminHttp(request, { _splat: "orders" });
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.code).toBe("UNAUTHORIZED");
    });

    it("rejects unauthenticated POST /v1/admin/commercial-dials/platform-fee with HTTP 401", async () => {
      const request = new Request("https://admin.orderkingpay.com/v1/admin/commercial-dials/platform-fee", {
        method: "POST",
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify({ feePaise: 1200, reason: "Unauthorized attempt" }),
      });

      const response = await handleAdminHttp(request, { _splat: "commercial-dials/platform-fee" });
      expect(response.status).toBe(401);
    });

    it("rejects unauthenticated POST /v1/admin/master-ai with HTTP 401", async () => {
      const request = new Request("https://admin.orderkingpay.com/v1/admin/master-ai", {
        method: "POST",
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify({ question: "Show financial metrics" }),
      });

      const response = await handleMasterAiHttp(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("authorizes valid service token on /v1/admin/dashboard", async () => {
      const serviceToken = process.env.ORDERKING_SERVICE_TOKEN?.trim() || "ok_svc_master_token_2026";
      const request = new Request("https://admin.orderkingpay.com/v1/admin/dashboard", {
        method: "GET",
        headers: new Headers({
          authorization: `Bearer ${serviceToken}`,
        }),
      });

      const response = await handleAdminHttp(request, { _splat: "dashboard" });
      // Should succeed with 200 or return legitimate dashboard payload
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.label).toBe("ACTUAL");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. FounderPrivacyShield Zero Founder Identity Leaks
  // ───────────────────────────────────────────────────────────────────────────
  describe("FounderPrivacyShield Zero Founder Identity Leaks", () => {
    it("redacts founder personal phone number and personal UPI VPA", () => {
      const rawText = "Direct settlement to 9395065587 or UPI 9395065587@ybl for nodal dispatch.";
      const masked = founderPrivacyShield.maskText(rawText);

      expect(masked).not.toContain("9395065587");
      expect(masked).toContain(DEFAULT_PUBLIC_IDENTITY.publicNodalPhone);
      expect(masked).toContain(DEFAULT_PUBLIC_IDENTITY.publicUpiVpa);
    });

    it("redacts founder personal email addresses", () => {
      const rawText = "Reach executive at hasan.habibullah@gmail.com or personal hasan@orderking.com";
      const masked = founderPrivacyShield.maskText(rawText);

      expect(masked).not.toContain("hasan.habibullah@gmail.com");
      expect(masked).not.toContain("hasan@orderking.com");
      expect(masked).toContain(DEFAULT_PUBLIC_IDENTITY.publicSupportEmail);
    });

    it("redacts founder residential address markers", () => {
      const rawText = "Operations registered at Ward No 1, Station Road, Karimganj Residence, Assam.";
      const masked = founderPrivacyShield.maskText(rawText);

      expect(masked).not.toContain("Ward No 1");
      expect(masked).not.toContain("Station Road");
      expect(masked).not.toContain("Karimganj Residence");
      expect(masked).toContain(DEFAULT_PUBLIC_IDENTITY.publicStatutoryAddress);
    });

    it("sanitizes error stack traces stripping local developer paths and founder identities", () => {
      const fakeError = new Error("Database timeout at internal service handler");
      fakeError.stack = `Error: Database timeout\n    at query (C:\\Users\\hasan\\OrderKing\\HDmaster\\src\\lib\\db.ts:145:11)\n    at handleAdminHttp (C:\\Users\\hasan\\OrderKing\\HDmaster\\src\\lib\\orderking\\server\\admin-http.server.ts:162:10)`;

      const sanitized = founderPrivacyShield.sanitizeErrorStackTrace(fakeError);

      expect(sanitized).not.toContain("C:\\Users\\hasan\\");
      expect(sanitized).not.toContain("hasan");
      expect(sanitized).toContain("[REDACTED_SECURE_PATH]");
    });

    it("sanitizes POSIX local developer paths in stack traces", () => {
      const posixStack = `Error: Failed to fetch\n    at Object.run (/Users/hasan/work/OrderKing/src/auth.ts:12:4)\n    at /home/hasan/runner.js:80:12`;
      const sanitized = founderPrivacyShield.sanitizeErrorStackTrace(posixStack);

      expect(sanitized).not.toContain("/Users/hasan/");
      expect(sanitized).not.toContain("/home/hasan/");
      expect(sanitized).toContain("[REDACTED_SECURE_PATH]");
    });

    it("recursively sanitizes public database query result objects and arrays", () => {
      const rawQueryResult = [
        {
          id: "usr_001",
          name: "Hasan Habibullah",
          phone: "9395065587",
          email: "hasan@orderking.in",
          address: "Ward No 1, Karimganj Residence",
          role: "SUPER_ADMIN",
          nested: {
            contact_number: "+91 9395065587",
            stack_trace: "Error at C:\\Users\\hasan\\OrderKing\\index.ts:10",
          },
        },
      ];

      const cleaned = founderPrivacyShield.sanitizePublicQueryResult(rawQueryResult);

      expect(cleaned[0].name).toBe("Chief Sovereign Executive (OrderKing)");
      expect(cleaned[0].phone).toBe(DEFAULT_PUBLIC_IDENTITY.publicNodalPhone);
      expect(cleaned[0].email).toBe(DEFAULT_PUBLIC_IDENTITY.publicSupportEmail);
      expect(cleaned[0].address).toBe(DEFAULT_PUBLIC_IDENTITY.publicStatutoryAddress);
      expect(cleaned[0].nested.contact_number).toBe(DEFAULT_PUBLIC_IDENTITY.publicNodalPhone);
      expect(cleaned[0].nested.stack_trace).not.toContain("C:\\Users\\hasan\\");
      expect(cleaned[0].nested.stack_trace).toContain("[REDACTED_SECURE_PATH]");
    });

    it("passes verifyZeroIdentityLeak for sanitized payloads", () => {
      const payload = {
        name: "OrderKing Sovereign Operations",
        email: "support@orderking.in",
        phone: "+91 1800-KING-PAY",
        vpa: "orderking@ybl",
        address: "Orderkingpay, Assam - 788710",
      };

      const audit = founderPrivacyShield.verifyZeroIdentityLeak(payload);
      expect(audit.leakDetected).toBe(false);
      expect(audit.leakedTokens.length).toBe(0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. PostgreSQL Database Audit Immutability & Administrative Overrides
  // ───────────────────────────────────────────────────────────────────────────
  describe("PostgreSQL Append-Only Audit Immutability & Overrides", () => {
    it("strictly blocks UPDATE on audit_logs at the database level", async () => {
      const sql = await getSql();
      const testAuditId = `aud_test_immut_${Date.now()}`;

      // Insert an audit log record
      await sql.query(
        `INSERT INTO audit_logs (id, org_id, action, target_type, target_id)
         VALUES ($1, 'org_orderking', 'test.immutable_verification', 'test', 'target_001')`,
        [testAuditId]
      );

      // Attempting to UPDATE the audit record MUST fail
      await expect(
        sql.query(`UPDATE audit_logs SET action = 'tampered' WHERE id = $1`, [testAuditId])
      ).rejects.toThrow(/audit_logs is append-only/);
    });

    it("strictly blocks DELETE on audit_logs at the database level", async () => {
      const sql = await getSql();
      const testAuditId = `aud_test_immut_del_${Date.now()}`;

      // Insert an audit log record
      await sql.query(
        `INSERT INTO audit_logs (id, org_id, action, target_type, target_id)
         VALUES ($1, 'org_orderking', 'test.immutable_verification', 'test', 'target_002')`,
        [testAuditId]
      );

      // Attempting to DELETE the audit record MUST fail
      await expect(
        sql.query(`DELETE FROM audit_logs WHERE id = $1`, [testAuditId])
      ).rejects.toThrow(/audit_logs is append-only/);
    });

    it("captures administrative restaurant commission adjustments into immutable audit logs", async () => {
      const sql = await getSql();
      const rows = await sql.query<{ id: string; commission_bps: number }>(
        `SELECT id, commission_bps FROM restaurants WHERE org_id = 'org_orderking' LIMIT 1`
      );

      if (rows.length > 0) {
        const restaurant = rows[0];
        const newBps = restaurant.commission_bps === 2000 ? 2500 : 2000;

        await sql.query(`UPDATE restaurants SET commission_bps = $1 WHERE id = $2`, [newBps, restaurant.id]);

        const auditRows = await sql.query<{ id: string; action: string; target_id: string }>(
          `SELECT id, action, target_id FROM audit_logs
           WHERE target_id = $1 AND action = 'restaurant.commission_override'
           ORDER BY created_at DESC LIMIT 1`,
          [restaurant.id]
        );

        expect(auditRows.length).toBeGreaterThan(0);
        expect(auditRows[0].action).toBe("restaurant.commission_override");
        expect(auditRows[0].target_id).toBe(restaurant.id);

        // Reset to original
        await sql.query(`UPDATE restaurants SET commission_bps = $1 WHERE id = $2`, [restaurant.commission_bps, restaurant.id]);
      }
    });
  });
});
