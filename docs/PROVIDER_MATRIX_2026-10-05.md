# OrderKing Provider Matrix — 2026-10-05

This matrix is the Section 4 configuration contract. A row is not LIVE unless account, credentials, webhook/callback, health check and end-to-end evidence exist.

| Capability | Intended provider | State | Required configuration | Evidence | Safe failure |
|---|---|---|---|---|---|
| Core payments | Razorpay | SANDBOX/UNCONFIGURED | RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, webhook secret | provider transaction + signature + webhook + reconciliation | checkout unavailable |
| Maps/geocoding | Mapbox | UNCONFIGURED | MAPS_API_KEY | real geocode/route test | manual address |
| OTP/SMS | approved Indian SMS provider | PENDING_PROVIDER | provider key, sender/DLT identifiers/templates | real device OTP + expiry/replay test | login unavailable/recovery path |
| Transactional email | approved provider | PENDING_PROVIDER | server API key + authenticated domain | accepted/delivered event | in-app notification/support |
| Object storage | Cloudflare R2 | PENDING_CONFIG | bucket/binding + signed-access configuration | anonymous denied + signed access | upload unavailable |
| Analytics/errors | approved telemetry | PENDING_CONFIG | privacy-filtered project config | deliberate test event/error | internal logs |
| AI primary | OpenAI | PENDING_KEY | OPENAI_API_KEY + OPENAI_MODEL_ID | response with actual provider/model + trace | AI degrades/escalates |
| AI secondary | optional approved provider | OFF/PENDING | server-side provider secret | provider health evidence | route to primary |
| Flight search | approved travel provider | FUTURE/UNCONFIGURED | commercial agreement + API credentials | live availability query | no inventory |
| Train search | authorized rail partner | FUTURE/UNCONFIGURED | commercial/API authorization | live availability query | no inventory |
| Consumer UPI/TPAP | authorized PSP/TPAP/NPCI path | FUTURE/GATED | regulated partnership/approval | provider/NPCI evidence | capability hidden |
| BBPS | approved BBPS provider | FUTURE/UNCONFIGURED | commercial/API credentials | real bill/payment/reconciliation | capability hidden |
| Lending | regulated lending partner | FUTURE/UNCONFIGURED | partner agreement + compliant flow | partner approval + disbursement evidence | capability hidden |
| Escrow/banking | actual banking/escrow partner | FUTURE/UNCONFIGURED | provider/account agreement | provider confirmation | capability hidden |

Production rules:
- Secrets stay in Cloudflare encrypted secret configuration; never in git.
- Payment confirmation is server-authoritative; webhook signatures and reconciliation are mandatory.
- Future providers remain preserved but disabled; no synthetic inventory, balance, booking success or compliance status.
- Supabase Data API access requires both grants and RLS policies; current sensitive tables are intentionally not browser-writable until explicit tenant policies are tested.

Official references:
- Cloudflare Pages variables/secrets: https://developers.cloudflare.com/pages/functions/bindings/
- Supabase RLS/grants: https://supabase.com/docs/guides/database/postgres/row-level-security
- Razorpay security checklist: https://razorpay.com/security/checklist
- Mapbox Geocoding API: https://docs.mapbox.com/api/search/geocoding/