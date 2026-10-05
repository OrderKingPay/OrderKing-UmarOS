# Section 9 — Umar OS control contract

## Source-of-truth rule

Umar OS may aggregate verified state, but it must not invent state. Every production indicator needs a source, timestamp, freshness policy and drill-down evidence.

## Required control families

### Capability switches
- `PUBLIC_LAUNCH`: OFF | CONTROLLED_PILOT | ON
- `FOOD_ORDERING`: OFF | PILOT | ON
- `KINGPAY_MERCHANT_COLLECTION`: OFF | SANDBOX | ON
- `KINGPAY_CONSUMER_UPI`: OFF | PENDING_APPROVAL | ON
- `VIP_SUBSCRIPTION`: OFF | EXPERIMENT | ON
- `TASK_MARKETPLACE`: OFF | PARTNER_PILOT | ON
- `AFFILIATE_SERVICES`: OFF | PARTNER_PILOT | ON
- `CRYPTO_PAYMENTS`: OFF until real provider/compliance evidence exists.

Every switch needs: owner, prerequisites, expiry where relevant, audit event, rollback state and safe-failure behavior.

## Founder overrides

Overrides may pause, degrade or route work. They may not:
- create fake payments or balances;
- bypass RLS/RBAC;
- mark an unpaid order as paid;
- bypass legal approval;
- fabricate provider health;
- delete audit evidence;
- disable required safety controls.

Every override records actor, reason, scope, start time, expiry and resulting state.

## AI workforce

Each AI role must emit provider/model/version/tool/evidence metadata and a confidence or policy disposition. High-impact actions require human approval.

Initial policy-bound roles:
support, partner coaching, rider operations, dispatch analysis, reconciliation, fraud triage, growth analysis, release evidence and incident summarization.

## Finance cockpit

Authoritative KPIs must drill into reconciled records. GOV/GMV alone is never sufficient for a scale decision.

Minimum views:
revenue, discounts, provider fees, rider cost, refunds, support cost, contribution margin, settlement exceptions, payment failures and outstanding liabilities.

## Release cockpit

Umar OS must show GitHub commit/PR, CI status, Cloudflare deployment, smoke status, provider health and rollback readiness as separate evidence-backed signals.

## Gate

Until Sections 1–11 are evidenced, Umar OS must keep `PUBLIC_LAUNCH` OFF.
