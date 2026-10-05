#!/usr/bin/env node
/**
 * Local environment contract checker.
 *
 * This file intentionally does not write credentials to a hosting provider.
 * Production variables must be configured through the active Cloudflare
 * deployment/project settings or a local untracked environment file.
 */
const required = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}

console.log(
  "OrderKing environment contract is present. Configure these values in the Cloudflare project; no credentials are embedded or uploaded by this script.",
);
