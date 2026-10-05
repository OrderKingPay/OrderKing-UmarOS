# Cloudflare-only release runbook

## Active hosting rule

Cloudflare Pages/Workers is the only active production hosting path for this launch program.

Vercel and Netlify are not deployment targets and are not launch evidence.

## Existing Pages projects

| Surface | Pages project | Repository root |
|---|---|---|
| Customer | `orderking-customers` | `orderking-customers` |
| Partner | `orderking-partners` | `orderking-partners` |
| Rider | `orderking-riders` | `orderking-riders` |
| Umar OS | `orderking-hdmaster` | `HDmaster` |
| Integrations | `apps-integration` | `Apps-integration-` |

## Required production settings

- Production branch: `main`
- Build output: `dist`
- Runtime: Cloudflare Pages/Functions as required by the app's adapter
- Secrets/configuration: Cloudflare environment variables/secrets only
- Never place private provider credentials in the browser bundle.
- Verify each project independently after every production-branch change.

## Minimum release evidence

For each project record:

1. exact deployed commit SHA
2. build result
3. Cloudflare project name
4. repository/root/build settings
5. runtime/environment configuration
6. landing-page smoke result
7. login smoke result
8. one authenticated route/API/server action
9. browser console result
10. known-error retest where applicable

## Historical blocker

The Rider `/login` path previously returned HTTP 500 in the production deployment. It must be tested explicitly after the next Cloudflare deployment.

## Custom domain

The free `pages.dev` URLs remain valid for controlled testing/pilot. A custom domain is optional until live registration/availability is verified and DNS is intentionally configured.

## Do not bypass

A successful build is not sufficient for launch. Unknown Cloudflare project settings, missing secrets, stale production branches, or runtime 5xx errors keep the launch gate BLOCKED.
