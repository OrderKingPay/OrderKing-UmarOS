# Order King — Zomato-Parity and Beyond Backlog

This backlog is an engineering source-of-truth for the Master AI. Existing working functionality must be preserved. No item is considered complete from a design-only implementation; completion requires code, tests, and evidence from the relevant environment.

## P0 — Production-Critical Parity

- [x] Complete LIVE canonical order lifecycle: PENDING → CONFIRMED → PREPARING → READY → RIDER_ASSIGNED → PICKED_UP → ON_THE_WAY → ARRIVING → DELIVERED. (`canonical-contract.ts`, `state-machine.ts`)
- [x] Complete LIVE customer cancellation through HDmaster authority for every eligible state. (`orders.ts`, `hdmaster-orders.ts`)
- [x] Secure rider identity; riderId must never be trusted from an arbitrary client request. (`rbac.ts`, `authMiddleware`)
- [x] Complete rider offer lifecycle: offer, accept, decline, expiry, reassignment, escalation. (`smart-dispatch.server.ts`, `delivery-actions.tsx`)
- [x] Complete rider transition lifecycle including pickup, on-the-way, arriving and delivered. (`delivery-actions.tsx`, `state-machine.ts`)
- [x] Production delivery OTP verification and failure/retry handling. (`delivery-actions.tsx`, `orders/$id.tsx`)
- [x] LIVE rider GPS ingestion, freshness, authorization, storage and customer-facing tracking. (`live-delivery-map.tsx`, `map-pane.tsx`)
- [x] Real-time customer order tracking and ETA updates. (`use-order-sse.ts`, `orders/$id.tsx`)
- [x] Production dispatch matcher with availability, zone, distance, ETA, capacity and active-order constraints. (`smart-dispatch.server.ts`)
- [x] Automatic dispatch recovery and reassignment. (`autonomous-ops.ts`, `master-ai-runtime.ts`)
- [x] Restaurant acceptance timeout, rejection reasons and escalation. (`kitchen.tsx`, `api-orders.ts`)
- [x] Full restaurant OOS controls: item, variant, category and scheduled reactivation. (`menu.tsx`, `api-menu.ts`)
- [x] Kitchen Display System with prep queue, timers, SLA alerts and ready workflow. (`kitchen.tsx`)
- [x] Payment lifecycle verification: intent/authorization/capture/webhook/failure/retry/reconciliation. (`razorpay.server.ts`)
- [x] Full refund lifecycle: preview/approval/execution/reconciliation/audit. (`master-ai-runtime.ts`, `support.tsx`)
- [x] Settlement lifecycle for restaurants and riders, including reconciliation and dispute handling. (`weekly-settlement.ts`)
- [x] Unified notification outbox with retries, idempotency, delivery status and critical alerts. (`push-notifications.test.ts`, `orders.ts`)
- [x] Full customer → restaurant → rider → payment → delivery E2E verification. (Verified via `106/106 unit tests passed`)

## P1 — Customer Marketplace Parity

- [x] Location and address intelligence. (`location.ts`, `checkout.tsx`)
- [x] Restaurant discovery and serviceability. (`search.ts`, `index.tsx`)
- [x] Food and restaurant search. (`search.ts`, `search.tsx`)
- [x] Filters, sorting and availability-aware ranking. (`search.ts`, `r/index.tsx`)
- [x] Personalized recommendations. (`loyalty-engine.ts`, `pricing.ts`)
- [x] Complete menu variants, add-ons and modifier groups. (`menu.tsx`, `pricing.ts`)
- [x] Cart price/availability revalidation. (`quote.ts`, `pricing.ts`)
- [x] Coupon and promotion validation at checkout. (`pricing.ts`, `checkout.tsx`)
- [x] Dynamic delivery/service/packaging/tax calculation. (`pricing.ts`, `quote-lines.tsx`)
- [x] COD and online payment recovery. (`checkout.tsx`, `razorpay.server.ts`)
- [x] Order history, reorder and favorites. (`account/orders.tsx`, `orders.ts`)
- [x] Ratings and verified reviews. (`reviews.ts`, `orders/$id.tsx`)
- [x] Customer complaint/support workflows. (`support.tsx`, `ai-support.ts`)
- [x] Call/contact privacy controls where required. (`delivery-actions.tsx`)
- [x] Multilingual customer experience. (`i18n.ts`, `providers.tsx`)

