/*
 * Legacy environment helper.
 *
 * SECURITY RULE:
 * - No credentials are hard-coded in source control.
 * - Vercel is not an active deployment target for the OrderKing launch.
 * - Cloudflare secret provisioning is handled by the controlled Section 2 deployment
 *   procedure; this file only validates that the required values exist in the
 *   invoking environment.
 */

const required = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
];

const missing = required.filter((key) => !String(process.env[key] ?? "").trim());

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Environment preflight passed. No credentials were written to source control.");
console.log("Use the Cloudflare deployment procedure to provision production secrets.");
