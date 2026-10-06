# Provider Truth Matrix

| Capability | Required dependency | Current state |
|---|---|---|
| Food online payment | Razorpay live keys + webhook secret + approval | BLOCKED until verified |
| Food COD | Real restaurant/rider pilot | BLOCKED until pilot |
| Consumer KingPay wallet | Real wallet/regulated payment ledger | DISABLED |
| Consumer UPI / public Scan & Pay | Regulated TPAP/PSP/bank architecture | FUTURE / GATED |
| Bank linking / balance | Real regulated provider | FUTURE / DISABLED |
| BBPS / recharge | Real BBPS provider + payment ledger | FUTURE / DISABLED |
| Digital gold | Authorized provider + custody/ledger | FUTURE / DISABLED |
| Credit / KingPay Later | Regulated lender/LSP | FUTURE / DISABLED |
| Rewards / cashback | Real promotional ledger | FUTURE / DISABLED |
| AI | OpenAI or approved provider credentials | BLOCKED until configured |
| Maps / geocoding / ETA | Approved maps provider + billing/key | BLOCKED until configured |
| SMS / OTP | Approved messaging provider | BLOCKED until configured |
| Email | Approved transactional email provider | BLOCKED until configured |
| Storage | Cloudflare R2 or approved provider | BLOCKED until configured |
| Error monitoring | Approved monitoring provider | BLOCKED until configured |
| Flight/travel affiliates | Real provider credentials + commercial terms | FUTURE / DISABLED |
| Train booking | Licensed provider/principal integration | FUTURE / DISABLED |
| Consumer fintech/TPAP | Required regulated partnership/approval | FUTURE / GATED |

No unavailable provider is represented as a live success path.

## Owner-only actions
- Verify Cloudflare Pages production secrets for all five apps.
- Verify Razorpay live credentials, webhook secret and live-payment approval.
- Verify maps, messaging, email, AI and storage provider accounts.
- Obtain counsel review/approval for marketplace contracts and policies.
- Onboard the first real restaurant, rider and controlled customer cohort.
- Keep PUBLIC_LAUNCH=OFF until the Section 12 gate passes.