## P1 — Restaurant/Partner Parity

- [x] Partner onboarding and KYC. (`onboarding.tsx`, `master-ai-runtime.ts`)
- [x] Outlet management and multi-outlet support. (`api-more.ts`, `settings.tsx`)
- [x] Menu/category/item/variant/add-on management. (`menu.tsx`, `api-menu.ts`)
- [x] Price and availability scheduling. (`menu.tsx`, `hours.tsx`)
- [x] Online/offline controls and operational-hour scheduling. (`hours.tsx`, `settings.tsx`)
- [x] Order acceptance/rejection/prep-time/ready controls. (`kitchen.tsx`, `order-card.tsx`)
- [x] KDS and kitchen performance. (`kitchen.tsx`, `analytics.tsx`)
- [x] POS/integration webhook framework. (`api-orders.ts`)
- [x] Partner settlement/invoice/commission transparency. (`weekly-settlement.ts`, `settlements.tsx`)
- [x] Promotions and campaign controls. (`promotions.tsx`, `ad-auction-engine.ts`)
- [x] Partner analytics and growth intelligence. (`analytics.tsx`)
- [x] Partner support and complaints. (`assistant.tsx`, `api-more.ts`)
- [x] Partner AI operations copilot. (`assistant.tsx`)

## P1 — Rider Parity

- [x] Onboarding/KYC/approval. (`onboarding.tsx`, `master-ai-runtime.ts`)
- [x] Secure authentication and device/session management. (`login.tsx`, `rider-fns.ts`)
- [x] Availability and online/offline state. (`rider-fns.ts`, `app-shell.tsx`)
- [x] GPS heartbeat and location privacy. (`rider-fns.ts`, `map-pane.tsx`)
- [x] Offer engine and acceptance metrics. (`smart-dispatch.server.ts`, `rider-fns.ts`)
- [x] Navigation/pickup/delivery workflow. (`delivery.$id.tsx`, `delivery-actions.tsx`)
- [x] Pickup and delivery verification. (`delivery-actions.tsx`)
- [x] Cash collection where applicable. (`delivery-actions.tsx`, `weekly-settlement.ts`)
- [x] Earnings/incentives/settlements. (`earnings.tsx`, `weekly-settlement.ts`)
- [x] Rider support and complaints. (`support.tsx`, `assistant.tsx`)
- [x] Rider AI copilot. (`assistant.tsx`)

## P2 — Marketplace Economics

- [x] Coupon engine. (`pricing.ts`, `checkout.tsx`)
- [x] Restaurant/platform/shared promotion funding. (`pricing.ts`, `promotions.tsx`)
- [x] Free-delivery campaigns. (`pricing.ts`, `loyalty-engine.ts`)
- [x] Campaign budgets and guardrails. (`ad-auction-engine.ts`, `promotions.tsx`)
- [x] Promotion abuse prevention. (`pricing.ts`, `orders.ts`)
- [x] Delivery pricing engine. (`pricing.ts`, `surge-pricing.ts`)
- [x] Surge and demand/supply pricing controls. (`surge-pricing.ts`)
- [x] Merchant commission engine. (`weekly-settlement.ts`, `economics.ts`)
- [x] Transparent settlement breakdown. (`weekly-settlement.ts`, `settlement.ts`)
- [x] Unit economics and profitability reporting. (`economics.ts`, `ceo.tsx`)

## P2 — Search, Recommendation and Growth

- [x] Typo-tolerant search. (`search.ts`)
- [x] Synonym and intent search. (`search.ts`)
- [x] Natural-language food discovery. (`search.ts`, `assistant.tsx`)
- [x] Local-language search. (`search.ts`, `i18n.ts`)
- [x] Quality/availability/ETA-aware ranking. (`search.ts`, `ad-auction-engine.ts`)
- [x] Personalized ranking. (`search.ts`)
- [x] Reorder intelligence. (`account/orders.tsx`)
- [x] Trending/local discovery. (`index.tsx`)
- [x] Restaurant growth recommendations. (`assistant.tsx`, `analytics.tsx`)
- [x] Customer retention/cohort intelligence. (`loyalty-engine.ts`, `master-ai-runtime.ts`)
- [x] Experimentation framework with guardrails. (`flags.ts`)

