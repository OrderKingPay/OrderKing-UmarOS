import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Rider Fleet & OTP Parity Suite (https://rider.orderkingpay.com/login)", () => {
  const loginFilePath = path.resolve(__dirname, "../routes/login.tsx");
  const loginSource = fs.readFileSync(loginFilePath, "utf-8");

  describe("1. Step 1: Mobile Number Entry & Send OTP Parity", () => {
    function sanitizePhone(input: string): string {
      return input.replace(/\D/g, "").replace(/^(?:91|0)(?=\d{10}$)/, "");
    }

    function isPhoneValid(cleanPhone: string): boolean {
      return /^[6-9]\d{9}$/.test(cleanPhone);
    }

    it("correctly sanitizes Indian mobile numbers with prefixes", () => {
      expect(sanitizePhone("+91 98765 43210")).toBe("9876543210");
      expect(sanitizePhone("919876543210")).toBe("9876543210");
      expect(sanitizePhone("09876543210")).toBe("9876543210");
      expect(sanitizePhone("9876543210")).toBe("9876543210");
      expect(sanitizePhone("+91-87654-32109")).toBe("8765432109");
    });

    it("validates 10-digit Indian numbers starting strictly with 6, 7, 8, or 9", () => {
      expect(isPhoneValid("9876543210")).toBe(true);
      expect(isPhoneValid("8123456789")).toBe(true);
      expect(isPhoneValid("7012345678")).toBe(true);
      expect(isPhoneValid("6290123456")).toBe(true);

      // Invalid starts or lengths
      expect(isPhoneValid("5876543210")).toBe(false);
      expect(isPhoneValid("4876543210")).toBe(false);
      expect(isPhoneValid("987654321")).toBe(false);
      expect(isPhoneValid("98765432100")).toBe(false);
      expect(isPhoneValid("")).toBe(false);
    });

    it("includes exact 🇮🇳 +91 prefix in login.tsx", () => {
      expect(loginSource).toContain("🇮🇳");
      expect(loginSource).toContain("+91");
      expect(loginSource).toMatch(/<span[^>]*role="img"[^>]*>🇮🇳<\/span>\s*<span>\+91<\/span>/);
    });

    it("renders the exact 'Send OTP →' button in Step 1", () => {
      expect(loginSource).toContain('"Send OTP →"');
      expect(loginSource).toContain("Sending OTP...");
    });

    it("guarantees NO off-screen required inputs in Step 1 to prevent HTML5 validation popups", () => {
      // Step 1 and Step 2 must be conditionally rendered in mutually exclusive ternary blocks:
      // {step === "phone" ? ( ... ) : ( ... )}
      expect(loginSource).toContain('{step === "phone" ? (');
      // Verify that when step === "phone", the otp input is not rendered in DOM
      const step1Regex = /\{step === "phone"\s*\?\s*\(([\s\S]*?)\)\s*:\s*\(/;
      const step1Match = loginSource.match(step1Regex);
      expect(step1Match).toBeTruthy();

      const step1Block = step1Match![1];
      // Only one input inside step 1 block (mobile-input)
      const inputTags = step1Block.match(/<Input[\s\S]*?\/>/g) || [];
      expect(inputTags).toHaveLength(1);
      expect(inputTags[0]).toContain('id="mobile-input"');
      expect(inputTags[0]).not.toContain('id="otp-input"');
    });
  });

  describe("2. Step 2: 6-Digit OTP Entry, Countdown, Resend & Auto-fill Badge", () => {
    it("features 6-digit OTP code entry with auto-focus and numeric pattern", () => {
      expect(loginSource).toContain('id="otp-input"');
      expect(loginSource).toContain('maxLength={6}');
      expect(loginSource).toContain('inputMode="numeric"');
      expect(loginSource).toContain('pattern="[0-9]*"');
    });

    it("configures 30-second countdown timer for resend throttling", () => {
      expect(loginSource).toContain("const [countdown, setCountdown] = useState(30);");
      expect(loginSource).toContain("setCountdown(30);");
      expect(loginSource).toContain("Resend in {countdown}s");
    });

    it("provides both 'Resend via SMS' and 'Resend via WhatsApp' actions", () => {
      expect(loginSource).toContain("Resend via SMS");
      expect(loginSource).toContain('handleSendOtp("sms")');
      expect(loginSource).toContain("Resend via WhatsApp");
      expect(loginSource).toContain('handleSendOtp("whatsapp")');
    });

    it("strictly prohibits instant test auto-fill badges or on-screen OTP display in production", () => {
      expect(loginSource).not.toContain("Instant Verification Code:");
      expect(loginSource).not.toContain("Tap here to auto-fill code →");
      expect(loginSource).not.toContain("debugOtp");
    });

    it("maintains clean UI with ZERO generic badges, marketing slogans, or pre-login bypass links", () => {
      expect(loginSource).not.toContain("Delivery Partner Portal");
      expect(loginSource).not.toContain("Official Fleet App");
      expect(loginSource).not.toContain("Weekly Settlements");
      expect(loginSource).not.toContain("Instant Cash Deposits");
      expect(loginSource).not.toContain("Zero Joining Fee");
      expect(loginSource).not.toContain("Direct KYC Document & Bank Desk");
    });
  });

  describe("3. Instant Auth Sync with Better Auth, Production Security & Auto-Routing", () => {
    it("ensures sendRiderOtpFn strictly prevents OTP leakage to the client", () => {
      const riderFnsPath = path.resolve(__dirname, "../lib/server/rider-fns.ts");
      const riderFnsSource = fs.readFileSync(riderFnsPath, "utf-8");

      const sendStart = riderFnsSource.indexOf("export const sendRiderOtpFn");
      const sendEnd = riderFnsSource.indexOf("export const verifyRiderOtpFn");
      expect(sendStart).toBeGreaterThan(-1);
      expect(sendEnd).toBeGreaterThan(sendStart);
      const sendFnBody = riderFnsSource.slice(sendStart, sendEnd);

      // Verify no debugOtp returned by server function to client
      expect(sendFnBody).not.toMatch(/debugOtp\s*:/);
      // Verify WhatsApp URL is ONLY exposed when channel is explicitly whatsapp
      expect(sendFnBody).toContain('whatsAppOtpUrl: channel === "whatsapp" ? dispatchResult.whatsAppOtpUrl : undefined');
    });

    it("strictly prohibits master bypass OTP in production environment", () => {
      const riderFnsPath = path.resolve(__dirname, "../lib/server/rider-fns.ts");
      const riderFnsSource = fs.readFileSync(riderFnsPath, "utf-8");

      expect(riderFnsSource).toContain('process.env.NODE_ENV !== "production" && cleanOtp === "123456"');
    });
    it("synchronizes session via Better Auth client signIn and fallback signUp", () => {
      expect(loginSource).toContain("authClient.signIn.email");
      expect(loginSource).toContain("authClient.signUp.email");
      expect(loginSource).toContain("orderking_rider_prefill");
    });

    it("seamlessly auto-routes verified riders to / and new riders to /onboarding", () => {
      expect(loginSource).toContain("window.location.href = destination;");

      const riderFnsPath = path.resolve(__dirname, "../lib/server/rider-fns.ts");
      const riderFnsSource = fs.readFileSync(riderFnsPath, "utf-8");

      expect(riderFnsSource).toContain('destination: isVerified ? "/" : "/onboarding"');
      expect(riderFnsSource).toContain("cleanOtp === \"123456\"");
    });
  });

  describe("4. Brand Invariants & Zero Umar Leaks", () => {
    it("has ZERO competitor brand names across all routes and components", () => {
      const srcDir = path.resolve(__dirname, "..");
      const filesToScan: string[] = [];

      function walk(dir: string) {
        for (const item of fs.readdirSync(dir)) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            if (item !== "node_modules" && item !== ".git" && item !== "dist") {
              walk(fullPath);
            }
          } else if (/\.(tsx?|jsx?|html)$/.test(item)) {
            filesToScan.push(fullPath);
          }
        }
      }

      walk(path.join(srcDir, "routes"));
      walk(path.join(srcDir, "components"));

      const FORBIDDEN_COMPETITORS = [
        "zomato",
        "swiggy",
        "zepto",
        "blinkit",
        "dunzo",
        "shadowfax",
        "rapido",
      ];

      for (const file of filesToScan) {
        const content = fs.readFileSync(file, "utf-8").toLowerCase();
        for (const comp of FORBIDDEN_COMPETITORS) {
          expect(content).not.toContain(comp);
        }
      }
    });

    it("has ZERO 'Umar' leaks in rider UI (Order King / King AI branding only)", () => {
      const srcDir = path.resolve(__dirname, "..");
      const filesToScan: string[] = [];

      function walk(dir: string) {
        for (const item of fs.readdirSync(dir)) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            if (item !== "node_modules" && item !== ".git" && item !== "dist") {
              walk(fullPath);
            }
          } else if (/\.(tsx?|jsx?)$/.test(item)) {
            filesToScan.push(fullPath);
          }
        }
      }

      walk(path.join(srcDir, "routes"));
      walk(path.join(srcDir, "components"));

      for (const file of filesToScan) {
        const content = fs.readFileSync(file, "utf-8");
        // Check for standalone word "Umar" in UI strings or JSX (ignoring 'Kumar')
        const matches = content.match(/\bUmar\b/gi) || [];
        // Filter out "Kumar"
        const trueUmarMatches = matches.filter((m) => m.toLowerCase() === "umar");
        // If any, ensure they are not in user visible JSX
        if (trueUmarMatches.length > 0) {
          // Check line by line
          const lines = content.split("\n");
          lines.forEach((line) => {
            if (/\bUmar\b/i.test(line)) {
              // Ensure it's not a user-facing string in JSX
              expect(line).not.toMatch(/<[^>]*>.*Umar.*<\/[^>]*>/i);
              expect(line).not.toMatch(/"[^"]*Umar[^"]*"/i);
            }
          });
        }
      }
    });
  });
});
