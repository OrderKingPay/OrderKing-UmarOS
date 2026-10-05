# Current Production Execution Evidence

## Branch
`execute/production-hardening-live-main`

Base: current `main` at branch creation. The Customer App work present on that main boundary is preserved.

## Active hosting policy
Cloudflare only. No Vercel or Netlify deployment is used for this execution.

## Implemented hardening
- Cloudflare Pages Wrangler runtime hardened for all five surfaces; production runtime marked explicitly.
- Production CI pnpm pinned to 12.8.1 and production truth gate added.
- Production database access fails closed when DATABASE_URL is absent.
- Four non-customer auth servers no longer trust Vercel/Netlify runtime origins and require explicit production base URL/database.
- Auth clients in HDmaster, Apps-integration, Partner and Rider no longer fall back to Vercel runtime URLs.
- Partner Razorpay settlement no longer accepts test_key/test_secret fallback.
- Legacy Vercel cron headers/routes removed from Umar OS dispatch/settlement endpoints.
- Crypto payment treasury path explicitly FUTURE/DISABLED.
- Rider GPS heartbeat uses authenticated server ingestion rather than direct client persistence.
- Partner kitchen realtime client is null-guarded.
- Sensitive KYC/rider-location public grants are revoked in Supabase and documented in repository migration.
- Historical completion report marked as non-launch evidence.
- Legal review pack, provider truth matrix, release test matrix, and Section 12 pilot gate added.

## Supabase live evidence
Project: `wziksbrumklcktrlgedb`

Verified:
- public tables: 109
- public tables without RLS: 0
- core restaurants: 0
- core menu_items: 0
- core orders: 0
- core payments: 0
- dispatch_assignments: 0
- rider_location_pings: 0
- kingpay_transactions: 0
- public anon/authenticated SELECT on kyc_cases: revoked
- public anon/authenticated SELECT on rider_location_pings: denied
- current launch control remains non-live (SIMULATED / SANDBOX / public launch OFF)

## Not yet verified
- GitHub Actions result for the latest execution head
- Cloudflare dashboard production branch state and per-project production secrets
- live provider credentials/approvals/webhooks
- current Customer App completion by Antigravity
- real restaurant/rider/customer pilot
- legal counsel approval

## Launch state
PUBLIC_LAUNCH remains OFF.
CONTROLLED_PILOT remains OFF.
