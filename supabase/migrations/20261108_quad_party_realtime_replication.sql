-- ============================================================================
-- OrderKing Migration: Quad-Party Real-Time Replication Publications
-- Enables sub-second WebSocket synchronization across Customer, Partner KDS,
-- Rider Fleet, and Umar OS via Supabase Realtime.
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

DO $$
BEGIN
    -- 1. Table: orders
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        ALTER TABLE public.orders REPLICA IDENTITY FULL;
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
        END IF;
    END IF;

    -- 2. Table: orderking_orders
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orderking_orders') THEN
        ALTER TABLE public.orderking_orders REPLICA IDENTITY FULL;
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orderking_orders'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.orderking_orders;
        END IF;
    END IF;

    -- 3. Table: dispatch_assignments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dispatch_assignments') THEN
        ALTER TABLE public.dispatch_assignments REPLICA IDENTITY FULL;
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'dispatch_assignments'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_assignments;
        END IF;
    END IF;

    -- 4. Table: riders
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'riders') THEN
        ALTER TABLE public.riders REPLICA IDENTITY FULL;
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'riders'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.riders;
        END IF;
    END IF;

    -- 5. Table: rider_ephemeral_telemetry
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rider_ephemeral_telemetry') THEN
        ALTER TABLE public.rider_ephemeral_telemetry REPLICA IDENTITY FULL;
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rider_ephemeral_telemetry'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_ephemeral_telemetry;
        END IF;
    END IF;

    -- 6. Table: order_events
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_events') THEN
        ALTER TABLE public.order_events REPLICA IDENTITY FULL;
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_events'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.order_events;
        END IF;
    END IF;
END $$;
