# OrderKing Cloudflare Scheduler

This Worker is the Cloudflare-only replacement for legacy Vercel Cron wiring.

Required Cloudflare Worker configuration:

- `HDMASTER_ORIGIN`: the real HTTPS origin of the active HDmaster Cloudflare deployment.
- `CRON_SECRET`: a strong secret shared only with HDmaster.

Schedules:

- Every minute: rider/restaurant dispatch evaluation.
- Monday 02:00 UTC: settlement reconciliation.

The Worker never exposes provider credentials and does not contain fake business data.

Do not deploy until the corresponding HDmaster routes are reachable on the active Cloudflare origin and the same `CRON_SECRET` is configured in both services.
