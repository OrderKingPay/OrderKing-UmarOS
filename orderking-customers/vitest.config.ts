import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: [
      "src/test/micro-task-earn.test.ts",
      "src/test/checkout-unavailable.test.ts",
      "src/test/support-safety.test.ts",
      "src/test/offline-resilience.test.ts",
      "src/test/payment-security.test.ts",
      "src/test/sovereign-travel-engine.test.ts",
      "src/test/crypto-security.test.ts",
      "src/test/navigation-integrity.test.ts",
      "src/test/sdui-token-ingestion.test.ts",
      "src/test/resilient-live-map.test.ts",
      "src/test/razorpay-edge-webhook.test.ts",
      "src/test/service-worker-resilience.test.ts",
      "src/test/predictive-search.test.ts",
      "src/test/multilingual-dish-matcher.test.ts",
      "src/test/zomato-customer-parity.test.ts",
      "src/test/in-app-travel-booking.test.ts",
      "src/test/zomato-customer-secret-weapons.test.ts",
      "src/test/npci-upi-intent.test.ts",
    ],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@orderking/ui": path.resolve(__dirname, "../packages/ui/src"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
    },
  },
});
