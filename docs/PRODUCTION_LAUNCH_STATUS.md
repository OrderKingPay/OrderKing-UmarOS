# OrderKing production launch status

## Current truth

- Hosting target: **Cloudflare only**.
- Customer App: **Antigravity-managed; do not overwrite its active work**.
- Public launch: **OFF**.
- Real marketplace supply: not yet activated.
- Supabase project: healthy, but organization/workspace remain `SIMULATED`.
- Live payment/provider evidence: not complete.
- Legal/counsel approval: not complete.
- Runtime five-app smoke evidence: not complete.

## Section gates

| Section | Status | Main blocker |
|---|---|---|
| 01 | BLOCKED | credential rotation + final truth baseline |
| 02 | BLOCKED | Cloudflare dashboard branch/deployment/smoke evidence |
| 03 | BLOCKED | RLS policy model, auth/RBAC, secret rotation and database activation |
| 04 | BLOCKED | real provider accounts/configuration/webhooks |
| 05 | IN PROGRESS / Antigravity | Customer work must finish and be independently tested |
| 06 | BLOCKED | real restaurant workflow and settlement evidence |
| 07 | BLOCKED | historical rider /login 500 requires deployed retest; real dispatch cohort |
| 08 | BLOCKED | real merchant collection/webhook/reconciliation/provider evidence |
| 09 | BLOCKED | verified cross-system control telemetry |
| 10 | BLOCKED | entity/counsel-approved contracts, privacy and grievance pack |
| 11 | BLOCKED | runtime E2E, low-network, security and recovery evidence |
| 12 | BLOCKED | Sections 1–11 prerequisites + controlled real pilot |

## Work completed on hardening branch

- Cloudflare Nitro preset for HDmaster fixed.
- Cloudflare Nitro preset for Apps-integration fixed.
- Cloudflare Pages configuration added for those two apps.
- CI moved to pinned pnpm 12.8.1 and Node 22.
- Customer/Partner/Rider database layers fail closed instead of returning empty fake results.
- Razorpay placeholder credential fallbacks removed from Customer/Partner payment code.
- Fabricated crypto payment/address/verification path disabled.
- Automated production policy gate added.
- Umar OS, provider, legal, security and pilot gates documented.

## Rule

Nothing in this document is a readiness claim. The current system remains BLOCKED until primary evidence proves each gate.
