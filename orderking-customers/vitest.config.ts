import { defineConfig } from "vitest/config";
import path from "node:path";
import fs from "node:fs";

// Load local gitignored .env into test runner environment if present
const envPath = path.resolve(import.meta.dirname, ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

export default defineConfig({
  test: {
    testTimeout: 60000,
    hookTimeout: 60000,
    fileParallelism: false,
    isolate: true,
    include: [
      "src/test/micro-task-earn.test.ts",
      "src/test/checkout-unavailable.test.ts",
      "src/test/support-safety.test.ts",
      "src/test/offline-resilience.test.ts",
      "src/test/payment-security.test.ts",
      "src/test/crypto-security.test.ts",
      "src/test/navigation-integrity.test.ts",
      "src/test/stable-navigation.test.ts",
      "src/test/sdui-token-ingestion.test.ts",
      "src/test/resilient-live-map.test.ts",
      "src/test/razorpay-edge-webhook.test.ts",
      "src/test/service-worker-resilience.test.ts",
      "src/test/predictive-search.test.ts",
      "src/test/multilingual-dish-matcher.test.ts",
      "src/test/tier1-customer-parity.test.ts",
      "src/test/tier1-customer-secret-weapons.test.ts",
      "src/test/npci-upi-intent.test.ts",
      "src/test/fintech-reality-suite.test.ts",
      "src/test/search-connaught-place.test.ts",
      "src/test/geographic-intelligence-recommendation.test.ts",
      "src/test/dynamic-bottom-nav.test.ts",
      "src/test/live-search-catalog.test.ts",
      "src/test/commercial-claims-real-only.test.ts",
      "src/test/parcel-courier-engine.test.ts",
      "src/test/parcel-order-db.test.ts",
      "src/test/utilities-engine.test.ts",
      "src/test/customer-header-avatar.test.ts",
      "src/test/connected-ecosystem-lifecycle.test.ts",
      "src/test/fintech-payment-settlement-lifecycle.test.ts",
      "src/test/phone-auth.test.ts",
      "src/test/academic-tutor-kingpay-integration.test.ts",
      "src/test/academic-tutor-reality.test.ts",
      "src/test/gemini-tutor-solver.test.ts",
      "src/test/adzuna-jobs-hub.test.ts",
      "src/test/in-app-travel-booking.test.ts",
      "src/test/dual-travel-engine.test.ts",
      "src/test/travel-partner-affiliates.test.ts",
      "src/test/travel-provider-truth-gates.test.ts",
      "src/test/travel-autosuggest.test.ts",
      "src/test/sovereign-travel-engine.test.ts",
      "src/test/travelpayouts-white-label.test.ts",
      "src/test/tbo-b2b-client.test.ts",
      "src/test/dynamic-radius.test.ts",
    ],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@orderking/ui": path.resolve(import.meta.dirname, "../packages/ui/src"),
      "react": path.resolve(import.meta.dirname, "./node_modules/react"),
      "react-dom": path.resolve(import.meta.dirname, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(import.meta.dirname, "./node_modules/react/jsx-runtime"),
    },
  },
});
