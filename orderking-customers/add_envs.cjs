#!/usr/bin/env node

// Retained only as a compatibility placeholder.
// Production hosting is Cloudflare-only. Never commit or inject provider
// credentials from source code. Configure secrets in Cloudflare instead.

console.error(
  "DEPRECATED: add_envs.cjs is disabled. Configure production secrets in Cloudflare Pages/Workers."
);
process.exitCode = 1;
