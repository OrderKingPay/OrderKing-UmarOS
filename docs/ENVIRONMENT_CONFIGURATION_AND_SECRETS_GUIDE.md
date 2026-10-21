# OrderKing & UmarOS: Complete Environment & Secrets Specification

This document provides the definitive, zero-ambiguity specification and step-by-step setup instructions for environment variables and secrets across all OrderKing apps:
1. `orderking-customers` (Customer Ordering & SuperApp Web / PWA)
2. `orderking-partners` (Merchant Kitchen & Store Cockpit)
3. `orderking-riders` (Delivery Fleet & Telemetry Cockpit)
4. `HDmaster` (Central Command, Master AI Orchestration & Sovereign Admin)
5. `superapp-engine` (Node.js API & Automation Services)

---

## 1. Master Environment Variables Matrix

| Variable Name | Classification | Target Scope | Purpose & Protocol |
| :--- | :--- | :--- | :--- |
| **`BETTER_AUTH_SECRET`** | **SECRET** | Server-Only | Cryptographic signing key for Better-Auth session tokens (64-character hex). |
| **`BETTER_AUTH_URL`** | **TEXT** | Server / Client | Canonical public base URL of the application for callback & CORS validation. |
| **`DATABASE_URL`** | **SECRET** | Server-Only | PostgreSQL connection pooler URI (`aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`). Contains password. |
| **`GEMINI_API_KEY`** | **SECRET** | Server-Only | Google Gemini API key for multimodal reasoning, AI auto-repair, code-engine, & voice orders. |
| **`GROK_PROJECT_ID`** | **TEXT** | Server-Only | Grok platform workspace / project identifier for gated identity validation. |
| **`OPENAI_API_KEY`** | **SECRET** | Server-Only | OpenAI API key for embeddings, semantic vector search, and fallback consensus. |
| **`RAZORPAY_KEY_ID`** | **TEXT** | Client & Server | Public identifier for Razorpay Checkout JS modal initialization. |
| **`RAZORPAY_KEY_SECRET`** | **SECRET** | Server-Only | Razorpay webhook verification and payout authorization secret. |

---

## 2. Founder Zero-Fee Direct NPCI UPI VPAs

All apps support the Founder's direct UPI settlement configuration, bypassing 2-3% payment aggregator fees and crediting 100% of order amounts directly to the founder's verified bank accounts:

| Variable Name | Classification | Default Value | Target App Deep Link |
| :--- | :--- | :--- | :--- |
| **`FOUNDER_UPI_PHONEPE`** | **TEXT** | `9395065587@ybl` | `phonepe://pay?pa=...` |
| **`FOUNDER_UPI_PAYTM`** | **TEXT** | `9395065587@pthdfc` | `paytmmp://pay?pa=...` |
| **`FOUNDER_UPI_CRED`** | **TEXT** | `9395065587@yescred` | `cred://pay?pa=...` |
| **`FOUNDER_UPI_BHIM`** | **TEXT** | `9395065587@upi` | `bhim://pay?pa=...` |
| **`FOUNDER_UPI_AMAZONPAY`** | **TEXT** | `9395065587@apl` | `amazonpay://pay?pa=...` |
| **`FOUNDER_UPI_ID`** | **TEXT** | `9395065587@ybl` | Universal Fallback UPI ID |
| **`FOUNDER_UPI_VPA`** | **TEXT** | `9395065587@ybl` | Universal Fallback BharatQR VPA |

---

## 3. Platform Setup Instructions

### A. Cloudflare Pages Deployment

In Cloudflare Pages, configuration is separated into **Encrypted Secrets** and **Plaintext Environment Variables**:

#### 1. Encrypted Secrets (Run once via Wrangler or Dashboard)
Run the following commands in terminal for each project:

```bash
# For Customer App:
npx wrangler pages secret put BETTER_AUTH_SECRET --project-name=orderking-customers
npx wrangler pages secret put DATABASE_URL --project-name=orderking-customers
npx wrangler pages secret put GEMINI_API_KEY --project-name=orderking-customers
npx wrangler pages secret put OPENAI_API_KEY --project-name=orderking-customers
npx wrangler pages secret put RAZORPAY_KEY_SECRET --project-name=orderking-customers

# For Partner App:
npx wrangler pages secret put BETTER_AUTH_SECRET --project-name=orderking-partners
npx wrangler pages secret put DATABASE_URL --project-name=orderking-partners
npx wrangler pages secret put GEMINI_API_KEY --project-name=orderking-partners
npx wrangler pages secret put OPENAI_API_KEY --project-name=orderking-partners
npx wrangler pages secret put RAZORPAY_KEY_SECRET --project-name=orderking-partners

# For Rider App:
npx wrangler pages secret put BETTER_AUTH_SECRET --project-name=orderking-riders
npx wrangler pages secret put DATABASE_URL --project-name=orderking-riders
npx wrangler pages secret put GEMINI_API_KEY --project-name=orderking-riders
npx wrangler pages secret put OPENAI_API_KEY --project-name=orderking-riders
npx wrangler pages secret put RAZORPAY_KEY_SECRET --project-name=orderking-riders

# For HDmaster (Admin App):
npx wrangler pages secret put BETTER_AUTH_SECRET --project-name=orderking-hdmaster
npx wrangler pages secret put DATABASE_URL --project-name=orderking-hdmaster
npx wrangler pages secret put GEMINI_API_KEY --project-name=orderking-hdmaster
npx wrangler pages secret put OPENAI_API_KEY --project-name=orderking-hdmaster
npx wrangler pages secret put RAZORPAY_KEY_SECRET --project-name=orderking-hdmaster
```

