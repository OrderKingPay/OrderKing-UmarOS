# Section 11 — Security / Performance / Low-Network / E2E release matrix

## Performance

Record:
- first meaningful render
- interactive readiness
- route transition latency
- search response latency
- add-to-cart response latency
- checkout readiness
- API p50/p95/p99

Test on:
- offline
- poor 2G-like throttling
- 3G-like throttling
- constrained CPU
- normal 4G
- 5G

Targets must be measured, not promised.

## Offline/PWA

Verify:
- cached app shell opens without network
- recent safe data is readable offline
- cart edits remain locally consistent
- queued safe actions reconcile after reconnect
- payment/order success is NEVER shown offline
- failed synchronization is visible and retryable

## Security

Verify:
- no secrets in client bundles
- no provider credentials in source
- RLS enabled for every public business table
- tenant isolation
- role/permission checks
- webhook signature verification
- payment idempotency
- replay protection
- audit logging
- CSRF/origin protections where applicable
- rate limiting/abuse controls
- secure headers/cookies
- backup/restore drill

## Marketplace E2E

Required real-flow tests:
customer → menu → cart → payment → restaurant → dispatch → rider → delivery → settlement → support

Required failure flows:
payment failure
restaurant rejection
rider decline/reassignment
address issue
cancellation
refund
late delivery
support escalation

## Launch evidence

Every PASS must reference:
commit SHA
test run
environment
test account/record IDs
request/order/payment IDs where applicable
failure evidence where applicable
rollback procedure

No screenshot-only PASS claims.
