import { describe, it, expect } from "vitest";
import {
  timingSafeStringCompare,
  timingSafeHexCompare,
} from "../lib/security/crypto-safe";
import { MemorySafeRateLimiter } from "../lib/security/rate-limiter";
import { escapeHtml, sanitizePlainText } from "../lib/security/xss";

describe("Zero-Trust Security & Anti-Hacking Guard", () => {
  describe("Cryptographic Timing-Safe Comparison", () => {
    it("safely compares identical strings", () => {
      expect(timingSafeStringCompare("secret_token_123", "secret_token_123")).toBe(true);
    });

    it("safely rejects different strings without throwing", () => {
      expect(timingSafeStringCompare("secret_token_123", "secret_token_456")).toBe(false);
      expect(timingSafeStringCompare("short", "much_longer_string_value")).toBe(false);
      expect(timingSafeStringCompare("", "token")).toBe(false);
    });

    it("safely compares hex signatures", () => {
      const hex1 = "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0";
      const hex2 = "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0";
      const hex3 = "b1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0";

      expect(timingSafeHexCompare(hex1, hex2)).toBe(true);
      expect(timingSafeHexCompare(hex1, hex3)).toBe(false);
      expect(timingSafeHexCompare("not_hex", "invalid")).toBe(false);
    });
  });

  describe("Bounded Sliding Window Rate Limiter", () => {
    it("allows requests within burst limit and blocks excess", () => {
      const limiter = new MemorySafeRateLimiter({ windowMs: 1000, maxRequests: 3, maxEntries: 10 });
      const ip = "192.168.1.100";

      expect(limiter.isAllowed(ip).allowed).toBe(true);
      expect(limiter.isAllowed(ip).allowed).toBe(true);
      expect(limiter.isAllowed(ip).allowed).toBe(true);
      // 4th request exceeds maxRequests = 3
      expect(limiter.isAllowed(ip).allowed).toBe(false);
      expect(limiter.isAllowed(ip).remaining).toBe(0);
    });

    it("resets limits after window expires", async () => {
      const limiter = new MemorySafeRateLimiter({ windowMs: 50, maxRequests: 2, maxEntries: 10 });
      const ip = "10.0.0.1";

      expect(limiter.isAllowed(ip).allowed).toBe(true);
      expect(limiter.isAllowed(ip).allowed).toBe(true);
      expect(limiter.isAllowed(ip).allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(limiter.isAllowed(ip).allowed).toBe(true);
    });
  });

  describe("XSS Sanitization", () => {
    it("escapes malicious HTML tags and quotes", () => {
      const dangerous = '<script>alert("xss")</script><img src="x" onerror="evil()"/>';
      const safe = escapeHtml(dangerous);

      expect(safe).not.toContain("<script>");
      expect(safe).toContain("&lt;script&gt;");
      expect(safe).toContain("&quot;");
    });

    it("strips control characters and trims input", () => {
      const raw = "  Hello\u0000\u0007World  ";
      const cleaned = sanitizePlainText(raw, 50);
      expect(cleaned).toBe("HelloWorld");
    });
  });
});
