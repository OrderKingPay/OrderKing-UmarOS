# Section 2 — Cloudflare Production Environment Matrix

## Rule
No secret values belong in Git. Cloudflare Pages supports production and preview environment variables and encrypted secrets under **Workers & Pages → Project → Settings → Variables and Secrets**. Secrets should be created as encrypted values, not plain-text Wrangler vars.

## Five project settings

| Project | App directory | Build command | Output |
|---|---|---|---|
| orderking-umar-os | HDmaster | `pnpm --filter orderking-hdmaster build` | `HDmaster/dist` |
| orderking-customers | orderking-customers | `pnpm --filter orderking-customers build` | `orderking-customers/dist` |
| orderking-partners | orderking-partners | `pnpm --filter orderking-partners build` | `orderking-partners/dist` |
| orderking-riders | orderking-riders | `pnpm --filter orderking-riders build` | `orderking-riders/dist` |
| orderking-integrations | Apps-integration- | `pnpm --filter app-builder-workspace build` | `Apps-integration-/dist` |

Production branch: `main`.

Because this is one monorepo, Cloudflare allows up to **5 Pages projects per repository**; this design uses the full five-project allowance exactly. Configure build watch paths later so a change in one app does not unnecessarily rebuild the other four.

## Required server configuration — all five
Always verify:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NODE_ENV=production`
- `ORDERKING_SERVICE_TOKEN` / equivalent inter-service secret where that app uses it

## Payments
Customer/Partner/Rider/Integrations where used:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

Never set test credentials in a production environment.

## AI
Only the providers actually enabled should receive secrets:
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY`
- `XAI_API_KEY`

An unavailable provider remains BLOCKED rather than simulated.

## Maps / messaging / notifications
Configure only when the corresponding capability is enabled:
- Google Maps API credential
- MSG91 credentials/templates
- FCM credentials
- Resend API/from address
- Sentry DSN

## Storage
Where used:
- `S3_BUCKET`
- `S3_REGION`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_ENDPOINT`

Cloudflare-native R2 can replace this boundary later, but that is a provider migration and must not be mixed with launch deployment.

## Travel / external providers
Only after contracts/credentials are verified:
- Amadeus client credentials
- IRCTC/authorized PSP credentials
- bus/cab provider credentials

No provider credentials = feature stays hidden/BLOCKED.

## Public application URLs
Set as production configuration, not source-code constants:
- `BETTER_AUTH_URL`
- `CUSTOMER_APP_URL`
- `PARTNER_APP_URL`
- `RIDER_APP_URL`
- `ADMIN_APP_URL`
- `PUBLIC_APP_URL` where referral/deep-link code uses it

## Domain topology
Recommended:
- `orderking.in` → Customer
- `www.orderking.in` → Customer redirect/alias
- `os.orderking.in` → Umar OS
- `partner.orderking.in` → Partner
- `rider.orderking.in` → Rider
- `pay.orderking.in` → KingPay/integrations

An apex domain must be a Cloudflare zone with Cloudflare nameservers. A subdomain can use a CNAME to the Pages `pages.dev` target, but Cloudflare says the custom-domain association must first be created in the Pages dashboard.

## Free launch
Cloudflare Pages Free currently provides 500 builds/month, one concurrent build, and up to 100 custom domains per project.

## Section 2 completion boundary
Repository configuration is complete. The remaining account-side actions require authenticated Cloudflare access:
1. Create/confirm the five Pages projects.
2. Connect the GitHub repository.
3. Enter the build commands/output directories above.
4. Set production/preview variables and encrypted secrets.
5. Attach domains.
6. Verify DNS, HTTPS, production deployment, Functions/runtime and logs.
7. Record the exact production deployment commit in Umar OS.

Cloudflare's own guidance recommends downloading/verifying the Pages project's Wrangler configuration against the dashboard before treating it as production truth.
