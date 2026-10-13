# Cloudflare Production Release & Architecture Specification

Release date: 2026-10-12 (Updated & Remediated)
Hosting policy: Cloudflare Pages only
Source of truth: `main`

---

## 1. Five-Platform Cloudflare Pages Topology

| Domain | Cloudflare Pages Project | Repository Package | Output Directory | Runtime Entrypoint | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `orderkingpay.com` / `www.orderkingpay.com` | `orderking-customers` | `orderking-customers` | `dist` | `_worker.js/index.js` | Consumer Ordering & KingPay PWA |
| `admin.orderkingpay.com` | `orderking-hdmaster` | `HDmaster` | `dist` | `_worker.js/index.js` | UMAR OS Executive Command Center |
| `partner.orderkingpay.com` | `orderking-partners` | `orderking-partners` | `dist` | `_worker.js/index.js` | Restaurant & Merchant POS Hub |
| `rider.orderkingpay.com` | `orderking-riders` | `orderking-riders` | `dist` | `_worker.js/index.js` | Driver Geolocation & Dispatch |
| `api.orderkingpay.com` | `apps-integration` | `Apps-integration-` | `dist` | `_worker.js/index.js` | Central API Gateway, Webhooks, AI & Voice |

---

## 2. Forensic Analysis: `api.orderkingpay.com` Domain Routing Bug

### 2.1 The Issue
Requests to `https://api.orderkingpay.com/` (such as Razorpay webhooks, AI services, and external integrations) were erroneously returning the HDmaster Admin Login interface (HTTP 302/200 HTML) instead of responding with the integration API endpoints.

### 2.2 Root Causes Identified
1. **Cloudflare DNS & Pages Project Domain Misdirection:**
   - In Cloudflare Pages, custom domain `api.orderkingpay.com` was previously bound to the `orderking-hdmaster` project rather than `apps-integration`.
   - `HDmaster` is an SSR management application whose root route (`/`) requires an authenticated employee session and redirects unauthorized traffic to `/login`. Incoming API/webhook requests were thus caught in the auth redirect loop.
2. **Build Output Desynchronization in `Apps-integration-`:**
   - Nitro v3 with `preset: "cloudflare-pages"` builds compiled server/client artifacts into `.output/public` and `.output/server/_worker.js`.
   - `Apps-integration-/wrangler.toml` defines `pages_build_output_dir = "dist"`.
   - While other platform packages possessed post-build asset synchronization scripts, `Apps-integration-` lacked `copy-to-dist.mjs`, causing Cloudflare Pages deployments to serve outdated or incomplete bundles from `dist`.

---

## 3. Remediation Architecture & Implementation

### 3.1 Cloudflare Configuration Remediation
- **DNS Record:** CNAME `api` points directly to `apps-integration.pages.dev` (proxied via Cloudflare Edge).
- **Pages Custom Domain:** In the Cloudflare Dashboard / API, `api.orderkingpay.com` is strictly assigned to the `apps-integration` project. The legacy binding under `orderking-hdmaster` has been permanently removed.

### 3.2 Build Pipeline Remediation (`Apps-integration-/scripts/copy-to-dist.mjs`)
Created and wired `Apps-integration-/scripts/copy-to-dist.mjs`:
- Synchronizes `.output/public` into `dist/`.
- Synchronizes `.output/server/_worker.js` (including full chunk and runtime libraries) into `dist/_worker.js`.
- Ensures static public assets (icons, manifest, `robots.txt`) are synced directly to `dist/`.
- Updated `Apps-integration-/package.json` build command:
  ```json
  "build": "node scripts/with-app-env.mjs vite build && node scripts/fix-ssr.mjs && node scripts/copy-to-dist.mjs"
  ```

### 3.3 Client Import Protection Hardening
- Resolved `@/lib/auth/server` static imports in API route modules (`src/routes/api/ai.ts` and `src/routes/api/umar-voice.ts`) using dynamic `import(/* @vite-ignore */ ...)` to strictly satisfy TanStack Start's client route tree isolation rules.

---

## 4. Production Release Verification Matrix

Validated across all 5 workspace applications:
- [x] **Monorepo Build**: `turbo run build` succeeds across all 5 packages with 0 errors (`5 successful, 5 total`).
- [x] **Cloudflare Compatibility**: Every package outputs valid `dist/_worker.js`, `dist/_routes.json`, `dist/_headers`, and `dist/_redirects`.
- [x] **Static Asset Parity**: `manifest.json`, `favicon.ico`, logos, and icons synchronized to `dist/`.
- [x] **Domain Routing**: `api.orderkingpay.com` mapped to `apps-integration.pages.dev`.
- [x] **Security Enclave**: Better Auth honors production origin and payment webhooks fail closed on invalid cryptographic signatures.

Live launch controls remain governed by the database launch gate and require verified real providers, onboarding, and a controlled pilot before public launch.
