# ORDERKING / KINGPAY / UMAR OS — PRODUCTION LAUNCH MASTER PLAN
Date: 2026-10-04
Status: SECTION 1 — BASELINE / SOURCE-OF-TRUTH LOCK

## Non-negotiable execution rules
- Preserve all existing apps, routes, features, databases, UI identity and prior work.
- No destructive reset, wipe, replacement, or feature deletion.
- Never represent mock/simulated/UI-only/disconnected capability as live.
- Fake/demo production data is removed only after proving it is demo data; business features remain.
- Unavailable integrations are hidden behind a truthful availability state, not deleted.
- Every change is isolated, reviewable, and rollback-safe before deployment.
- Cloudflare Pages is the active deployment target; do not reintroduce Vercel/Netlify deployment work.
- Customer UI/navigation remains frozen unless a production defect requires a minimal fix.

## Platform scope
1. Customer — ordering, account, payments, tracking, support.
2. Partner — restaurant onboarding, menu, orders, kitchen status, settlement.
3. Rider — onboarding, availability, dispatch, navigation, delivery proof, earnings.
4. HDmaster / Umar OS — founder control, governance, support, operations, finance, integrations, audit.
5. Apps-integration — provider/API boundary and integration control plane.
6. KingPay — payment/collection now; TPAP/PSP-bank capability pursued separately and never simulated.

## Section sequence
1. Baseline/source-of-truth lock (this section).
2. Authentication/account creation/login/session recovery across all apps.
3. Database/RLS/data truth + removal/quarantine of verified demo records.
4. Partner onboarding + restaurant live-data readiness.
5. Rider onboarding + dispatch/live-location readiness.
6. Customer ordering → payment → restaurant → rider → delivery E2E.
7. KingPay real provider integration and truthful unavailable-state handling.
8. Umar OS control plane, alerts, audit, permissions and founder workflows.
9. AI/provider connectivity and fail-closed behavior.
10. Cloudflare Pages production configuration, domains, environment variables and observability.
11. Legal/operational launch pack: restaurant, rider, customer, privacy, refund, grievance and platform terms.
12. Controlled production pilot and evidence-based go-live gate.

## Launch gate
The business is declared ready only when a real restaurant, real rider and real customer can complete a real test order end-to-end, with real payment/provider confirmation, correct settlement records, live status updates and audit evidence. A build passing alone is not a launch.

## Liability principle
Platform agreements will clearly define independent restaurant/rider roles and responsibilities, but contracts cannot lawfully eliminate liability that applicable Indian law imposes on the platform. Legal review is required before public launch.