#### 2. Plaintext Environment Variables (Cloudflare Dashboard)
Navigate to **Pages Project > Settings > Environment Variables** and add under both **Production** and **Preview**:
- `NODE_ENV` = `production`
- `VITE_AUTH_ENABLED` = `true`
- `BETTER_AUTH_URL` = (e.g. `https://orderkingpay.com` for customers, `https://partner.orderkingpay.com` for partners, `https://rider.orderkingpay.com` for riders, `https://admin.orderkingpay.com` for HDmaster)
- `GROK_PROJECT_ID` = `1809652e-8dad-44ba-8bfa-67bafbfb2dfd`
- `RAZORPAY_KEY_ID` = `rzp_live_xxxxxxxxxxxxxx`
- `FOUNDER_UPI_PHONEPE` = `9395065587@ybl`
- `FOUNDER_UPI_PAYTM` = `9395065587@pthdfc`
- `FOUNDER_UPI_CRED` = `9395065587@yescred`
- `FOUNDER_UPI_BHIM` = `9395065587@upi`
- `FOUNDER_UPI_AMAZONPAY` = `9395065587@apl`
- `FOUNDER_UPI_ID` = `9395065587@ybl`
- `FOUNDER_UPI_VPA` = `9395065587@ybl`

---

### B. Vercel Deployment

In Vercel, navigate to **Project Settings > Environment Variables**:

1. **Sensitive Variables (Check "Sensitive / Encrypted")**:
   - `BETTER_AUTH_SECRET`
   - `DATABASE_URL`
   - `GEMINI_API_KEY`
   - `OPENAI_API_KEY`
   - `RAZORPAY_KEY_SECRET`

2. **Plain Environment Variables**:
   - `BETTER_AUTH_URL`
   - `GROK_PROJECT_ID`
   - `RAZORPAY_KEY_ID`
   - `FOUNDER_UPI_PHONEPE`
   - `FOUNDER_UPI_PAYTM`
   - `FOUNDER_UPI_CRED`
   - `FOUNDER_UPI_BHIM`
   - `FOUNDER_UPI_AMAZONPAY`
   - `FOUNDER_UPI_ID`
   - `FOUNDER_UPI_VPA`

---

### C. Self-Hosted Server / SuperApp Engine (`server.js`)

For Node.js / Docker / VPS deployments, populate `.env` in the root or container environment:

```env
PORT=3000
NODE_ENV=production

# Core Database & Auth
DATABASE_URL=postgresql://user:password@host:6543/postgres
BETTER_AUTH_SECRET=your_64_character_secret_here
BETTER_AUTH_URL=https://orderkingpay.com
GROK_PROJECT_ID=1809652e-8dad-44ba-8bfa-67bafbfb2dfd

# AI Engines
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Payment Gateways
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_here

# Founder 0% Fee Direct UPI VPAs
FOUNDER_UPI_PHONEPE=9395065587@ybl
FOUNDER_UPI_PAYTM=9395065587@pthdfc
FOUNDER_UPI_CRED=9395065587@yescred
FOUNDER_UPI_BHIM=9395065587@upi
FOUNDER_UPI_AMAZONPAY=9395065587@apl
FOUNDER_UPI_ID=9395065587@ybl
FOUNDER_UPI_VPA=9395065587@ybl
FOUNDER_WHATSAPP_NUMBER=919864000000
```

---

## 4. Git Security & Leak Prevention Audit

1. **Untracked Sensitive Files**:
   - `HDmaster/.env` has been removed from git tracking (`git rm --cached`).
   - `HDmaster/secrets.json` has been removed from git tracking (`git rm --cached`).
   - `orderking-customers/add_envs.cjs` has been removed from git tracking (`git rm --cached`).
   - All `.next` build caches have been untracked and ignored.
2. **Hardened `.gitignore`**:
   - `**/.env` and `**/.env.*` (excluding `.env.example`) are strictly ignored.
   - `secrets.json`, `**/secrets.json`, `secrets-*.json`, `**/secrets-*.json` are strictly ignored.
   - `dist/`, `.output/`, `.next/`, `**/.next/`, `.wrangler/`, `**/.wrangler/` are strictly ignored.
3. **Bundle Scan Verification**:
   - Client build outputs never embed server secrets. Client bundles only receive public variables like `RAZORPAY_KEY_ID`, `BETTER_AUTH_URL`, and the Founder UPI VPAs.
