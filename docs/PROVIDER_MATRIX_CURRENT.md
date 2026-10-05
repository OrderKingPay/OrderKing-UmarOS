# Current Provider Matrix — Truth State

| Capability | Required production dependency | State |
|---|---|---|
| Food online payment | Razorpay live keys + webhook secret + live approval | BLOCKED until verified |
| Food COD | Restaurant/rider pilot readiness | BLOCKED until pilot |
| KingPay consumer wallet | Real wallet/regulated payment ledger | DISABLED |
| Consumer Scan & Pay / UPI | Regulated TPAP/PSP/bank architecture | FUTURE / DISABLED |
| Bank linking/balance | Real regulated banking/UPI provider | FUTURE / DISABLED |
| BBPS/recharge | Real BBPS provider + ledger | FUTURE / DISABLED |
| Digital gold | Authorized provider/custody/ledger | FUTURE / DISABLED |
| Credit / KingPay Later | Regulated lender/LSP + eligibility API | FUTURE / DISABLED |
| Rewards/cashback | Real rewards ledger/funding | FUTURE / DISABLED |
| AI | OPENAI_API_KEY and/or approved provider keys | BLOCKED until configured |
| Maps/geocoding/ETA | GOOGLE_MAPS_API_KEY + provider/billing approval | BLOCKED until configured |
| SMS/OTP | Approved SMS provider + sender/DLT configuration | BLOCKED until configured |
| Email | Approved email provider + sender/domain configuration | BLOCKED until configured |
| Storage | Cloudflare R2/S3-compatible bucket and server credentials | BLOCKED until configured |
| Error monitoring | Sentry/selected monitoring credentials | BLOCKED until configured |
| Flight affiliate | Real provider credentials + commercial approval | FUTURE / DISABLED |
| Train booking | Licensed IRCTC/principal provider integration | FUTURE / DISABLED |
| Consumer fintech/TPAP | Required regulated partner/approval model | FUTURE / GATED |

## Owner-only actions

1. Verify Cloudflare production secrets for all five Pages projects.
2. Verify Razorpay live account, keys, webhook secret, callback/webhook target and live-payment approval.
3. Verify Google Maps API key, billing and API restrictions.
4. Verify SMS and email provider accounts, sender/domain approval and production credentials.
5. Verify OpenAI/approved AI provider keys and model entitlements.
6. Verify Cloudflare R2 bucket and credentials if storage is enabled.
7. Obtain legal/counsel approval for marketplace, partner, rider, privacy and grievance documents.
8. Onboard the first real restaurant, rider and controlled customer cohort.
9. Keep PUBLIC_LAUNCH=OFF until Section 12 passes.