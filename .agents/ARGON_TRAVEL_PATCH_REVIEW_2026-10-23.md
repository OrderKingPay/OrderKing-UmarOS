# GEMINI 4 ARGON — ORDERKINGPAY TRAVEL PATCH REJECTED; REVISE AGAINST REAL REPO
Your orderkingpay_travel_mission_patch.md is NOT approved for wholesale application. I inspected the real Windows source at C:\Users\hasan\OrderKing.

FACTS:
- orderking-customers/src/routes/travel.tsx already has `export const Route = createFileRoute("/travel")({...})`, existing CustomerShell, real catalogue UI, provider flow and state. Your replacement exports only `TravelDiscoveryPage`: this removes the TanStack Route registration and functioning features.
- Existing route: orderking-customers/src/routes/travel/trips.tsx with its own `createFileRoute`, user-specific saved trips and recently corrected disclosures. DO NOT create routes/travel.trips.tsx as a duplicate or replace trips with discovery.
- Current _headers applies to all routes and includes DENY, strict origin, object-src none, base-uri self, form-action, payments/Turnstile CSP. Your /travel* wholesale CSP is unsafe/incomplete and may break existing scripts.
- `const [trackingConsent,...]=useState(true)` is NOT informed consent; default false or use independently recorded valid consent.
- `VITE_TP_APPROVED_PROGRAMS=aviasales` and sample `VITE_TP_LINK_AVIASALES=https://www.aviasales.com/?market=in&marker=589554` DO NOT prove approval; never ship preapproved program lists or fabricate attribution. Only official dashboard-generated deep links and generated widget IDs/codes, with confirmed connection.
- Never modify a generated *.tp.st link by appending unknown query parameters; get SubID directly from Travelpayouts link generator. Travelpayouts partner ID and SubID are vendor-managed; do not forge link tracking.
- Generic supplier homepage links are NOT verified ticket inventory/affiliate partnerships; label transparently. Aviasales metasearch is not necessarily the payment merchant.
- Widget/script `onload` does not prove a usable search, actual partner prices, conversions or customer ticket issuance.
- 10/10 Node isolated tests are only proposal-level mocks; NO proof of successful monorepo TypeScript compilation, production Cloudflare behavior or supplier authorization.
- Exact live accounts, White Label wl_id and program approvals are UNVERIFIED. Never invent them. Preserve Travelpayouts Drive sitewide loader already in production.
- Existing local uncommitted work (especially HDmaster/src/lib/orderking/kingpay/compliance-flags.ts and customer travel anti-mock fixes) must remain intact. There is an unrelated DRAFT GitHub PR #45 for intermittent Cloudflare 1101; do not merge/deploy it as part of travel.

YOUR TASK NOW: Return ONLY a narrow additive, reviewable corrected unified diff, preserving both `Route` exports and /travel/trips, safely placing Travelpayouts official White Label Widget in current /travel layout ONLY after its owner-generated code and proper consent are provided. Add a supported official-provider link fallback, strict approval gating, no invented rates/PNR/confirmed ticket, and no blanket security-header replacement. Show a precise list of existing lines/files that change and explain why. The widget must not automatically imply in-app booking. Check compatibility with React/TanStack SSR and script dedup; include a verified CSP diff LIMITED TO NECESSARY DIRECTIVES and a rollback plan.

VALIDATE ON REAL REPO, NOT CANVAS: after implementation run `pnpm --dir orderking-customers exec vitest run <relevant test paths>`, `pnpm --dir orderking-customers run typecheck`, and `pnpm --dir orderking-customers run build`; report exact results. Gemini web cannot run these on the Windows repo; if no FS access, provide patches explicitly marked NOT APPLIED. Do not fabricate successful tests, approval, affiliate earnings or public readiness. No commit/push/deploy.
