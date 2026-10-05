# Section 11 — Security / Performance / Low-Network / E2E Test Matrix

STATUS: NOT YET PASSED. This file defines release evidence; passing requires test output.

## Security
- secret scan: no production credential in tracked source
- dependency audit: no unresolved critical/high launch blocker
- auth lifecycle: signup/login/logout/recovery/session expiry
- authorization isolation across customer, partner, rider and founder roles
- RLS/grant allow/deny tests
- IDOR tests on order, dispatch, support, settlement and address identifiers
- webhook signature and replay tests
- rate-limit tests
- secure-cookie/CORS/SameSite checks
- audit-log integrity and privileged-action traceability

## Performance budgets
Measure P50/P95/P99 where practical for initial route, TTFB, LCP, INP, CLS, JS/image bytes, search, checkout preparation, order status update, rider GPS ingestion and dispatch assignment.
Targets are OrderKing engineering targets, not claims about private competitor internals.

## Low-network matrix
- slow 3G
- unstable connection
- intermittent disconnect/reconnect
- cached app shell
- cart reconciliation
- duplicate-tap protection
- duplicate-submit protection
- delayed payment callback
- delayed rider GPS
- image fallback

## Five-app smoke
Customer: home -> search -> menu -> cart.
Partner: login -> kitchen -> accept/reject.
Rider: login -> online -> offer -> accept -> GPS.
Umar OS: login -> health dashboard -> permissions.
Integration: provider health -> failure state.
Historical regression: orderking-riders.pages.dev/login HTTP 500 must be retested before Section 2/7 can pass.

## E2E release path
customer auth -> real restaurant -> real menu -> cart -> server price -> payment intent -> provider confirmation -> webhook -> restaurant acceptance -> dispatch -> rider GPS -> pickup -> delivery proof -> completion -> settlement/reconciliation -> refund/cancellation/failure -> support -> audit trail

## Recovery
- database backup/restore drill
- provider outage
- duplicate payment webhook
- payment provider down
- maps down
- SMS down
- Cloudflare runtime failure
- rollback to last known-good deployment
- incident severity and owner assignment

No PASS until primary evidence is attached to the evidence ledger.