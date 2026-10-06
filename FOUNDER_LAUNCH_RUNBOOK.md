# Founder Launch Runbook — OrderKing / Umar OS

Updated: 2026-10-06

## Current operating mode

- Hosting target: Cloudflare Workers & Pages only.
- Production branch target: `main`.
- Database mode: `PILOT`.
- Controlled pilot: ON.
- Public launch: OFF.
- Payments: SANDBOX until a controlled real Razorpay transaction + webhook + reconciliation evidence passes.
- Rider GPS: OFF until an authorized maps provider is verified end-to-end.
- Dispatch: OFF until real rider + maps + dispatch evidence passes.
- KingPay consumer UPI: gated; do not represent as a consumer banking/TPAP product without a real PSP-bank/NPCI path.
- AI support and observability: ON.

## Verified engineering state

- Root CI has passed dependency installation, typecheck, and all five app builds on the validated release line.
- Cloudflare deployment checks have successfully built/deployed multiple apps; HDmaster remains the only Cloudflare deployment exception being investigated.
- The live Supabase project is healthy and currently contains zero restaurants, menu items, orders, payments, dispatch assignments, rider location pings, and KingPay transactions.
- Founder-facing integration status was hardened to avoid unsupported "connected/ready" claims.
- Fabricated finance history, payout success, default VPA/recipient/channel fallbacks, and founder sweep success were hardened to fail closed.

## Controlled-pilot launch sequence

1. Founder verifies the real business/legal entity, bank account, payment provider account, maps provider account, OTP/SMS provider, transactional email provider, and required policy/legal documents.
2. Onboard the first restaurant using the Partner app. Required operational records: legal identity, outlet, bank/payout details, FSSAI, menu, pricing, availability, preparation SLA, and authorized contact.
3. Onboard the first rider using the Rider app. Required records: identity/KYC, payout details, emergency contact, safety acknowledgement, location consent, and availability.
4. Verify a real customer account and support path.
5. Complete a sandbox payment/order/dispatch rehearsal.
6. Complete a controlled real Razorpay transaction, webhook signature verification, idempotency check, ledger posting, settlement/reconciliation, and refund test.
7. Verify maps/geocoding/route/ETA with known coordinates and privacy controls.
8. Verify OTP delivery, expiry, retry limits, and abuse protection on a real device.
9. Enable rider GPS and dispatch only after 6–8 pass evidence exists.
10. Run a multi-order pilot batch and measure service quality, payment success, cancellation/refund rate, rider acceptance, restaurant prep SLA, support response, and unit economics.
11. Founder reviews the evidence ledger and legal/compliance pack.
12. Only then change `public_launch` to the approved live state and move `payments_mode` from SANDBOX to LIVE.

## Founder operating rule

Never use screenshots or UI badges as proof of live operation. Provider transaction IDs, webhook traces, database audit records, dispatch events, and signed/compliance records are the authoritative evidence.
