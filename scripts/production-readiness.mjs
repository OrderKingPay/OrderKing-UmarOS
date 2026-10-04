const groups = {
  database_auth: [
    "DATABASE_URL",
    "BETTER_AUTH_URL",
    "BETTER_AUTH_SECRET",
    "GROK_AUTH_ISSUER",
    "GROK_AUTH_CLIENT_ID",
    "GROK_AUTH_CLIENT_SECRET",
  ],
  payments: [
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
  ],
  maps_gps: [
    "MAPBOX_TOKEN",
    "VITE_MAPBOX_TOKEN",
  ],
  ai: [
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GEMINI_API_KEY",
    "XAI_API_KEY",
  ],
  messaging: [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_FROM",
  ],
  storage: [
    "CLOUDFLARE_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
  ],
  observability: [
    "SENTRY_DSN",
    "POSTHOG_API_KEY",
  ],
  optional_travel: [
    "AMADEUS_CLIENT_ID",
    "AMADEUS_CLIENT_SECRET",
    "IRCTC_MERCHANT_KEY",
    "VAHAN_API_KEY",
  ],
};

const production = String(process.env.NODE_ENV ?? "").trim() === "production";
console.log(`Production readiness configuration audit (production=${production})`);
console.log("Values are never printed.");

let blockers = 0;
for (const [group, keys] of Object.entries(groups)) {
  const present = [...new Set(keys)].filter((key) => Boolean(process.env[key]?.trim()));
  const missing = [...new Set(keys)].filter((key) => !process.env[key]?.trim());
  const optional = group === "optional_travel" || group === "observability" || group === "messaging";
  const blocking = production && !optional && group !== "ai" ? missing.length > 0 : false;
  if (blocking) blockers += missing.length;
  console.log(`${group}: present=${present.length} missing=${missing.length}${missing.length ? ` [${missing.join(", ")}]` : ""}`);
}

console.log(`Configuration blockers: ${blockers}`);
if (production && blockers > 0) process.exitCode = 2;
