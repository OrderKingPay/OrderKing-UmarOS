# OrderKing / Umar OS — Pre-Deployment Truth Gate

Generated from the connected GitHub/Vercel state. This document is an evidence gate, not a claim of completion.

## Non-negotiable engineering rules
- Preserve existing work; no destructive migration or deletion.
- No simulated customer-facing success, ticket, payment, payout, dispatch, refund, or AI answer.
- External-provider functionality must fail closed when credentials/contracts are absent.
- A feature is GO only after build/typecheck and live-path verification.
- Production claims require deployment evidence for the exact commit.

## Product surfaces
1. HDmaster / Umar OS — central orchestration, founder controls, AI/workforce, finance and integrations.
2. OrderKing Customer — ordering, payments, travel, customer AI/support.
3. OrderKing Partner — restaurant operations, live orders, analytics and restaurant AI.
4. OrderKing Rider — dispatch/delivery workflow, live offers, tracking and rider AI.
5. KingPay / integrations — payment, settlement, external-provider boundaries.

## Verified architecture already present
- OpenAI provider plumbing exists in HDmaster and customer/partner/rider server paths.
- Partner restaurant AI reads authorized restaurant data server-side and fails closed when OpenAI is unavailable.
- Rider AI endpoint requires OPENAI_API_KEY and authenticated rider context.
- Customer AI has a real provider abstraction rather than a fake response path.
- Travel flight search uses a real Amadeus provider boundary and no dummy flight fallback.
- Train search/booking fails closed without a licensed IRCTC/Principal Service Provider integration.
- Supabase Realtime is suitable for private real-time channels and broadcast-based scalable updates; production authorization/RLS must remain enforced.

## Travel truth gate
### Flight
- Search UI and airport lookup are present.
- Live Amadeus integration is implemented.
- Complete production availability requires valid Amadeus credentials and the appropriate production/provider configuration.
- No fake fares, PNRs or booking confirmations are permitted.

### Train
- Search UI exists.
- Complete all-India live search and booking is NOT considered GO until a licensed IRCTC/authorized PSP API contract and credentials are configured.
- Do not scrape IRCTC or invent trains.

## Deployment truth gate
All four Vercel projects exist:
- hdmaster
- orderking-customers
- orderking-partners
- orderking-riders

Release builds now run TypeScript checking before application build.

## Founder-only configuration required before true business launch
- Production OpenAI API key/model configuration for every intended AI surface.
- Production payment gateway credentials/webhooks and verified merchant configuration.
- Production database/environment secrets.
- Amadeus production credentials if flight sales are enabled.
- Licensed IRCTC/authorized PSP contract + credentials for train sales.
- Map provider production token/configuration where live maps are enabled.
- SMS/email/push production credentials and verified sender/domain.
- Legal entity, tax, bank, payout/settlement and required regulatory details.
- Production domains and DNS where custom domains are desired.
- Final provider terms, pricing, refund/cancellation and customer-support policies.

## Reality statement
“Number one”, “10x/100x better”, millions of employees replaced, and guaranteed income are product goals, not verifiable engineering states. The system can be engineered toward measurable speed, reliability, automation, conversion, cost and customer-satisfaction targets, but none should be represented as guaranteed before measurement.

## Release decision
DO NOT declare global production readiness until the exact release commit has:
1. passed typecheck/build for every app,
2. passed the relevant automated tests,
3. produced READY deployments,
4. passed live smoke tests on the deployed URLs,
5. passed security/database checks,
6. verified all external-provider credentials/contracts required for enabled features.
