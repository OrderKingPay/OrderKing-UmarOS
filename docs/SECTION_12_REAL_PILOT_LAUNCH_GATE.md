# Section 12 — Real Pilot → Launch Gate

Current state:
- PUBLIC_LAUNCH=OFF
- CONTROLLED_PILOT=OFF

## Required real pilot
1. verified real restaurant
2. verified real rider
3. consented real customer cohort
4. real supported payment method
5. real dispatch and GPS
6. complete order trace

## Required pilot cases
- normal success
- payment failure/retry
- restaurant reject
- rider decline/reassignment
- address issue
- cancellation
- refund
- late delivery/support
- duplicate request
- final reconciliation

## Payment gate
A browser callback is never payment proof. Require provider-side capture, server-side signature verification, webhook verification, idempotency and ledger reconciliation.

## Final public launch
PUBLIC_LAUNCH may be ON only after all mandatory Section 1–11 P0 gates pass, no critical incident is open, real providers are healthy, the controlled pilot passes, the legal pack is approved, monitoring/rollback are operational and the founder/release owner records a dated PASS.

Otherwise remain OFF.
