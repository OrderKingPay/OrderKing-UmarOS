# Sections 3–12 execution status

This file is an evidence ledger, not a readiness claim.

## Current verified database state

Supabase project: `wziksbrumklcktrlgedb`

- status: ACTIVE_HEALTHY
- Postgres: 17.6
- organization data_mode: SIMULATED
- marketplace rows: restaurants 0, menu_items 0, orders 0, payments 0, dispatch_assignments 0, rider_location_pings 0, kingpay_transactions 0
- public tables with RLS enabled at audit time: 109
- public RLS policies visible: 2, limited to public catalog reads for restaurants/menu_items
- launch-control row exists for `org_orderking` with `public_launch=false`, `controlled_pilot=false`, `payments_mode=SANDBOX`, all payment/GPS/dispatch/KingPay/travel/task/VIP launch switches OFF, AI support and observability ON.

## Repository hardening executed on branch

Branch: `audit/production-hardening-sections-3-11`

PR: #27

Changes made:

- removed Partner Razorpay `test_key`/`test_secret` production fallback
- require real Razorpay credentials for settlement
- reject test Razorpay key IDs in live settlement flow
- replace Partner dummy Supabase client with environment-configured optional client
- guard Partner realtime subscriptions when Supabase is not configured
- remove fake King Pass subscription UUID/success response; persist through the existing DB layer or return failure
- replace Partner Soundbox UI claim of active paid capability with provider-pending state and local-only audio test
- add Cloudflare Pages auth origin for Rider
- remove Rider login's Vercel-specific auth disable path
- add explicit Wrangler Pages configuration for all five surfaces
- add Cloudflare-only release runbook
- pin production-gate pnpm to 12.8.1

## Still blocked

These cannot be truthfully marked PASS until primary evidence exists:

- Cloudflare production branch verification for all five projects
- Cloudflare environment/secrets configuration
- real Razorpay credentials and live/sandbox evidence
- live maps/OTP/email/AI/provider evidence
- complete production RLS/RBAC matrix
- backup/restore evidence
- real partner onboarding
- real rider onboarding
- actual Rider Cloudflare /login smoke test
- actual Customer App completion from Antigravity
- real payment + webhook + reconciliation
- legal/counsel approval
- low-network/five-app E2E evidence
- controlled real pilot
- economics evidence
- final public launch decision

## Hosting rule

Cloudflare only. No Vercel or Netlify deployment is used as a fix or as launch evidence.

## Final launch state

`PUBLIC_LAUNCH=OFF`

The repository and database must remain in a controlled/non-public state until all mandatory evidence gates pass.
