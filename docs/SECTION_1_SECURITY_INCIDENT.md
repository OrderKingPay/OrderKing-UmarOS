# Section 1 — Credential Exposure Incident / Safe Handling

## Finding
Two tracked source files contained production-looking database/auth credentials and a Vercel deployment helper:
- `HDmaster/scripts/query_db.js`
- `orderking-customers/add_envs.cjs`

A separate audit also identified provider-specific test-key fallbacks in:
- `orderking-customers/src/lib/kingpay/wallet.ts`
- `orderking-partners/src/lib/kingpay/settlement.ts`

## Required security action
Treat every exposed database password/auth secret as compromised. Before production use:
1. Rotate the Supabase database credential/password.
2. Rotate the affected Better Auth secret(s).
3. Recreate any other provider credential that may have been exposed.
4. Do not reuse the old values.
5. Store the new values only in the Cloudflare server-side secret/configuration system.
6. Run repository secret scanning before merging the security branch.
7. Verify no production client bundle receives server secrets.

## Safety status
This branch removes hard-coded secrets from the two identified helper files without deleting their future purpose.
Production payment/auth/provider code remains unchanged until the provider-configuration sections are implemented and verified.

## Important
The founder/company cannot honestly be guaranteed “zero liability” by code or contract. Section 10 will structure platform/intermediary role definitions, merchant/rider obligations, indemnities, insurance requirements, grievance routing, refund responsibilities and evidence capture, followed by legal review.
