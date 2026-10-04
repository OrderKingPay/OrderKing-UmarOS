# OrderKing / KingPay — Founder Launch Control Matrix

Every capability is ON / OFF / SANDBOX / BLOCKED. OFF/BLOCKED actions must never fabricate success.

## Five surfaces
1. UmarOS / HDmaster — control, audit, configuration.
2. OrderKing Customer — marketplace and customer payment surface.
3. OrderKing Partner — restaurant onboarding and order operations.
4. OrderKing Rider — delivery and dispatch.
5. Apps Integration — shared integration/admin boundary.

## Data states
- SIMULATED: sandbox-only.
- REAL: sourced from a live connected system.
- VERIFIED: real record with required verification evidence.
- ESTIMATE / FORECAST: analytical output only.

## Provider rule
Payment, maps, messaging, AI, storage, flights, trains, tax/accounting and UPI/TPAP capabilities are OFF/BLOCKED until their credentials, contracts and live-path tests are verified.

## Release gate
GO requires build/typecheck, relevant tests, deployment evidence, live smoke tests and provider-contract verification for every enabled feature.
