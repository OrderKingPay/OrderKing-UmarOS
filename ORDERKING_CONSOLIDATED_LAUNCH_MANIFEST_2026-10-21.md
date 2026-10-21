# ORDERKING — CONSOLIDATED TRUTH & LAUNCH MANIFEST
Audit: 21 October 2026 (IST) | Local repository: C:\Users\hasan\OrderKing
Rule: This manifest records evidence, not marketing claims. NO-GO until all mandatory launch gates pass.

## 1. Verified inventory
- Core apps: HDmaster / Umar OS, orderking-customers, orderking-partners, orderking-riders; integrations and shared packages remain in place.
- Local Git HEAD inspected: 5dfb4c78. Local changes from payment safety patches existed before this audit; preserve them, review diff and commit only after tests.
- HTTP HEAD checks returned 200 on root, partner, rider (redirect /login), and admin URLs in the prior inspection. This proves reachability, not readiness.
- Targeted tests: 39/39 passed before safety edits; Customer TypeScript failed with 7 errors before safety edits. Post-patch tests/build and exact-deployment verification still required.
- C: drive: 17.64 GB free before cleanup, 20.36 GB after deleting ONLY the regenerable root .turbo cache (2.71 GB reclaimed).
- IMPORTANT: 249 .turbo cache files had been tracked by Git despite ignore rules. Their removal currently appears as 249 tracked deletions; no commit, stage, push or deployment was performed. Resolve this generated-artifact tracking on a reviewed cleanup commit before release.
- Potential key files GEMINI_API_KEY.txt and RAZORPAY_KEY.txt were moved unmodified from Git root to %LOCALAPPDATA%\OrderKingPrivate; ignore rules added. These files may still contain plaintext secrets. Do not expose, commit or publish them.
- Root .env contains FOUNDER_UPI_ID and Razorpay key entries; actual functioning payment/settlement is NOT verified. Root GEMINI_API_KEY is present as a name but has no usable value. Remote hosting secret status unknown.
- Connected Resend account: no sending domains found; outbound branded transactional email is not ready.

## 2. Blockers: NEVER display fake customer success
P0 SECURITY/PAYMENTS
- Courier server previously generated order_sim_*, bypassed genuine online-payment verification, and marked online parcels paid; local defensive edits now throw for unverified online payments. DO NOT deploy without post-edit tests and peer review.
- Never fabricate UPI settlement, payment verification, PNR, bank transfer, refund or payout; use gateway server order creation, webhook signature/capture verification, idempotency, persisted evidence and audit trail.
- A utility-bill checkout displays hardcoded UPI recipient and QR-like payment entry. Do not present it as successful BBPS/biller settlement without authorized provider confirmation.

P0 PARTNER ONBOARDING/COMPLIANCE
- orderking-partners/src/lib/server/autonomous-onboarding.ts labels arbitrary correctly formatted FSSAI / GSTIN numbers as ACTIVE, and invents FSSAI expiry 2030-01-01. Treat this as a critical false-verification path. Replace with official/licensed verification or PENDING_MANUAL_REVIEW; NEVER auto-approve on regex.
- Verify legal owner, documents, service zone, real menu/inventory, accepted commission, hours, bank/payout data, before restaurant marked bookable.

P0 RIDERS AND ACTUAL ORDERS
- Verify rider sign-up, bank/KYC permissioned review, operating zone, online/offline heartbeat, dispatch assignment, acceptance, pickup/drop OTP, proof of delivery, earnings, cancellation and reconciliation.
- In a zone with zero live partners/riders, show honest unavailability and other actually available services; never create phantom listings/jobs/orders.

P1 OTHER FEATURES
- Jobs: static REAL_TIME_JOB_CATALOG has relative date labels and generic employer career links; do not call these live verified vacancies. Use live feed with timestamp/expiry validation or neutral curated links.
- Travel: supplier credentials/contracts required. Hide purchase paths without true fares, capacity, ticketing and provider confirmation.
- AI: use configured server-side Gemini/OpenAI providers with failure states; don't simulate successful answers. Verify API key placement per deployed app, not just local environment.
- Resend: verify sending domain/DNS, sender identity, recipient opt-in and delivery, bounce/webhook handling before email blasts.
- KingPay/UPI: preserve existing genuine integrations; no invented wallet balances or payment successes.

