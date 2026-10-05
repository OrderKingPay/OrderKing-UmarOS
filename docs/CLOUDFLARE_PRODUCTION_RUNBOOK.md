# Cloudflare-only production runbook

## Active production target

Cloudflare Pages is the only active hosting target for the five OrderKing surfaces.

| Surface | Pages project | Repository root | Output |
|---|---|---|---|
| Customer | orderking-customers | orderking-customers | dist |
| Partner | orderking-partners | orderking-partners | dist |
| Rider | orderking-riders | orderking-riders | dist |
| Umar OS | orderking-hdmaster | HDmaster | dist |
| Integrations | apps-integration | Apps-integration- | dist |

## Required release configuration

- Production branch must be the verified `main` branch only after the release PR is green and merged.
- Build must use the repository's pinned pnpm 12.8.1 and Node 22 CI runtime.
- Each app must use Nitro `cloudflare-pages` and its matching `wrangler.toml`.
- The Pages deployment must be traceable to an exact Git commit.
- Smoke tests must cover landing page, login, one authenticated route, server action/loader, static assets and browser-console errors.
- Rider `/login` must be explicitly retested because of the historical HTTP 500.

## Current limitation

Cloudflare dashboard production-branch settings and live deployment smoke tests require authenticated Cloudflare access. No Vercel or Netlify deployment is an acceptable substitute.

## Custom domain

`pages.dev` is valid for a controlled pilot. A custom domain is optional and must be checked live with registrar/DNS evidence before being represented as available.

## Evidence required for the Section 2 gate

1. GitHub CI: typecheck + all five builds PASS.
2. Exact merge commit into `main`.
3. Cloudflare project settings for all five projects.
4. Cloudflare deployment IDs/URLs for the exact merge commit.
5. Five-app smoke evidence.
6. Rider login no longer returns an unhandled 5xx.

Legacy Vercel/Netlify files may remain as preserved source artifacts, but they are not launch infrastructure and must not appear in launch evidence.
