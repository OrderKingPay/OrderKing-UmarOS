# Section 11 — Release Test Matrix

## P0 release checks
- frozen-lockfile install
- typecheck across all five apps
- build across all five apps
- lint/tests where defined
- production truth gate
- authentication/session tests
- authorization/IDOR/tenant isolation
- RLS behavior for exposed tables
- payment signature + provider capture verification
- duplicate webhook/idempotency
- refund/reconciliation
- GPS stale/impossible/off-duty rejection
- customer search/catalog/cart/checkout/support
- partner order accept/reject/prepare/settlement
- rider online/offer/pickup/delivery/proof
- Umar OS feature switch/audit/incident flows

## Low-network
Test slow 3G, intermittent disconnect, reconnect, cached shell and low-end device behavior.

Financial actions must never be presented as successful while offline.

## E2E
Customer: signup → search → menu → cart → checkout → payment → order → dispatch → tracking → delivery.
Partner: login → order → accept → prepare → ready → handoff → settlement.
Rider: login → online → offer → accept → pickup → location → delivery → proof.
KingPay: verify disabled/unconfigured capabilities do not simulate balances or payment success.
Umar OS: login → authorization → feature switch → audit → provider health.

Every P0 result is UNVERIFIED until a timestamped command/browser run and artifact are recorded.
