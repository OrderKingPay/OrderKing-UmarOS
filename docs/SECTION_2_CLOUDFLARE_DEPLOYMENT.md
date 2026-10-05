# Section 2 — Cloudflare-only deployment blueprint

## Five Cloudflare Pages projects

| Surface | Pages project | Build preset | Output |
|---|---|---|---|
| Umar OS / HDmaster | `orderking-hdmaster` | Nitro `cloudflare-pages` | `dist` |
| OrderKing Customer | `orderking-customers` | Nitro `cloudflare-pages` | `dist` |
| OrderKing Partner | `orderking-partners` | Nitro `cloudflare-pages` | `dist` |
| OrderKing Rider | `orderking-riders` | Nitro `cloudflare-pages` | `dist` |
| Integrations / KingPay boundary | `apps-integration` | Nitro `cloudflare-pages` | `dist` |

## Deployment rule

Cloudflare is the ONLY active deployment target for launch. Historical Vercel/Netlify/GCP configuration remains in the repository where it is needed for reference or future recovery, but it is not an active launch path.

## Build rule

Each Pages project must use:
- repository: `OrderKingPay/OrderKing-UmarOS`
- correct root directory for the app
- production branch: `main` (verified for all five existing Pages projects on 2026-10-05)
- build command: the app's existing `pnpm run build`
- output directory: `dist`
- Node compatibility flags required by the existing Cloudflare-compatible runtime
- server secrets configured only in Cloudflare's server-side environment configuration

Nitro's `cloudflare-pages` preset emits a Pages-compatible `dist/_worker.js` deployment and uses `dist` as its output directory.

## Domain architecture

Temporary launch:
- use each project's `*.pages.dev` hostname.

Custom-domain target (after domain acquisition):
- `orderking.in` → Customer
- `www.orderking.in` → marketing/customer entry
- `partner.orderking.in` → Partner
- `rider.orderking.in` → Rider
- `os.orderking.in` → Umar OS
- `pay.orderking.in` → KingPay/integrations

Exact hostname mapping is subject to the domain selected and final Cloudflare DNS configuration.

## Secrets

Never commit:
- database URLs
- auth secrets
- payment keys
- AI keys
- map keys
- messaging credentials
- Cloudflare API tokens

Cloudflare must hold production secrets as encrypted server-side values. Public/browser variables are limited to values explicitly safe for browser exposure.

## DNS

For an apex custom domain, the domain must be a Cloudflare zone with Cloudflare nameservers. Cloudflare Pages custom domains can then be attached from the Pages project Custom domains settings.

## Current Section-2 status

### Completed in source control
- HDmaster switched from Netlify Nitro preset to Cloudflare Pages preset.
- Apps-integration switched from Netlify Nitro preset to Cloudflare Pages preset.
- Wrangler Pages configuration added for both.
- Existing Customer/Partner/Rider Cloudflare Pages configs preserved.

### External account work
The existing Cloudflare account was inspected directly. No project creation or duplicate provisioning was required. No custom domain or DNS changes were made.

## Section-2 evidence gate
1. Cloudflare account ID verified: `fc53b6fd613df944a3a46606cfbf21d0`.
2. All five existing Pages projects verified; no duplicate project creation performed.
3. All five projects are connected to `OrderKingPay/OrderKing-UmarOS`.
4. All five production branches are now `main`.
5. Build roots and `dist` outputs were inspected and preserved.
6. HDmaster and Apps-integration use the Cloudflare Pages Nitro target and Wrangler configuration.
7. GitHub Production Gate completed successfully for the Section-2 branch: 6 workspace typechecks green and all five app builds green.
8. No custom domains/zones exist yet; `pages.dev` remains the current temporary launch hostname.
9. No production DNS was changed.
10. Fresh public HTTP smoke testing through the available web fetch path was not reliable, so no HTTP result is claimed as verified here.

## No destructive actions
No existing repository files were deleted in Section 2.
No Vercel or Netlify configuration was deleted.
No production DNS was changed.

## Cloudflare account verification (2026-10-05)
- Account has five existing Pages projects; no duplicate project creation is required.
- Existing project names are `orderking-customers`, `orderking-partners`, `orderking-riders`, `orderking-hdmaster`, and `apps-integration`.
- All five are connected to `OrderKingPay/OrderKing-UmarOS`.
- All five use `dist` as Pages output.
- The repository directory `HDmaster` and `Apps-integration-` are intentional filesystem paths/casing and must not be normalized by renaming.
- The integration package name is `app-builder-workspace`; its Cloudflare build command may legitimately use that package name.
- No custom domains/zones were found in the Cloudflare account at inspection time.
- The production branch was verified as `main` for all five projects after the targeted dashboard update.
- Cloudflare project creation and DNS changes were not needed/claimed; all five Pages projects already existed and no custom zone was present.


## Section-2 final gate — 2026-10-05
**STATUS: COMPLETE — SOURCE + ACCOUNT CONFIGURATION VERIFIED**

Cloudflare Pages production branches:
- `orderking-customers` → `main`
- `orderking-partners` → `main`
- `orderking-riders` → `main`
- `orderking-hdmaster` → `main`
- `apps-integration` → `main`

GitHub Production Gate:
- Typecheck: PASS
- Build: PASS
- Five app surfaces remain intact
- No existing repository files were deleted for the Section-2 migration
- Legacy Vercel/Netlify configuration was not used as a deployment target and was not deleted

Section 2 is eligible to merge into `main`. Custom-domain/DNS acquisition remains a later launch configuration item, not a Section-2 blocker.
