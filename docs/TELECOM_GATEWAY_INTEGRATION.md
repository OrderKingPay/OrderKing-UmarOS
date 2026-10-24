# OrderKing Rider Fleet - Indian Telecom & SMS Gateway Integration Guide

This document specifies the production configuration, failover architecture, and Cloudflare environment secrets required to dispatch authentic, high-speed One-Time Passwords (OTPs) across all Indian telecom carriers (**Reliance Jio**, **Bharti Airtel**, **Vodafone Idea / Vi**, and **BSNL**).

---

## 1. Indian Telecom Regulatory Architecture (TRAI & DLT)

In compliance with the **Telecom Regulatory Authority of India (TRAI)** New Regulatory Framework for Commercial Communications:
* All SMS traffic categorized as **Service Implicit (Transactional OTPs)** must be routed through registered **DLT (Distributed Ledger Technology)** entity IDs, sender headers (e.g. `ORDKNG`), and approved content templates.
* The OrderKing SMS dispatch engine implements automatic multi-gateway cascading with carrier-independent fallback to ensure zero rider lockouts.

---

## 2. Multi-Provider Failover Priority

The SMS dispatcher (`orderking-riders/src/lib/server/sms-gateway.ts`) automatically discovers active providers based on available environment variables and cascades down the priority chain:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Fast2SMS Quick / OTP Route (FAST2SMS_API_KEY)            │
│    • Target Latency: < 2.5s across Jio, Airtel, Vi, BSNL    │
│    • Direct API: https://www.fast2sms.com/dev/bulkV2         │
└──────────────────────────────┬──────────────────────────────┘
                               │ (on 5xx / timeout)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. 2Factor.in Direct Gateway (TWOFACTOR_API_KEY)            │
│    • Dedicated Transactional Indian SMS Pipe                │
│    • Direct API: https://2factor.in/v1/API/V1/.../AUTOGEN   │
└──────────────────────────────┬──────────────────────────────┘
                               │ (on 5xx / timeout)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. MSG91 Enterprise DLT Gateway (MSG91_AUTH_KEY)            │
│    • Approved DLT Template + Header: ORDKNG                 │
│    • Direct API: https://control.msg91.com/api/v5/otp       │
└──────────────────────────────┬──────────────────────────────┘
                               │ (on 5xx / timeout)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Twilio SMS Fallback (TWILIO_ACCOUNT_SID)                 │
│    • Global carrier fallback routing to Indian interconnects│
└──────────────────────────────┬──────────────────────────────┘
                               │ (instant manual or network failover)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Instant WhatsApp 1-Tap Deep Link Route                   │
│    • Carrier-independent, bypasses cellular SMS congestion  │
│    • Direct deep-link: https://wa.me/91{phone}?text=...     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Required Environment Variables

Configure these secrets in your production deployment environment (Cloudflare Workers, Cloudflare Pages, or container environment):

| Environment Variable | Gateway | Type | Description |
|----------------------|---------|------|-------------|
| `FAST2SMS_API_KEY` | Fast2SMS | Secret | Primary API key for Fast2SMS Quick SMS / OTP gateway |
| `FAST2SMS_ROUTE` | Fast2SMS | String | Route mode: `otp` (default, fastest) or `q` (Quick SMS) |
| `TWOFACTOR_API_KEY` | 2Factor.in | Secret | API key for 2Factor.in transactional SMS |
| `TWOFACTOR_OTP_TEMPLATE` | 2Factor.in | String | Template name (default: `AUTOGEN`) |
| `MSG91_AUTH_KEY` | MSG91 | Secret | Enterprise authentication key from MSG91 dashboard |
| `MSG91_OTP_TEMPLATE_ID` | MSG91 | String | Approved DLT OTP template ID |
| `MSG91_SENDER_ID` | MSG91 | String | Approved 6-character sender ID (default: `ORDKNG`) |
| `TWILIO_ACCOUNT_SID` | Twilio | Secret | Twilio Account SID for international/fallback dispatch |
| `TWILIO_AUTH_TOKEN` | Twilio | Secret | Twilio Auth Token |
| `TWILIO_FROM_PHONE` | Twilio | String | Approved Twilio Sender Number or Messaging Service SID |

---

## 4. Cloudflare Environment Setup Commands

To configure real SMS gateways in Cloudflare Pages / Workers using the Wrangler CLI:

### Step 1: Set Fast2SMS Secret
```bash
npx wrangler secret put FAST2SMS_API_KEY
# Enter your Fast2SMS authorization key when prompted
```

### Step 2: Set 2Factor.in Secret
```bash
npx wrangler secret put TWOFACTOR_API_KEY
# Enter your 2Factor API key when prompted
```

### Step 3: Set MSG91 Secrets
```bash
npx wrangler secret put MSG91_AUTH_KEY
# Enter your MSG91 Auth key when prompted

npx wrangler secret put MSG91_OTP_TEMPLATE_ID
# Enter your MSG91 DLT template ID when prompted
```

### Step 4: Configure via Cloudflare Dashboard (Alternative)
1. Go to **Cloudflare Dashboard** → **Workers & Pages**.
2. Select **orderking-riders** (or your deployment project).
3. Navigate to **Settings** → **Variables and Secrets**.
4. Click **Add** under **Environment Variables** or **Secrets**.
5. Add `FAST2SMS_API_KEY`, `TWOFACTOR_API_KEY`, and `MSG91_AUTH_KEY` as encrypted secrets.
6. Trigger a new deployment for changes to take effect immediately.

---

## 5. Security & Parity Rules

1. **Pure Production Security**:
   - The server function `sendRiderOtpFn` never sends `debugOtp` to the browser.
   - When `channel === "sms"`, `whatsAppOtpUrl` is strictly omitted (`undefined`), guaranteeing OTPs cannot be intercepted via HTTP response payloads.
   - Master bypass (`cleanOtp === "123456"`) is strictly disabled when `NODE_ENV === "production"`.
2. **Carrier-Independent Channel**:
   - The `Resend via WhatsApp` button triggers `sendRiderOtpFn({ data: { phone, channel: "whatsapp" } })`, which produces a secure 1-tap `wa.me` deep link, allowing riders experiencing carrier network delays or DND filters to authenticate instantly.
3. **Throttling & Expiry**:
   - Resend attempts are throttled to a minimum 30-second cooldown timer on the client.
   - OTP codes are cryptographically generated 6-digit tokens valid for exactly 10 minutes.
