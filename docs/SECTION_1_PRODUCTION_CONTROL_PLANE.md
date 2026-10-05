# Section 1 — Production Control Plane & Truth Lock

## Scope
This section establishes the single source of truth for the five application surfaces and the rule that future/unavailable features are hidden or disabled—not destroyed.

## Current five surfaces confirmed in the monorepo
1. HDmaster / Umar OS — founder control and orchestration
2. OrderKing Customer — customer ordering
3. OrderKing Partner — restaurant operations
4. OrderKing Rider — delivery operations
5. Apps-integration- — external integrations / KingPay boundary

Workspace confirmation: `pnpm-workspace.yaml` contains exactly these five application packages plus shared packages.

## Current deployment reality found
- Customer, Partner and Rider Vite configs currently use Nitro `cloudflare-pages`.
- HDmaster is part of the same Cloudflare-oriented architecture.
- Apps-integration- currently uses Nitro `netlify` preset and MUST be moved to Cloudflare in a later controlled deployment section.
- Repository history contains Vercel/Netlify/Cloudflare transitions. Those historical paths must not be treated as active production truth.
- Existing deployment reports contain conflicting historical claims. The live environment must be re-verified from the exact current commit before launch.

## Current integration truth
The code contains real provider boundaries for services including:
- OpenAI/other AI providers
- Razorpay
- Stripe
- Amadeus
- IRCTC/rail boundary
- Mapbox
- Supabase/Postgres
- object storage

Credentials and provider contracts are not globally proven live. Missing credentials MUST remain a blocked/disabled state rather than a simulated success.

## Data-mode rules
### LIVE
Only authoritative production database/provider data. Customer-facing success is allowed.

### STAGING
Real provider sandbox/test accounts and clearly isolated test records. Never mix with production data.

### DEMO / FIXTURE
May exist for design/development/testing, but never appear as live customer, restaurant, rider, payment, payout or dispatch activity.

### BLOCKED
Feature exists in code but required provider/credential/contract is unavailable. UI must explain "Not available yet" or hide the capability according to the Umar OS feature-switch policy.

## No-delete policy
Nothing useful is deleted in Section 1.
- Existing future integrations remain.
- Existing legacy deployment config remains preserved.
- Simulation/test fixtures remain available for development tests.
- Customer-facing production must not expose simulation records.
- Every optional capability receives an explicit enable/disable/provider-status control later in Umar OS.

## Founder-control requirements
Umar OS will become the authoritative control plane for:
- feature availability
- environment/data mode
- provider connection status
- credential/configuration status
- onboarding gates
- payment gates
- dispatch gates
- safety/legal acknowledgements
- audit events
- launch readiness

## Legal boundary
The platform should be structured as a marketplace/technology intermediary where legally applicable, with separate merchant and rider contracts, clear allocation of obligations, indemnity provisions, insurance requirements where appropriate, grievance/refund processes, and transparent platform terms. Contracts cannot lawfully eliminate every potential liability of the founder/company.

## Section 1 acceptance gate
Section 1 is complete when:
- repository/application inventory is frozen,
- current deployment truth is recorded,
- active hosting is explicitly Cloudflare-only,
- fake/live/staging/blocked modes are defined,
- no-delete policy is encoded,
- all five applications have identified production boundaries,
- subsequent work has an explicit 12-section execution order.

## Evidence baseline
Repository: OrderKingPay/OrderKing-UmarOS
Current observed latest commit at audit time: `0e097d610931bf2e3f207aa86b5490832af293c2`
Audit branch: `audit/section-1-production-lock`
