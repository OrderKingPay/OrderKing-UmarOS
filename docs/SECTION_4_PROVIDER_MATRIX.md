# Section 4 — real provider matrix

| Capability | Provider path | Required evidence | Current state |
|---|---|---|---|
| Payment collection | Razorpay or approved real PSP | Live/sandbox account, webhook secret, order/payment IDs, reconciliation | GATED |
| Maps/geocoding | Approved maps provider | API account, rate limits, route/ETA trace | GATED |
| OTP/SMS | Approved messaging provider | Sender identity, delivery trace, template/consent evidence | GATED |
| Email | Approved transactional provider | Domain authentication, delivery event, bounce handling | GATED |
| AI | Approved OpenAI/provider account | API key in secret store, model/route log, rate/cost guardrail | GATED |
| Storage/CDN | Cloudflare/Supabase-approved path | Storage policy, cache policy, signed/private access where needed | GATED |
| Affiliate travel | Actual commercial partner/API | Contract, API credentials, booking confirmation + commission record | FUTURE/GATED |
| Train/rail | Actual authorized integration | Contract/provider evidence, booking trace | FUTURE/GATED |
| Task marketplace | Actual task/survey partner | Advertiser contract, funded task, payout/reversal rules | FUTURE/GATED |

## Rule

No provider is represented as LIVE merely because an adapter or UI exists. A provider becomes enabled only after configuration, successful test transaction, webhook/verification path and reconciliation evidence are captured.

## Failure states

Every provider must expose an explicit state such as `NOT_CONFIGURED`, `SANDBOX_READY`, `LIVE_HEALTHY`, `DEGRADED`, or `DISABLED`.

## Credential policy

Credentials never belong in source, prompts, screenshots or client bundles. Production secrets must be rotated if they were previously committed or exposed.
