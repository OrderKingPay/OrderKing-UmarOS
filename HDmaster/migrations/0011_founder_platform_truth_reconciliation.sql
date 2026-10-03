-- Part 4 truth reconciliation. Additive/non-destructive: no founder data is deleted.
-- Static Founder platform seed rows must never appear as live integrations without
-- separate provider verification.

UPDATE founder_platforms
SET status = 'STANDBY',
    api_latency_ms = 0,
    last_sync_time = 'NOT_VERIFIED',
    guardrail_protection = '{"sandboxVerified":false,"zeroDataLeak":false,"rollbackSnapshotReady":false,"rateLimitSafe":false}'::jsonb,
    supported_actions = '[]'::jsonb
WHERE status IN ('CONNECTED','ENFORCING','SECURED');

