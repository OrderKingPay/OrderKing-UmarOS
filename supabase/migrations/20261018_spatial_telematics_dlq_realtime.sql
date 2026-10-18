-- ============================================================================
-- OrderKing Migration: Spatial Telematics, PostGIS Nearest Riders,
-- Durable Dead Letter Queue (DLQ) with Exponential Backoff,
-- and Supabase Realtime Replication Publications.
-- ============================================================================

-- 1. Ensure PostGIS spatial extension is enabled
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- 2. Dispatch Jobs table (if not already created)
CREATE TABLE IF NOT EXISTS public.dispatch_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL,
    pickup_lat DOUBLE PRECISION NOT NULL,
    pickup_lng DOUBLE PRECISION NOT NULL,
    drop_lat DOUBLE PRECISION NOT NULL,
    drop_lng DOUBLE PRECISION NOT NULL,
    assigned_rider_id TEXT,
    status TEXT NOT NULL DEFAULT 'QUEUED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_dispatch_jobs_order_id ON public.dispatch_jobs (order_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_jobs_status ON public.dispatch_jobs (status);

ALTER TABLE public.dispatch_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dispatch_jobs' AND policyname = 'Service role bypass on dispatch_jobs'
    ) THEN
        CREATE POLICY "Service role bypass on dispatch_jobs" ON public.dispatch_jobs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END $$;

