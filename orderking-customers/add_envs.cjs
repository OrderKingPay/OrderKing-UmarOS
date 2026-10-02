/**
 * Legacy provisioning helper intentionally disabled.
 *
 * Production secrets must be provisioned through the Cloudflare Pages/Workers
 * environment settings. No credentials, database passwords, or deployment
 * provider CLI commands belong in source control.
 */
console.log(
  "Cloudflare-only project: configure production secrets in Cloudflare. " +
    "This legacy helper performs no deployment or secret mutation.",
);
