# Build & deploy target

**Cloudflare Pages is the only approved deployment target for this OrderKing/Umar OS workspace.**

**Active deployment URL:** https://b7e8a4af.orderking-hdmaster.pages.dev/login
**Do not substitute another Vercel, Netlify, or Cloudflare preview URL for production operations without explicit founder direction.
Do not configure, trigger, or restore Vercel, Netlify, Render, or another hosting platform.

Production work must follow:

**Inspect → Plan → Validate → Preview locally → Founder approval → Cloudflare deploy → Verify → Audit**

## Runtime contracts

- Dev server: `0.0.0.0:8080`
- Local preview: `127.0.0.1:8081`
- Production host comes from `BETTER_AUTH_URL` / `CF_PAGES_URL` / the configured Cloudflare custom domain.
- Cloudflare Pages/Workers environment variables and secrets are the only production deployment configuration source.
- Never hard-code deployment provider URLs, tokens, API keys, or secrets.
- Do not run a deployment merely to prove a source change. Runtime verification requires the actual local development machine or a specifically approved Cloudflare deployment.

## Build configuration

Preserve the existing TanStack Start + Vite architecture, `grokPwaPlugin()`, and `serverDir: "./server"` where present.

Use Nitro's **Cloudflare Pages** preset for Cloudflare deployment.

Do not add provider-specific configuration for another hosting platform.
