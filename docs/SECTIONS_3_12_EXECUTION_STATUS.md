# Sections 3–12 execution ledger

Current branch: `audit/current-main-production-hardening`

## Verified now

- Customer application source was not changed by this hardening pass; only its Cloudflare Wrangler configuration changed.
- Cloudflare is the only intended active hosting path.
- Five Pages projects are explicitly named in Wrangler configuration.
- Production runtime is fail-closed when server database configuration is missing.
- Partner settlement no longer has Razorpay test-key/test-secret fallbacks.
- Rider /login no longer disables auth because the host is Vercel.
- Cloudflare Pages origins are explicitly trusted for non-Customer apps.
- King Pass cannot become ACTIVE without a real payment provider and verified payment webhook.
- Founder payout and KingPay transfer paths cannot claim money movement without a real external provider adapter.
- Travel/OpenAI integration endpoints cannot claim successful provider execution without a real adapter.
- Universal revenue connectors no longer fabricate UPI links, database health counts, or web-search results.
- A production-truth CI audit now checks for the known hard-coded fake-provider/fake-health patterns.
- Supabase launch interlock exists and is currently OFF/SIMULATED/SANDBOX.
- Database trigger blocks public launch unless LIVE data mode, controlled pilot, LIVE payments and observability are present.
- Database trigger blocks consumer UPI before public launch.

## Verified database truth

Supabase project: `wziksbrumklcktrlgedb`

- ACTIVE_HEALTHY
- Postgres 17.6
- organization `org_orderking` remains SIMULATED
- business tables audited earlier are empty
- `public.platform_launch_controls` row:
  - public_launch=false
  - controlled_pilot=false
  - payments_mode=SANDBOX
  - rider_gps=false
  - dispatch=false
  - KingPay merchant=false
  - KingPay consumer UPI=false
  - travel=false
  - tasks=false
  - VIP=false
  - AI support=true
  - observability=true

## Still BLOCKED

- full RLS/RBAC/tenant policy matrix
- secret rotation of historically exposed credentials
- Supabase backup/restore evidence
- actual Cloudflare dashboard/project production-branch verification for every project
- Cloudflare environment/secrets configuration evidence
- real Razorpay production credentials and webhook evidence
- real maps/routing/OTP/messaging provider evidence
- real merchant/rider/customer pilot data
- Customer App completion/handoff from Antigravity
- partner onboarding evidence
- rider GPS/dispatch live evidence
- KingPay merchant collection live evidence
- regulated consumer UPI/TPAP path
- counsel approval of legal operating pack
- Section 11 performance/security/E2E evidence
- contribution-margin pilot evidence
- final PUBLIC_LAUNCH decision

## Final launch rule

`PUBLIC_LAUNCH=OFF`.

Nothing in this ledger authorizes production launch. Evidence from current repository, Cloudflare, Supabase, providers and the real pilot must control the gate.