## 3. Consolidation and cleanup policy
KEEP: source code, migrations, Git history, financial records, settlement evidence, uploaded documents, configuration references, tests, actual production logs needed for audit. Never remove unknown files, accounts or customer data.
SAFE TO CLEAN after idle-process check: regenerable .turbo build cache, compiled dist, disposable temp/preview caches where sources exist. Preserve node_modules until lockfile/build reproducibility is verified. Back up before any structural consolidation.
ONE SOURCE OF TRUTH: this manifest is the release checklist. Older reports are evidence archives, not permission to delete working modules. Deduplicate only after code-level import usage and test coverage prove equivalence.
CREDENTIALS: no secret values in Git or logs; ensure .gitignore, use scoped hosting secrets, rotate any previously exposed keys.

## 4. Minimal revenue-first launch sequence and specialist gates
1. Security/compliance specialist: isolate production DB, validate identity/authorization, block simulated payment and false FSSAI/GST status.
2. Backend/integration specialist: production webhook + COD, restaurant onboarding, real order persistence and zone eligibility.
3. Dispatch/ops specialist: real rider onboarding, assignment/acceptance, delivery completion and transparent payout logic.
4. QA/SRE specialist: customer/partner/rider/admin end-to-end tests, failed-payment, idempotency, refunds, rollback; clean typecheck/build.
5. Release specialist: deploy only exact reviewed commit; verify route, login, first genuine opt-in test order from all three roles, DB write, notifications and reconciliation. Canary release by verified zone only.

## 5. GO / NO-GO record
Current: NO-GO.
Customer onboarding: NOT VERIFIED.
Partner statutory compliance: FAIL (fake verification).
Rider onboarding and dispatch: NOT VERIFIED.
Courier online payments: FAIL / LOCAL BLOCK, NOT RE-TESTED.
UPI/utility bills: NOT VERIFIED; NO SETTLEMENT PROOF.
Gemini: ROOT KEY BLANK; production unknown.
Resend: NO VERIFIED DOMAIN.
Build/typecheck after fixes: NOT VERIFIED.
Real money, order fulfilment, payouts: NOT VERIFIED.
Approval gate: founder reviews evidence and rollback plan before any launch or destructive cleanup.

## 6. ANTIGRAVITY EXECUTION HANDOFF — 21 October 2026, 16:13 IST
Directive: STOP adding features. Preserve current code, verified providers, configurations and all user/business data. Assign actual accountable security, finance/compliance, backend, mobile UX, database, QA and release reviews; do not claim verified specialists without evidence.

PRIORITY P0: Complete the existing transaction loop before cosmetic tasks: restaurant application and documented legal approval -> real catalog and hours/zone -> customer genuine order -> merchant acceptance -> verified rider assignment/acceptance -> pickup/delivery evidence -> receipt -> COD reconciliation or gateway-verified settlement -> refund/payout ledger. If an external approval is unavailable, show honestly pending/unavailable instead of fake success.
P0 COMPLIANCE PATCH: In orderking-partners/src/lib/server/autonomous-onboarding.ts, removed fake local FSSAI/GST registries and invented ACTIVE status/expiry. Format-valid unverified numbers now return PENDING_VERIFICATION; malformed numbers rejected. Existing 11 focused tests updated and passed 11/11 after modification. This module is currently referenced only by its own tests; integrating it into the production onboarding API is NOT verified. Do not mistake this for a live statutory verification provider.
P0 PAYMENT: Local courier online checkout is intentionally fail-closed, pending legitimate Razorpay server order, signature and payment capture verification. Do not remove the guard to make tests green.
P0 SECRETS: HDmaster/.env, HDmaster/secrets.json and orderking-customers/add_envs.cjs are staged for Git index removal but remain on disk at inspection; verify secrets were not exposed in existing Git history, rotate if exposed, and set valid production hosted secrets without logging values.
P0 TEST TRUTH: The legacy partner tests formerly passed fabricated registry approvals. The newly amended checks require pending status and reject invented proof. Avoid running tests against live financial/customer databases.
P0 RELEASE: Before deploying, pass typecheck, relevant non-destructive tests, build, authentication/authorization, provider/webhook checks, working all-role end-to-end flows. Verify exact deployed commit and all live URLs, evidence and rollback. No claim of completed launch if any gate is missing.
P1 USER EXPERIENCE: Consolidate existing functionality only. Customer actions must be straightforward; merchant/rider controls actionable only when backend works. No slogans, false sales offers, phantom jobs, duplicated routes or fake success text.
P1 RESOURCE SAVING: Don't spawn pointless waiting processes or repeatedly rebuild without changed inputs. Keep RAM and disk free by cleaning verified regenerable caches only, never source, credentials, logs needed for finance, or business records.
Support policy: Use existing specialist agents efficiently; send owner only a precise blocker requiring external approval/access. Avoid paid browser automation/TinyFish when local code or verified connectors suffice.
