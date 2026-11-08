# ORDERKING — source-to-release execution traceability matrix

Audit baseline: 2026-10-17; isolated worktree based on `main` at `06d41290` (not a declaration of deployed SHA).
Owner: OrderKing engineering/product; technical specialists below are roles, **not a claim that external agents were launched**.

## Evidence rules

- `G0` security/truth/deployment gate; `G1` controlled real food-delivery pilot; `G2` automation/experience; `G3` authorized fintech; `G4` independent travel/learning/jobs; `G5` repeatable zone expansion.
- A source file's existence is **not** evidence a feature works. Existing tests named here are **candidate test hooks**, not claims they passed in the current audit.
- “NO ... TEST LOCATED” means not identified in this targeted pass; not proof that no test exists elsewhere.
- Status is **OPEN/NOT LIVE VERIFIED for all external journeys** pending proof; F16 code repair is staged here, not live deployed.
- Use customer-visible verified provider identifiers, DB event timelines, legitimate merchant/rider participation and signed contracts where relevant. Never assert a real transaction from a demo, badge or green build.
- Prior `Final_Truth_Matrix.md` and `FOUNDER_LAUNCH_RUNBOOK.md` are historical assertions; they must not override current source or provider evidence.

## Requirements → real source → test → proof

| ID | Requirement | Current code anchor | Test anchor / gap | Gate | Next verified acceptance proof |
|---|---|---|---|---|---|
| F01 | Service-zone/pincode selection | `HDmaster/src/lib/orderking/geo/geofence-guard.ts` | `HDmaster/src/lib/orderking/geo/geofencing.test.ts` | G1 | Confirm polygons, fallback selectors and out-of-zone test on live customer. |
| F02 | Restaurant discovery/search | `HDmaster/src/lib/orderking/discovery/full-text-search.ts` | `HDmaster/src/lib/orderking/search/search.test.ts` | G1 | undefined |
| F03 | Menu ingestion/approval | `orderking-partners/src/lib/server/api-menu.ts` | `orderking-partners/src/lib/server/menu-invariants.test.ts` | G1 | undefined |
| F04 | Kitchen opening/capacity | `orderking-partners/src/lib/server/api-orders.ts` | `HDmaster/src/lib/orderking/orders/state-machine.test.ts` | G1 | undefined |
| F05 | Authoritative cart/quote | `orderking-customers/src/routes/checkout.tsx` | `HDmaster/src/lib/orderking/finance/economics.test.ts` | G1 | undefined |
| F06 | Order state machine | `HDmaster/src/lib/engine/order-machine.ts` | `HDmaster/src/lib/orderking/orders/state-machine.test.ts` | G1 | undefined |
| F07 | Atomic dispatch/offer | `HDmaster/src/routes/api/dispatch/cron/run-auto-dispatch.ts` | `orderking-partners/src/lib/dispatch/queue-contract.test.ts` | G1 | undefined |
| F08 | Kitchen prep/ETA | `orderking-partners/src/lib/server/api-orders.ts` | NO DIRECT MODEL VALIDATION LOCATED | G2 | undefined |
| F09 | Rider onboarding/eligibility | `orderking-riders/src/lib/rider/real-world-bridge.ts` | `orderking-riders/src/lib/rider/real-world-bridge.test.ts` | G1 | undefined |
| F10 | Masked customer-rider calling | `orderking-riders/src/lib/rider/real-world-bridge.ts` | `orderking-riders/src/lib/rider/real-world-bridge.test.ts` | G1 | undefined |
| F11 | Rider delivery proof | `orderking-riders/src/components/rider/delivery-proof-camera.tsx` | NO LIVE DELIVERY PROOF TEST LOCATED | G1 | undefined |
| F12 | Rider SOS/safety | `orderking-riders/src/components/rider/rider-emergency-sos.tsx` | NO END-TO-END ALERT TEST LOCATED | G2 | undefined |
| F13 | COD reconciliation | `HDmaster/src/lib/orderking/finance/SettlementReconciliationEngine.ts` | `HDmaster/src/lib/orderking/finance/SettlementReconciliationEngine.test.ts` | G1 | undefined |
| F14 | Provider UPI order payments | `Apps-integration-/src/routes/api/webhooks/razorpay.ts` | `HDmaster/src/lib/orderking/payments/razorpay-edge-webhook.test.ts` | G1 | undefined |
| F15 | KingPay ledger/settlement | `HDmaster/src/lib/engine/ledger.ts` | `HDmaster/src/lib/orderking/finance/canonical-ledger.test.ts` | G3 | undefined |
| F16 | Provider readiness truth | `HDmaster/src/components/dashboard/FintechGatewayConnectors.tsx` | `HDmaster/src/components/dashboard/FintechGatewayConnectors.test.tsx` | G0 | undefined |
| F17 | KingPay regulatory activation | `HDmaster/src/routes/api/v1/founder/kingpay-compliance.ts` | NO LIVE AUTHORIZATION TEST LOCATED | G3 | undefined |
| F18 | Wallet/loyalty distinctions | `orderking-customers/src/routes/king-pay.tsx` | `HDmaster/src/lib/orderking/finance/canonical-ledger.test.ts` | G3 | undefined |
| F19 | Real flight search/booking | `orderking-customers/src/components/fintech/flight-booking-engine.tsx` | `orderking-customers/src/test/in-app-travel-booking.test.ts` | G4 | undefined |
| F20 | Train PNR/IRCTC | `orderking-customers/src/routes/api/travel/pnr-status.ts` | `orderking-customers/src/test/in-app-travel-booking.test.ts` | G4 | undefined |
| F21 | Travel integration boundary | `HDmaster/src/routes/api/v1/integrations/travel.ts` | NO PROVIDER CONTRACT TEST LOCATED | G4 | undefined |
| F22 | Bus/cab inventory | `orderking-customers/src/components/fintech/bus-booking-engine.tsx` | NO LIVE SUPPLIER TEST LOCATED | G4 | undefined |
| F23 | Adaptive AI Tutor | `HDmaster/src/lib/orderking/education/ai-tutor.ts` | NO VALIDATED LEARNING OUTCOME TEST LOCATED | G4 | undefined |
| F24 | Verified job inventory | `HDmaster/src/lib/orderking/jobs/jobs-marketplace.ts` | `HDmaster/src/lib/orderking/jobs/jobs.test.ts` | G4 | undefined |
| F25 | Milestones and escrow | `HDmaster/src/lib/orderking/finance/escrow-tpap-engine.ts` | `HDmaster/src/lib/orderking/finance/escrow-tpap-engine.test.ts` | G4 | undefined |
| F26 | Merchant KYC/FSSAI | `HDmaster/src/lib/orderking/compliance/onboarding-contracts.ts` | NO OFFICIAL VERIFICATION TEST LOCATED | G1 | undefined |
| F27 | Restaurant payouts | `HDmaster/src/lib/orderking/finance/partner-payouts.ts` | `HDmaster/src/lib/orderking/finance/weekly-settlement.test.ts` | G1 | undefined |
| F28 | Customer cancellations/refunds | `HDmaster/src/routes/v1/admin/customer-orders/$id/cancel.ts` | `HDmaster/src/lib/orderking/finance/SettlementReconciliationEngine.test.ts` | G1 | undefined |
| F29 | Scored disputes and appeals | `HDmaster/src/routes/v1/admin/customer-orders/$id.ts` | NO LIVE EVIDENCE TRIAGE TEST LOCATED | G2 | undefined |
| F30 | Four languages | `HDmaster/src/lib/orderking/search/multilingual-universal-search.test.ts` | `HDmaster/src/lib/orderking/search/multilingual-universal-search.test.ts` | G2 | undefined |
| F31 | Accessibility/voice | `HDmaster/src/lib/orderking/accessibility/A11ySemanticEngine.ts` | `orderking-customers/src/test/navigation-integrity.test.ts` | G2 | undefined |
| F32 | Luxury customer navigation | `orderking-customers/src/test/navigation-integrity.test.ts` | `orderking-customers/src/test/navigation-integrity.test.ts` | G2 | undefined |
| F33 | VIP/King Pass truth | `orderking-customers/src/components/market/vip-gold-pass-hub.tsx` | NO ENTITLEMENT PROVIDER E2E TEST LOCATED | G3 | undefined |
| F34 | RBAC and tenant isolation | `HDmaster/src/lib/auth/gate-identity.server.ts` | `HDmaster/src/lib/orderking/rbac.test.ts` | G0 | undefined |
| F35 | Realtime provider routing | `Apps-integration-/src/routes/api/webhooks/payment-verifier.ts` | `Apps-integration-/src/lib/orderking/webhook-security.test.ts` | G0 | undefined |
| F36 | UmarOS launch-readiness | `HDmaster/src/lib/orderking/golive/golive-engine.ts` | `HDmaster/src/lib/orderking/golive/golive-engine.test.ts` | G0 | undefined |
| F37 | Domains and Cloudflare build | `CLOUDFLARE_PRODUCTION_RELEASE.md` | `HDmaster/scripts/browser-smoke-verdict.test.mjs` | G0 | undefined |
| F38 | Monitoring/rollback | `HDmaster/src/lib/orderking/observability/health-monitor.server.ts` | `HDmaster/src/routes/api/health.test.ts` | G0 | undefined |
| F39 | Growth and incentives | `HDmaster/src/lib/orderking/campaigns/budget-ledger.ts` | `HDmaster/src/lib/orderking/campaigns/campaign-budget-ledger.test.ts` | G2 | undefined |
| F40 | Autonomous governance | `HDmaster/src/lib/orderking/golive/golive-engine.ts` | `HDmaster/src/lib/orderking/golive/golive-engine.test.ts` | G2 | undefined |

