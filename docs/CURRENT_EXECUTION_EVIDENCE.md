# Current execution evidence

## Controlled branch
`execute/production-hardening-current-main`

## Baseline
Started from current `main` after the latest Customer App work already present. No reset, force-push, Vercel deployment, or Netlify deployment was used.

## Implemented
- Cloudflare Pages Nitro preset locked in all five application build configurations.
- Cloudflare Wrangler Pages configs added/verified for all five projects.
- Production runtime marker: `ORDERKING_RUNTIME=production`.
- Production database access fails closed without `DATABASE_URL`; PGLite remains available only for non-production/dev/preview.
- Razorpay `test_key/test_secret` fallbacks removed from customer wallet and partner settlement.
- Umar OS legacy Vercel cron/header assumptions removed from settlement and auto-dispatch.
- Finance escalation API converted to the current TanStack Start server-route model.
- Subscription API replaced a mock UUID/Express stub with parameterized DB operations.
- Simulated crypto treasury explicitly gated as FUTURE/DISABLED.
- Production truth gate extended to detect legacy hosting trust, Vercel runtime fallbacks, legacy cron checks, test Razorpay credentials and ungated crypto payments.
- Umar OS TypeScript blockers exposed by CI were repaired without weakening typecheck.
- Food checkout now creates a real HDmaster order in PENDING_PAYMENT, creates a provider payment intent, and only marks the order paid after server-side Razorpay signature + provider capture verification.
- Rider GPS heartbeat now uses the authenticated rider server function; the engine rejects stale/impossible GPS and requires online/on-delivery state.
- Sensitive public-role grants were removed from `public.kyc_cases` and `public.rider_location_pings` in Supabase and documented in a repository migration.
- KingPay wallet/public-UPI/bank-linking/BBPS/digital-gold/credit/rewards capabilities are explicitly disabled in production until real providers/ledgers exist.

## Supabase verification
Project: `wziksbrumklcktrlgedb`

Live SQL evidence:
- public tables: 109
- public tables without RLS: 0
- restaurants: 0
- menu_items: 0
- orders: 0
- payments: 0
- dispatch_assignments: 0
- rider_location_pings: 0
- kingpay_transactions: 0
- RLS tables without policies: 107
- RLS tables with policies: 2

The live marketplace currently contains no restaurant/menu/order/payment/rider-location business records, so it is not a real pilot yet.

## Remaining blockers
- Current Cloudflare dashboard production-branch state for all five Pages projects needs fresh evidence.
- Cloudflare production environment/secrets need per-project verification.
- Real provider credentials, webhook endpoints and approvals are not all configured.
- The 107 RLS-no-policy tables require an intentional access model review before direct client/API exposure.
- Real restaurant, rider and customer pilot onboarding has not occurred.
- Current CI evidence for the latest execution head is still pending; stale legacy Vercel status contexts are not accepted as deployment evidence.
- Legal/compliance approval has not occurred.
- Public launch remains OFF.
