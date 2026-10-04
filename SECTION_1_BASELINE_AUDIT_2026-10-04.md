# SECTION 1 — BASELINE / SOURCE-OF-TRUTH AUDIT
Date: 2026-10-04
Repository: OrderKingPay/OrderKing-UmarOS
Default branch at audit: main
Working branch: section1-production-baseline-20261004

## Verified repository state
- GitHub repository exists and is accessible.
- Main branch exists.
- Current repository is a multi-app monorepo.
- Root package declares pnpm 12.8.1 and Turborepo.
- Apps present include HDmaster, orderking-customers, orderking-partners, orderking-riders and Apps-integration-.
- Existing forensic reports explicitly document prior fake/simulated behavior removal and fail-closed boundaries.
- Draft PR #17 is the current Cloudflare-only cutover proposal; it is NOT merged.
- Draft PR #18 contains additional Customer financial-truth hardening; it is NOT merged.
- Therefore main must not be assumed to contain the latest draft hardening.

## Known deployment/source discrepancies
- Historical reports conflict: one older report describes Vercel/Netlify deployments, while the latest draft PR #17 explicitly establishes Cloudflare-only as the intended active deployment target.
- Cloudflare live URLs have been recorded in prior work, but current runtime verification could not be performed from this environment.
- The connected Windows Remote Desktop device is currently OFFLINE (last seen approximately 47 hours ago). Therefore local browser/E2E/typecheck verification cannot honestly be claimed from this environment.
- No production deployment is triggered by this section.

## Current integration truth from repository audit
- Razorpay code exists but credentials/provider operation were previously unverified.
- Stripe code exists but credentials/provider operation were previously unverified.
- AI gateway code exists; provider credentials are incomplete/previously blocked.
- Amadeus integration exists but credentials were previously unverified.
- IRCTC path is fail-closed rather than fabricating train availability.
- Mapbox/live tracking requires real credentials/data.
- Supabase/database connectivity requires production credentials.
- Storage integration requires production credentials.
- KingPay must not display fabricated linked-bank accounts, balances, successful payments, loan approvals, BBPS payments or other financial outcomes.

## Fake/demo-data policy
Do not delete features. For data:
A. Identify record source and provenance.
B. Classify: REAL / DEMO / TEST / UNKNOWN.
C. REAL stays.
D. DEMO/TEST is removed or isolated only after evidence.
E. UNKNOWN is quarantined/hidden from production views until verified.
F. No synthetic restaurant/customer/rider/order/GPS/payment records may appear as live production activity.

## Authentication priority
All four operational surfaces must share a coherent identity model:
Customer sign-up/login/recovery -> Customer
Partner sign-up/login/onboarding -> Partner
Rider sign-up/login/onboarding -> Rider
Founder/admin login/RBAC -> Umar OS
No UI-only login, fake OTP, fake success, client-only authorization or hardcoded session state may be accepted.

## Immediate Section 2 entry criteria
Before touching production data or external credentials:
1. Bring the connected development machine online.
2. Verify working tree and active Antigravity changes.
3. Reconcile main with draft PRs without merging blindly.
4. Run static inventory of routes, auth endpoints, database schema/migrations, env references and provider boundaries.
5. Run local builds/typechecks for every app.
6. Verify each Cloudflare Pages deployment independently.
7. Produce a route-by-route authentication matrix.
8. Fix only confirmed defects on isolated branches.
9. Re-test before any merge/deploy.

## Explicit non-actions in Section 1
- No file deletion.
- No database deletion.
- No production deployment.
- No domain purchase.
- No Vercel/Netlify deployment.
- No replacement of existing UI.
- No fake credentials or simulated provider responses.
