# Section 1 — Production Truth Gate

Status: IN PROGRESS / NON-DESTRUCTIVE

Rules:
- Never delete useful features.
- Never show synthetic entities, payments, settlements, GPS, balances, ratings, KYC results, or analytics as live.
- Synthetic seed data is sandbox-only and must be explicitly enabled.
- Production launch requires live provider credentials/contracts and evidence.
- Unavailable capabilities stay present but OFF with an explicit reason and founder switch.

Five launch surfaces:
1. UmarOS / HDmaster — control plane
2. OrderKing Customer — marketplace + KingPay surface
3. OrderKing Partner — restaurant operations
4. OrderKing Rider — dispatch/delivery
5. Apps Integration — shared integration/admin boundary

Section 1 gate:
- Protect production from synthetic seed data.
- Centralize launch/feature state in UmarOS.
- Keep unavailable integrations visible as OFF, never simulated.
- Establish evidence-based GO/NO-GO status.
- Prepare legal onboarding boundaries without claiming zero statutory liability.

Live-launch prerequisite families:
- Legal entity, tax/GST/FSSAI and bank/settlement identity
- Database + authentication + secrets
- Payment gateway/webhooks
- Maps/location provider
- SMS/WhatsApp/email/push
- Restaurant verification
- Rider KYC/vehicle/insurance/safety
- Customer terms/privacy/refund/grievance flows
- Production domains/DNS

Important: no contract can guarantee zero founder/platform liability where applicable law imposes non-waivable duties. Contracts should allocate operational responsibilities, obtain indemnities where enforceable, and preserve required consumer, food-safety, privacy, tax, labour/social-security and transport obligations.