-- 3. Preserve EXISTING Umar OS DLQ schema verified on Supabase.
-- Existing: id TEXT, org_id TEXT, target_system TEXT, payload_json TEXT.
CREATE TABLE IF NOT EXISTS public.dead_letter_queue (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    target_system TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RETRIED','DEAD','RESOLVED')),
    next_retry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dead_letter_queue ADD COLUMN IF NOT EXISTS max_retries INTEGER NOT NULL DEFAULT 5;
CREATE INDEX IF NOT EXISTS idx_dlq_status_next_retry ON public.dead_letter_queue (status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_dlq_target_system ON public.dead_letter_queue (target_system);

ALTER TABLE public.dead_letter_queue ENABLE ROW LEVEL SECURITY;

-- Defense in depth: neither queue nor dispatch jobs are public Data API resources.
REVOKE ALL ON TABLE public.dispatch_jobs, public.dead_letter_queue FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.dispatch_jobs, public.dead_letter_queue TO service_role;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dead_letter_queue' AND policyname = 'Service role manages dead_letter_queue'
    ) THEN
        CREATE POLICY "Service role manages dead_letter_queue" ON public.dead_letter_queue FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END $$;

-- 4. Exponential backoff timestamp calculation function
CREATE OR REPLACE FUNCTION public.compute_dlq_backoff(
    p_retry_count INT,
    p_base_delay_seconds INT DEFAULT 30,
    p_max_delay_seconds INT DEFAULT 86400
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
VOLATILE
AS $$
BEGIN
    -- Formula: base_delay * 2^retry_count (bounded by max_delay_seconds)
    RETURN now() +
        (LEAST(p_base_delay_seconds * POWER(2, GREATEST(0, p_retry_count)), p_max_delay_seconds) || ' seconds')::INTERVAL;
END;
$$;

-- 5. Schedule / Record DLQ Retry with exponential backoff state transitions
CREATE OR REPLACE FUNCTION public.schedule_dlq_retry(
    p_dlq_id TEXT,
    p_error_message TEXT DEFAULT NULL
)
RETURNS TABLE (
    id TEXT,
    retry_count INT,
    status TEXT,
    next_retry_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_retries INT;
    v_max INT;
    v_next TIMESTAMP WITH TIME ZONE;
    v_new_status TEXT;
BEGIN
    SELECT dlq.retry_count + 1, dlq.max_retries
    INTO v_retries, v_max
    FROM public.dead_letter_queue dlq
    WHERE dlq.id = p_dlq_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'DLQ record % not found', p_dlq_id;
    END IF;

    IF v_retries >= v_max THEN
        v_new_status := 'DEAD';
        v_next := now() + interval '100 years'; -- preserve NOT NULL
    ELSE
        v_new_status := 'RETRIED';
        v_next := public.compute_dlq_backoff(v_retries);
    END IF;

    RETURN QUERY
    UPDATE public.dead_letter_queue
    SET 
        retry_count = v_retries,
        status = v_new_status,
        next_retry_at = v_next,
        error_message = COALESCE(p_error_message, dead_letter_queue.error_message),
        updated_at = timezone('utc'::text, now())
    WHERE dead_letter_queue.id = p_dlq_id
    RETURNING dead_letter_queue.id, dead_letter_queue.retry_count, dead_letter_queue.status, dead_letter_queue.next_retry_at;
END;
$$;

-- 6. Schema-verified PostGIS lookup: actual riders.id/user_id TEXT, lat/lng NUMERIC.
-- Never expose precise rider coordinates through public/anon/authenticated RPC.
CREATE INDEX IF NOT EXISTS idx_riders_spatial_live_geo ON public.riders
  USING GIST ((extensions.ST_SetSRID(extensions.ST_MakePoint(lng::double precision, lat::double precision),4326)::extensions.geography))
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

CREATE OR REPLACE FUNCTION public.match_nearest_riders(
  pickup_lat DOUBLE PRECISION, pickup_lng DOUBLE PRECISION,
  max_radius_meters DOUBLE PRECISION DEFAULT 5000, max_limit INT DEFAULT 10
) RETURNS TABLE (
  rider_id TEXT, user_id TEXT, distance_meters DOUBLE PRECISION,
  lat DOUBLE PRECISION, lng DOUBLE PRECISION, status TEXT, kyc_status TEXT
) LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, extensions AS $$
BEGIN
  IF pickup_lat IS NULL OR pickup_lng IS NULL OR pickup_lat NOT BETWEEN -90 AND 90 OR pickup_lng NOT BETWEEN -180 AND 180 THEN
    RAISE EXCEPTION 'Invalid pickup coordinates' USING ERRCODE='22023';
  END IF;
  RETURN QUERY
  SELECT r.id::text, r.user_id::text,
    extensions.ST_Distance(
      extensions.ST_SetSRID(extensions.ST_MakePoint(r.lng::double precision,r.lat::double precision),4326)::extensions.geography,
      extensions.ST_SetSRID(extensions.ST_MakePoint(pickup_lng,pickup_lat),4326)::extensions.geography
    )::double precision,
    r.lat::double precision, r.lng::double precision, upper(r.status)::text, upper(r.kyc_status)::text
  FROM public.riders AS r
  WHERE r.lat BETWEEN -90 AND 90 AND r.lng BETWEEN -180 AND 180
    AND upper(coalesce(r.status,'')) = 'ONLINE'
    AND upper(coalesce(r.kyc_status,'')) IN ('APPROVED','VERIFIED')
    AND upper(coalesce(r.data_mode,'')) = 'LIVE'
    AND extensions.ST_DWithin(
      extensions.ST_SetSRID(extensions.ST_MakePoint(r.lng::double precision,r.lat::double precision),4326)::extensions.geography,
      extensions.ST_SetSRID(extensions.ST_MakePoint(pickup_lng,pickup_lat),4326)::extensions.geography,
      greatest(100.0,least(coalesce(max_radius_meters,5000.0),50000.0))
    )
  ORDER BY 3
  LIMIT greatest(1,least(coalesce(max_limit,10),50));
END; $$;

-- PostgreSQL functions grant EXECUTE to PUBLIC by default; explicitly close that path.
REVOKE ALL ON FUNCTION public.match_nearest_riders(DOUBLE PRECISION,DOUBLE PRECISION,DOUBLE PRECISION,INT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.match_nearest_riders(DOUBLE PRECISION,DOUBLE PRECISION,DOUBLE PRECISION,INT) TO service_role;
REVOKE ALL ON FUNCTION public.schedule_dlq_retry(TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_dlq_retry(TEXT,TEXT) TO service_role;

-- 7. Supabase Realtime Replication: menu_items, dispatch_jobs, orders
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

DO $$
BEGIN
    -- Ensure menu_items is published to supabase_realtime
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menu_items') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'menu_items'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
        END IF;
    END IF;

    -- Ensure dispatch_jobs is published to supabase_realtime
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dispatch_jobs') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'dispatch_jobs'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_jobs;
        END IF;
    END IF;

    -- Ensure orders is published to supabase_realtime
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
        END IF;
    END IF;
END $$;
