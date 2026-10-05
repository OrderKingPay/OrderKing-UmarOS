# Section 11 — Release Test Matrix

## Current gate policy

A green typecheck/build is not sufficient for launch. The release gate must cover code, security, data, payments, deployment, low-network behavior and end-to-end marketplace flow.

## P0 tests

### Build / type safety
- root workspace install with frozen lockfile
- typecheck across all five apps
- production build across all five apps
- lint where defined
- app tests where defined

### Truth / configuration
- all five Wrangler project names match intended Cloudflare Pages projects
- all five output directories are dist
- production runtime marker is present
- no active Vercel/Netlify auth/deployment fallback
- no test Razorpay credential fallback
- production DB fails closed when DATABASE_URL is missing
- KingPay unavailable capabilities remain explicitly disabled

### Authentication / authorization
- customer login/session/logout/recovery
- partner login/session/restaurant membership
- rider login/session/identity state
- Umar OS privileged login
- tenant isolation
- IDOR checks
- privilege escalation attempts
- expired/invalid session checks

### Database / RLS
- core marketplace ownership checks
- RLS policy behavior for every exposed table
- sensitive datasets denied to anon/authenticated browser roles
- payment/ledger mutation authorization
- audit mutation attribution

### Payments
- provider order creation
- signature verification
- provider capture verification
- payment-order mismatch rejection
- duplicate webhook rejection/idempotency
- refund state
- reconciliation
- no browser-only success path

### Rider / GPS
- permission denial
- stale timestamp rejection
- impossible movement rejection
- off-duty rejection
- delivery ownership rejection
- valid live ping persistence
- reconnect behavior

### Customer
- search
- restaurant/menu availability
- quote calculation
- cart idempotency
- checkout
- COD
- online payment
- payment failure/retry
- tracking
- cancellation/refund
- support

### Partner
- onboarding
- menu changes
- order accept/reject
- preparation
- ready/handoff
- settlement ledger
- support

### Dispatch
- rider eligibility
- assignment
- reassignment
- cancellation
- ETA calculation
- late-order handling
- customer notification

## Low-network tests

Run on:
- slow 3G
- unstable network
- intermittent disconnect
- reconnect
- cached app shell
- low-end mobile emulation

Never queue or display financial success while offline.

## Final E2E

Customer:
signup → discovery → search → menu → cart → quote → checkout → payment → order → dispatch → tracking → delivery → receipt.

Partner:
login → restaurant → order → accept → prepare → ready → rider handoff → settlement.

Rider:
login → online → offer → accept → pickup → live location → delivery → proof → earnings.

KingPay:
disabled-capability gate → truthful unavailable state. No simulated balance/payment is accepted as a pass.

Umar OS:
login → permission → feature switch → audit → health → incident.

## Evidence requirement

Each P0 result records:
- test ID
- environment
- commit SHA
- exact command or browser scenario
- result
- timestamp
- artifact/log
- reviewer
- blocker if failed

A missing test is UNVERIFIED, not PASS.
