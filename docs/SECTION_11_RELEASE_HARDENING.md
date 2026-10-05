# Section 11 — security, performance, reliability and E2E

## Threat model

Highest-risk surfaces: authentication/session, RLS/tenant isolation, payment/webhook replay, rider GPS/privacy, admin/founder overrides, coupon/referral abuse, partner data and AI tool actions.

## Release checks

1. Frozen lockfile installation.
2. Node 22 + pinned pnpm CI.
3. Production policy gate.
4. Typecheck all five applications.
5. Build all five applications.
6. Targeted unit/state-machine tests.
7. Payment signature/idempotency tests.
8. Partner/customer/rider isolation tests.
9. Offline/online retry tests.
10. Five-app smoke tests.
11. Backup/restore drill.
12. Incident tabletop.

## Performance

Measure P50/P95 rather than promise universal latency.

Customer critical path budgets should include app-shell load, search response, menu render, cart update and checkout transition.

Use network profiles representing weak mobile connections and real device classes. Offline shell/cached content may be instant while authoritative payment/order states remain network-confirmed.

## Low-network rules

- safe user actions may optimistically update;
- payment/order confirmation must be authoritative;
- retries use idempotency keys;
- duplicate dispatch/order/payment events must converge to one state;
- cache must not turn stale availability into a fake live state.

## Incident management

Severity, owner, acknowledgement target, mitigation, rollback, evidence preservation and post-incident root cause are mandatory.

AI may summarize incidents but cannot be the sole accountable decision-maker for payment, safety, legal or security incidents.

## Current gate

Section 11 remains BLOCKED until runtime smoke/E2E, provider evidence and recovery drills are actually executed.
