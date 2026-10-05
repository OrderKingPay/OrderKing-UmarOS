# Section 12 — Real Pilot → Launch Gate

## Current state

`PUBLIC_LAUNCH=OFF`

`CONTROLLED_PILOT=OFF`

`DATA_MODE=SIMULATED`

`PAYMENTS_MODE=SANDBOX`

No state in this document overrides the live database control row.

## Binary rule

There is no "99% ready" state.

PUBLIC_LAUNCH can only become ON after all mandatory Section 1–11 P0 gates pass and a controlled real pilot passes.

## Pilot prerequisites

### Real restaurant
Must have:
- verified partner identity/onboarding
- applicable food-license/compliance information
- approved menu and prices
- operating hours
- payment/settlement configuration
- signed/accepted agreement

### Real rider
Must have:
- verified identity/eligibility
- required documents where applicable
- location consent
- payout configuration
- signed/accepted rider operating terms

### Real customer
Must have:
- authenticated account
- consent/policy acceptance
- support coverage

## Real order batch

The pilot must include:
1. successful order
2. failed payment
3. payment retry
4. restaurant rejection
5. rider decline/reassignment
6. cancellation
7. refund
8. address issue
9. late-delivery/support case
10. final reconciliation

Every case must be traceable through:
customer → order → payment → restaurant → dispatch → rider → delivery → settlement/refund → support.

## Payment gate

Required:
- real provider account/configuration
- server-side signature verification
- provider-side capture/status verification
- webhook verification
- idempotency
- duplicate webhook protection
- refund state
- reconciliation
- ledger evidence

A browser success callback alone is never payment proof.

## Dispatch/GPS gate

Required:
- real rider location permission
- authenticated location ingestion
- stale/impossible-location rejection
- active-duty/active-delivery authorization
- dispatch assignment evidence
- delivery completion evidence

No fake GPS or invented rider capacity.

## Unit economics

Measure per-order contribution margin:

revenue
− provider/payment cost
− rider variable cost/incentives
− discounts
− refunds/credits
− variable support cost
− other attributable variable cost

Do not scale using GMV/GOV alone.

## Support

Every pilot incident must have:
- owner
- timestamp
- severity
- first response
- resolution
- financial impact where relevant
- final state

## Final decision

`PUBLIC_LAUNCH=ON` only after:
- Sections 1–11 P0 gates pass
- no unresolved critical incident
- real provider health verified
- real pilot batch passes
- payment/reconciliation passes
- restaurant/rider/customer onboarding passes
- legal operating pack approved
- monitoring and rollback are operational
- founder/release owner signs the dated launch decision

Otherwise remain OFF.
