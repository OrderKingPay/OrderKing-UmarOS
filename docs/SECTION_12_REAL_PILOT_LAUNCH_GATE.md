# Section 12 — Real Pilot → Launch Gate

## Purpose

Section 12 is the final controlled transition from a technically prepared platform to a real, limited marketplace pilot.

This document is a **gate and evidence contract**. It does not manufacture a ready status and it must never be used to bypass Sections 1–11.

## Hosting rule

- Cloudflare is the only active production hosting target for this launch.
- Vercel and Netlify are not production deployment targets.
- Existing legacy configuration may remain in source only when it preserves useful capability, but it cannot be used as launch evidence or active traffic infrastructure.

## Binary launch state

`PUBLIC_LAUNCH=OFF` by default.

Allowed states:

- `OFF` — no public launch.
- `CONTROLLED_PILOT` — explicitly selected restaurants, riders and customers only.
- `ON` — public launch after all mandatory gates pass.

There is no "99% ready" state.

## S12-01 — Section prerequisites

Before pilot activation, Sections 1–11 must each have a PASS or an explicitly approved non-P0 item that does not block the pilot.

Mandatory P0 conditions:

- baseline/data truth controls pass
- Cloudflare production path is verified
- production database/auth/RLS/secrets are verified
- enabled payment/provider integrations are real
- Customer, Partner and Rider critical flows are tested
- KingPay only exposes capabilities that are actually enabled
- Umar OS has working audit/control/approval paths
- legal/compliance operating pack is approved for the pilot model
- security/performance/E2E release checks pass

Any unresolved critical P0 failure keeps `PUBLIC_LAUNCH=OFF`.

## S12-02 — Pilot restaurant onboarding

Use real restaurants only.

For every pilot restaurant record:

- restaurant ID
- legal/business identity required by the operating model
- operating address
- menu source and effective version
- pricing/tax configuration
- service hours
- packaging/preparation commitments
- responsible contact
- agreement/consent state
- onboarding timestamp
- pilot enable/disable decision

No seeded/demo restaurant can be counted as pilot supply.

## S12-03 — Pilot rider onboarding

Use real riders only.

Record:

- rider ID
- required identity/eligibility state
- consent state
- vehicle and document state where required
- payout configuration
- service area
- availability state
- safety/incident escalation path

No invented rider capacity or fake GPS traces.

## S12-04 — Controlled real customers

Use consented real customer accounts.

Each pilot transaction must be reconstructible from:

customer → cart/order → payment → restaurant acceptance → dispatch → rider → delivery proof → settlement/refund/support.

Do not use fabricated successful-order screenshots or simulated payment confirmations.

## S12-05 — Pilot order batch

The pilot is a batch, not a single happy-path order.

Exercise at minimum:

1. normal successful order
2. payment failure/retry
3. restaurant rejection
4. rider decline/reassignment
5. address/problem case
6. cancellation
7. refund
8. customer support escalation
9. late-delivery handling
10. final financial reconciliation

Each case needs a real order/payment/dispatch/support identifier and a valid terminal state.

## S12-06 — Unit economics

Measure contribution margin, not only GMV/GOV.

For each pilot order or defined cohort calculate:

revenue
− discounts/promotions
− payment/provider costs
− rider variable cost/incentives
− refunds/credits
− variable support cost
− other directly attributable variable costs
= contribution margin

Pilot expansion remains controlled if unit economics do not meet the founder-approved threshold.

## S12-07 — Support

Operate AI-first support with accountable escalation.

Measure:

- first response time
- resolution time
- repeat contact
- refund/payment incidents
- safety/legal escalation
- root-cause categories

Payment, safety, legal and identity issues must have an accountable escalation owner.

## S12-08 — Controlled growth experiments

Every launch experiment must have:

- objective
- target cohort
- budget/cost
- start/end dates
- control/holdout when practical
- revenue impact
- contribution-margin impact
- fraud/abuse guardrail
- stop condition

Do not optimize for fake urgency, fabricated scarcity, or addictive/deceptive mechanics.

## S12-09 — Geographic expansion

Expand only after the pilot demonstrates:

- stable delivery quality
- acceptable on-time performance
- sufficient rider utilization
- acceptable support rate
- acceptable customer repeat behavior
- acceptable restaurant reliability
- acceptable contribution margin

Every new geographic cell requires an evidence-backed expansion decision.

## S12-10 — Final launch decision

Founder/release lead records a dated binary decision.

`PUBLIC_LAUNCH=ON` is permitted only when:

- all mandatory Section 1–11 P0 gates pass
- no unresolved critical incident exists
- enabled providers are healthy
- payment and settlement reconcile
- real pilot batch passes
- legal/compliance pack is approved
- support is staffed/operational
- monitoring and rollback are operational
- Cloudflare deployment and smoke evidence are current

Otherwise:

`PUBLIC_LAUNCH=OFF`.

## Evidence pack

The launch record must reference immutable evidence for:

- commit SHA
- build result
- Cloudflare project/deployment
- production branch
- smoke/E2E results
- DB/RLS/auth verification
- provider health
- payment/webhook/reconciliation evidence
- pilot order IDs
- dispatch/delivery IDs
- settlement/refund records
- support incidents
- unit economics
- legal approval
- final founder decision

## Important separation

The existence of this gate does **not** mean the platform is launch-ready.

Current repository reality must always win over this document.

A missing prerequisite stays BLOCKED until independently evidenced.
