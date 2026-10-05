# Cloudflare-only release runbook

Active production host: Cloudflare Pages/Workers only.

Pages projects:
- orderking-customers
- orderking-partners
- orderking-riders
- orderking-hdmaster
- apps-integration

For each release capture:
1. commit SHA
2. build result
3. Pages project
4. production branch
5. environment/secrets state
6. landing smoke
7. login smoke
8. one authenticated/server route
9. browser console errors
10. known historical error retest

Do not use Vercel or Netlify deployments as evidence or as a repair path.

Custom domain is optional until registrar availability is actually verified and DNS is intentionally configured.

A successful GitHub build is not equivalent to a verified Cloudflare production deployment.
