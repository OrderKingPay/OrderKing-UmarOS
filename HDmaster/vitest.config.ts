import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: [
      "src/lib/orderking/billing/subscriptions.test.ts",
      "src/lib/orderking/tech-registry/catalog.test.ts",
      "src/lib/orderking/config/universal-registry.test.ts",
      "src/lib/orderking/finance/merchant-contracts.test.ts",
      "src/lib/orderking/geo/geofencing.test.ts",
      "src/lib/orderking/ai/benchmark-matrix.test.ts",
      "src/lib/orderking/ai/model-routing.test.ts",
      "src/lib/orderking/ai/app-factory.test.ts",
      "src/lib/orderking/connectors/social-publisher.test.ts",
      "src/lib/orderking/connectors/mcp-runtime.test.ts",
      "src/lib/orderking/multimodal-media/vector-engine.test.ts",
      "src/lib/orderking/multimodal-audio/soundbox-dsp.test.ts",
      "src/lib/orderking/ai/providers/providers.test.ts",
    ],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