## Current observed evidence (2026-10-17)

### Static source audit
- Read-only keyword triage earlier identified 408 source files containing `mock|fake|placeholder|simulat|deterministic|stub|seed` in HDmaster 200 / customers 116 / partners 51 / riders 41; **not** 408 confirmed defects. Independent confirm/refute is mandatory per file.
- `HDmaster/src/components/dashboard/FintechGatewayConnectors.tsx` **was confirmed** to display “Connected” after `setTimeout`, without provider verification, and to collect banking keys in client state. The audit-branch implementation is read-only, clearly unverified and never collects secrets.
- `orderking-customers/src/components/fintech/flight-booking-engine.tsx` still invokes local `searchFlightQuotes`; earlier default fake wallet balance is now zero on the newer main, but actual supplier quote proof is not established.
- `HDmaster/src/routes/api/v1/founder/kingpay-compliance.ts` refuses unverified activation (503); this safe boundary is not a live PSP integration.
- `HDmaster/src/routes/api/v1/integrations/travel.ts` returns 503 for the not-connected suppliers; its comments/config still require server-side cleanup.

### Read-only public root-page probes (no auth, no transactions)
| URL | HTTP result | What that proves |
|---|---|---|
| https://www.orderkingpay.com/ | 200 HTML, title OrderKing — Food Delivery & KingPay | Root webpage served, not real checkout |
| https://admin.orderkingpay.com/ | 200 HTML, title Umar OS | Root webpage served, not access-control proof |
| https://partner.orderkingpay.com/ | 200 HTML, title Order King Partner | Root webpage served, not merchant order proof |
| https://rider.orderkingpay.com/ | 307 redirect to /login | Redirect present, not session authorization proof |
| https://api.orderkingpay.com/ | 200 HTML, title OrderKing | Root serves HTML; API route functionality NOT proven |