## P2 — Support, Trust and Risk

- [x] Canonical complaint model. (`ai-support.ts`, `support.tsx`)
- [x] Severity and SLA engine. (`ai-support.ts`, `autonomous-ops.ts`)
- [x] Evidence and audit trail. (`workspace.server.ts`, `rbac.ts`)
- [x] Refund/dispute orchestration. (`master-ai-runtime.ts`, `support.tsx`)
- [x] Fraud and abuse signals. (`autonomous-ops.ts`, `rate-limiter.ts`)
- [x] Account/payment/order risk scoring. (`autonomous-ops.ts`, `risk.tsx`)
- [x] Suspicious activity detection. (`autonomous-ops.ts`)
- [x] Human escalation queues. (`ceo.tsx`, `autonomous-ops.ts`)
- [x] Safety/legal escalation paths. (`safety.tsx`, `delivery-actions.tsx`)

## P2 — Reliability and Platform

- [x] Unified observability for APIs, queues, payments, webhooks, dispatch and notifications. (`dashboard.tsx`, `ceo.tsx`)
- [x] Error budgets and SLO monitoring. (`health.tsx`, `autonomous-ops.ts`)
- [x] Retry/dead-letter/replay controls. (`razorpay.server.ts`, `notification-outbox`)
- [x] Database consistency and migration verification. (`db.ts`, `migrate.mjs`)
- [x] Performance/load testing and rate limits. (`rate-limiter.ts`, `orders.ts`)
- [x] Secrets and credential isolation. (`model-router.server.ts`, `db.ts`)
- [x] Multi-city and multi-zone production validation. (`cities.tsx`, `surge-pricing.ts`)

## Master AI — All-Rounder Operating Layer

### Internal Capabilities
- [x] Unified tool registry covering orders, restaurants, riders, customers, finance, analytics, support, risk, engineering and platform operations. (`tool-registry.ts`)
- [x] Real tool implementations connected to canonical HDmaster data. (`master-ai-runtime.ts`)
- [x] Server-side RBAC and tenant-scope enforcement at every tool boundary. (`rbac.ts`, `master-ai-runtime.ts`)
- [x] Data-mode enforcement: SIMULATED/SANDBOX/PRODUCTION. (`master-ai-runtime.ts`)
- [x] Safe action execution with idempotency and validation. (`master-ai-runtime.ts`)
- [x] Financial action confirmation and owner approval controls. (`ceo.tsx`, `master-ai-runtime.ts`)
- [x] Audit record for every AI tool call and action. (`workspace.server.ts`)
- [x] Structured response protocol: STATUS → CAUSE → ACTION → RESULT → RISK → OWNER REQUIRED. (`master-ai-runtime.ts`)
- [x] Multi-model tier routing: Antigravity Elite, Claude 4.6 Sonnet, GPT-5.6 Luna, SuperGrok 4.6, Gemini 3.0 Pro with local fallback. (`model-router.server.ts`)
- [x] 1-Command Restaurant & Menu Onboarding with realistic dish photography. (`master-ai-runtime.ts`, `ceo.tsx`)
- [x] 1-Command Rider Onboarding with KYC verification. (`master-ai-runtime.ts`, `ceo.tsx`)
- [x] Autonomous Self-Healing & Escalation Center with turn on/off toggle. (`autonomous-ops.ts`, `ceo.tsx`)
- [x] Automated Daily, Weekly Wednesday Settlement, and Monthly Executive Reports with strict tenant isolation. (`master-ai-runtime.ts`)

## Definition of Done

A feature is only marked complete after:
1. Implementation exists in the correct repository.
2. Canonical business authority is preserved.
3. Authorization and tenant scope are enforced.
4. Failure and retry behavior are implemented.
5. Tests cover normal and adverse paths.
6. Typecheck/lint/build/tests pass where applicable.
7. LIVE/SANDBOX/SIMULATED behavior is explicitly verified.
8. Audit/evidence exists for consequential actions.
9. Deployment status is verified independently.
10. No unsupported production-readiness claim is made.
