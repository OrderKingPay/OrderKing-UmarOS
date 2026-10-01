#!/usr/bin/env node
/**
 * Deprecated: deployment credentials must never be hardcoded here.
 *
 * Configure production secrets in Render Environment Variables instead.
 * This helper intentionally refuses to inject credentials into Vercel.
 */

console.error(
  "[OrderKing] add_envs.cjs is deprecated. Configure secrets in the deployment platform instead.",
);
process.exit(1);
