import { defineConfig } from "vitest/config";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default defineConfig({
  test: {
    testTimeout: 60000,
    hookTimeout: 60000,
    fileParallelism: false,
    isolate: false,
    include: [
      "src/lib/orderking/tech-registry/catalog.test.ts",
      "src/lib/orderking/finance/merchant-contracts.test.ts",
      "src/lib/orderking/geo/geofencing.test.ts",
      "src/lib/orderking/ai/benchmark-matrix.test.ts",
      "src/lib/orderking/ai/model-routing.test.ts",
      "src/lib/orderking/ai/app-factory.test.ts",
      "src/lib/orderking/connectors/social-publisher.test.ts",
      "src/lib/orderking/connectors/mcp-runtime.test.ts",
      "src/lib/orderking/ai/providers/providers.test.ts",
      "src/components/offline-detector.test.ts",
      "src/routes/api/health.test.ts",
      "src/routes/api/ping.test.ts",
      "src/lib/orderking/customization/universal-customization-engine.test.ts",
      "src/lib/orderking/ai/umar-ai-customization-compiler.test.ts",
      "src/lib/orderking/ai/umar-ai-omnibar.test.ts",
      "src/lib/orderking/compliance/india-marketplace-engine.test.ts",
      "src/lib/orderking/search/multilingual-universal-search.test.ts",
      "src/lib/orderking/customization/client-sync.test.ts",
      "src/lib/orderking/payments/**/*.test.ts",
      "src/lib/orderking/security/umar-os-security-hardening.test.ts",
      "src/lib/orderking/customization/sync-bus.test.ts",
      "src/routes/customization-studio.test.ts",
      "src/lib/orderking/playbook/**/*.test.ts",
      "src/lib/orderking/finance/escrow-tpap-engine.test.ts",
      "src/lib/orderking/ai-connectors.test.ts",
      "src/lib/orderking/education/ai-tutor.test.ts",
      "src/lib/orderking/server/auto-dispatch-engine.test.ts",
      "src/lib/orderking/server/founder-command-dials.test.ts",
      "src/lib/orderking/auth/security-audit.test.ts",
      "src/lib/orderking/server/commercial-bypass-dials.test.ts",
    ],
    environment: "node",
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@orderking/ui": path.resolve(__dirname, "../packages/ui/src"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
  },
});
