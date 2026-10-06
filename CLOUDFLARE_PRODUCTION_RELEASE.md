# Cloudflare Production Release Marker

Release date: 2026-10-06
Hosting policy: Cloudflare Pages only
Source of truth: `main`

Validated before this marker:
- pnpm frozen-lockfile installation passes.
- Typecheck passes across all workspace applications.
- Production build passes for all five applications.
- Cloudflare-compatible Pages/Nitro build configuration is present.
- Better Auth uses `BETTER_AUTH_URL` for production origin handling.
- Razorpay payment paths fail closed when credentials are absent.
- No production launch switch is enabled by this marker.

Live launch controls remain governed by the database launch gate and require verified real providers, onboarding, and a controlled pilot before public launch.
