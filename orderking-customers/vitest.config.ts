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
    ],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
