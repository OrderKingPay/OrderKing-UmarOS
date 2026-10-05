CREATE TABLE IF NOT EXISTS public.platform_launch_controls (
  org_id text PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  data_mode text NOT NULL DEFAULT 'SIMULATED' CHECK (data_mode IN ('SIMULATED','PILOT','LIVE')),
  public_launch boolean NOT NULL DEFAULT false,
  controlled_pilot boolean NOT NULL DEFAULT false,
  payments_mode text NOT NULL DEFAULT 'SANDBOX',
  rider_gps_enabled boolean NOT NULL DEFAULT false,
  dispatch_enabled boolean NOT NULL DEFAULT false,
  kingpay_merchant_enabled boolean NOT NULL DEFAULT false,
  kingpay_consumer_upi_enabled boolean NOT NULL DEFAULT false,
  travel_enabled boolean NOT NULL DEFAULT false,
  task_marketplace_enabled boolean NOT NULL DEFAULT false,
  vip_enabled boolean NOT NULL DEFAULT false,
  ai_support_enabled boolean NOT NULL DEFAULT true,
  observability_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_launch_controls ENABLE ROW LEVEL SECURITY;

INSERT INTO public.platform_launch_controls (
  org_id, data_mode, public_launch, controlled_pilot, payments_mode,
  rider_gps_enabled, dispatch_enabled, kingpay_merchant_enabled,
  kingpay_consumer_upi_enabled, travel_enabled, task_marketplace_enabled,
  vip_enabled, ai_support_enabled, observability_enabled
) VALUES (
  'org_orderking', 'SIMULATED', false, false, 'SANDBOX',
  false, false, false, false, false, false, false, true, true
)
ON CONFLICT (org_id) DO UPDATE SET
  data_mode = 'SIMULATED',
  public_launch = false,
  controlled_pilot = false,
  payments_mode = 'SANDBOX',
  rider_gps_enabled = false,
  dispatch_enabled = false,
  kingpay_merchant_enabled = false,
  kingpay_consumer_upi_enabled = false,
  travel_enabled = false,
  task_marketplace_enabled = false,
  vip_enabled = false,
  ai_support_enabled = true,
  observability_enabled = true,
  updated_at = now();

CREATE OR REPLACE FUNCTION public.guard_platform_launch_state()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.public_launch THEN
    IF NEW.data_mode <> 'LIVE'
       OR NOT NEW.controlled_pilot
       OR NEW.payments_mode <> 'LIVE'
       OR NOT NEW.observability_enabled THEN
      RAISE EXCEPTION 'PUBLIC_LAUNCH requires LIVE data mode, controlled pilot, LIVE payments, and observability';
    END IF;
  END IF;

  IF NEW.kingpay_consumer_upi_enabled AND NOT NEW.public_launch THEN
    RAISE EXCEPTION 'KingPay consumer UPI cannot be enabled before public launch gate';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_platform_launch_state ON public.platform_launch_controls;
CREATE TRIGGER trg_guard_platform_launch_state
BEFORE INSERT OR UPDATE ON public.platform_launch_controls
FOR EACH ROW EXECUTE FUNCTION public.guard_platform_launch_state();
