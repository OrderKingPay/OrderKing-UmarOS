# Section 12 — Real Pilot → Launch Gate

`PUBLIC_LAUNCH` remains **OFF** until the full program is evidenced.

## Required pilot

- real restaurants only
- real riders only
- consented real customers
- real payment and webhook confirmation
- restaurant acceptance/rejection
- rider dispatch/reassignment
- address/cancellation/refund/support cases
- financial reconciliation
- contribution-margin measurement
- staffed escalation for payment/safety/legal incidents

## Binary states

- OFF
- CONTROLLED_PILOT
- ON

No "99% ready" state.

## KingPay boundary

Consumer UPI/TPAP behavior stays OFF until the required regulated provider/sponsor-bank architecture is actually connected and verified.

VIP may exist as a feature only after a real payment provider + verified webhook + entitlement ledger are connected.

## Launch switch protection

The database trigger blocks `public_launch=true` unless:

- `data_mode=LIVE`
- `controlled_pilot=true`
- `payments_mode=LIVE`
- observability is enabled

It also blocks consumer UPI before public launch.

## Current evidence

Supabase project is healthy, but marketplace production rows are empty and the organization is still SIMULATED. Therefore this gate is intentionally BLOCKED.

Cloudflare is the only intended production host. Vercel/Netlify are not launch paths.
