# Section 2 — Cloudflare-only deployment blueprint

## Five Cloudflare Pages projects

| Surface | Pages project | Build preset | Output |
|---|---|---|---|
| Umar OS / HDmaster | `umar-os` | Nitro `cloudflare-pages` | `dist` |
| OrderKing Customer | `orderking-customers` | Nitro `cloudflare-pages` | `dist` |
| OrderKing Partner | `orderking-partners` | Nitro `cloudflare-pages` | `dist` |
| OrderKing Rider | `orderking-riders` | Nitro `cloudflare-pages` | `dist` |
| Integrations / KingPay boundary | `orderking-integrations` | Nitro `cloudflare-pages` | `dist` |

## Deployment rule

Cloudflare is the ONLY active deployment target for launch. Historical Vercel/Netlify/GCP configuration remains in the repository where it is needed for reference or future recovery, but it is not an active launch path.

## Build rule

Each Pages project must use:
- repository: `OrderKingPay/OrderKing-UmarOS`
- correct root directory for the app
- production branch: `main` after Section 12 launch approval
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
The connected Cloudflare browser profile is not currently recorded as signed in to dash.cloudflare.com, so Cloudflare dashboard/project creation and DNS changes cannot be truthfully claimed complete until the account session is saved.

## Required verification after account access
1. Confirm Cloudflare account and account ID.
2. Confirm existing Pages projects and avoid duplicate creation.
3. Confirm GitHub repository authorization.
4. Create only missing Pages projects.
5. Configure each root/build command/output.
6. Configure required production/preview environment variables.
7. Deploy a non-production branch first.
8. Verify Pages deployment status and public `pages.dev` URL.
9. Run HTTP health/smoke checks.
10. Only then attach custom domains.

## No destructive actions
No existing repository files were deleted in Section 2.
No Vercel or Netlify configuration was deleted.
No production DNS was changed.
