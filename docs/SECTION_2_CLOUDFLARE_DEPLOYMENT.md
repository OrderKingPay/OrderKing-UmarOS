# Section 2 — Cloudflare-Only Deployment Matrix

Cloudflare is the only active production hosting target for this launch. Vercel/Netlify configuration remains preserved as legacy/reference code and must not be selected for production.

## Five Cloudflare Pages projects

| Surface | Repository app directory | Cloudflare project | Build command from repository root | Build output |
|---|---|---|---|---|
| Umar OS / HDmaster | `HDmaster` | `orderking-umar-os` | `pnpm --filter orderking-hdmaster build` | `HDmaster/dist` |
| OrderKing Customer | `orderking-customers` | `orderking-customers` | `pnpm --filter orderking-customers build` | `orderking-customers/dist` |
| OrderKing Partner | `orderking-partners` | `orderking-partners` | `pnpm --filter orderking-partners build` | `orderking-partners/dist` |
| OrderKing Rider | `orderking-riders` | `orderking-riders` | `pnpm --filter orderking-riders build` | `orderking-riders/dist` |
| Integrations / KingPay boundary | `Apps-integration-` | `orderking-integrations` | `pnpm --filter app-builder-workspace build` | `Apps-integration-/dist` |

## Cloudflare settings
- Node.js: 20+ (repository engines require Node >=20).
- Package manager: pnpm 12.8.1.
- Production branch: `main` only after all gates pass.
- Preview branches: enabled for audit/review; never treated as production.
- Each Pages project must point to the repository root so the shared pnpm lockfile/workspace is honored.
- Output directory is the app-specific `dist` directory above.
- Do not manually paste secrets into git-tracked configuration.

## Domain topology (recommended)
- Customer: `orderking.in` + `www.orderking.in`
- Umar OS: `os.orderking.in`
- Partner: `partner.orderking.in`
- Rider: `rider.orderking.in`
- KingPay/integrations: `pay.orderking.in`

The exact primary domain can be changed in Umar OS later without rebuilding the application.

## Current domain status
Domain ownership/availability was not changed in this section because this environment has no authenticated Cloudflare Registrar/DNS connection. Do not claim `orderking.in` is available until the registry/registrar checkout confirms it.

Cloudflare's Pages documentation recommends using the Pages project configuration from the dashboard or downloading it with `wrangler pages download config` before adopting a Wrangler file as the production source of truth. See Cloudflare's current configuration guidance.

## Section 2 deployment boundary
This section prepares the repository for Cloudflare and verifies the five-app build/deployment matrix. Actual Pages project creation, custom-domain attachment, DNS records, and secret entry require an authenticated Cloudflare account; those actions cannot be truthfully marked complete from this unconnected environment.

## Safety
- No existing useful feature was deleted.
- Vercel/Netlify files remain preserved but inactive.
- Cloudflare is explicitly preferred in the five active Vite/Nitro configurations.
- Missing provider credentials continue to fail closed.