### Production data
Earlier same-day direct Supabase query reported restaurants=1, menu_items=0, riders=0, customers=0, orders=1, payments=0, payment_intents=0, settlement_batches=12. Snapshot alone does not establish which database each deployed app uses. Confirm bindings + tenant/seed flags before onboarding or writing records.

## P0 truth blockers
1. Confirm current deployment SHA and app/DB connections for five domains, especially `api.orderkingpay.com` and actual JSON/webhook routes.
2. Verify real restaurant-approved menus/prices/FSSAI, service polygon, eligible riders, payment method and legitimate support channel.
3. Disable/mark any remaining synthetic supplier or money claims; never treat a user-entered key or demo input as provider confirmation.
4. Confirm atomic assignment, idempotent checkout, privacy, and negative-access/RLS tests in live-equivalent environment.
5. Run one consented controlled REAL food order: verified quote, merchant acceptance, rider pickup/delivery, matching payment/COD evidence, balanced ledger and proper settlement liability.
6. Only open public order intake once merchant, delivery, refund/recovery, monitoring and incident rollback gates are green.

## Specialist ownership and acceptance

- **Product/UX lead:** F01-F05, F30-F33. Document before/after tap counts, first-time and low-spec device tests; no “10x” claim without same-task benchmarks.
- **Commerce/merchant lead:** F04-F07, F26-F29. Verify FSSAI, catalog, capacity, support, fulfillment and operator consent.
- **Dispatch/safety lead:** F07-F12. Prove concurrency, route ETA, masked contact, consent and SOS.
- **Payments/compliance lead:** F13-F18, F27-F28. Reconcile every rupee; use approved PSP and payment records, not frontend flags.
- **Travel/learning/jobs leads:** F19-F25. Require original supplier/employer/assessment evidence.
- **Security/database lead:** F34-F35. Enforce verified sessions, isolation, rate limits and RLS/server permissions.
- **Release/observability lead:** F36-F40. Record deployment SHA, route probes, rollout health, exception budgets and rollback rehearsal.

## Acceptance log template
`ID | owner | issue URL | commit/PR | tests exit 0 | staging URL | deployed SHA | real provider/customer evidence reference | reviewer | status`

Never mark `DONE_LIVE` without independent reviewer checking an actual live operation. Maintain `NOT_STARTED`, `IN_PROGRESS`, `TESTED_LOCAL`, `STAGING_VERIFIED`, `DONE_LIVE`, or `BLOCKED_EXTERNAL` honestly.

## Preservation
The primary checkout `C:\Users\hasan\OrderKing` was on `main` with uncommitted `orderking-customers/src/sw.ts` and `scripts/live-probe.mjs`. These were deliberately left untouched. Changes in this deliverable live in independent worktree `C:\Users\hasan\OrderKing-Truth-Matrix-20261017` and branch `audit/orderking-truth-matrix-20261017`. No production release, migration, provider transfer or merge is part of this evidence-first change.
