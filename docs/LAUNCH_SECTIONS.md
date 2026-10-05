# OrderKing / KingPay / Umar OS — Master Section Plan

This plan is the controlled execution order. No section may declare production-ready without evidence.

## Non-negotiables
- Preserve working code and future capability; no destructive deletion.
- Do not present seeded/demo/simulated/provider-unavailable records as live.
- Keep future/unavailable features present but disabled/hidden behind explicit Umar OS feature switches.
- Production integrations fail closed when credentials/contracts are absent.
- Cloudflare is the only active hosting/deployment target for this launch program. Vercel/Netlify/GCP paths remain preserved as inactive legacy/fallback code until explicitly retired.
- Exact commit + build + deployment + smoke-test evidence is required before any "ready" claim.
- Legal agreements can allocate responsibilities and indemnities, but cannot truthfully guarantee zero founder liability; applicable law still governs.

## 12 execution sections
1. Baseline audit, architecture lock, truth/data-mode control plane
2. Cloudflare deployment, Pages/Workers/R2/DNS and domain configuration
3. Production database, authentication, RBAC, RLS, secrets and audit ledger
4. Real provider connectivity: payments, maps, messaging, AI, travel and other enabled services
5. OrderKing Customer: exact Zomato-style ordering, catalog, checkout, support, low-network UX
6. OrderKing Partner: restaurant onboarding, menus, order operations, settlement and partner AI
7. OrderKing Rider: onboarding, consent, availability, offers, dispatch, navigation, delivery proof and rider AI
8. KingPay: real merchant UPI/payment collection now; TPAP/PSP path kept as a gated future capability
9. Umar OS: founder control plane, feature switches, provider health, approvals, audit, AI workforce and finance
10. Legal/compliance operating pack: terms, privacy, partner/rider agreements, consents, grievance, refunds, safety and responsibility allocation
11. Security, performance, reliability, observability, low-bandwidth and end-to-end QA
12. Live pilot, real restaurant/rider onboarding, test orders, payment settlement, controlled launch and go-live gate

## Section completion rule
A section is complete only when its code/config/data changes are implemented, tested, documented, and independently evidenced.