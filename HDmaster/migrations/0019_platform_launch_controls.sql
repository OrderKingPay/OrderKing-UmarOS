-- HDmaster/migrations/0019_platform_launch_controls.sql
-- Production launch controls and sensitive browser-grant lockdown.
-- Safe to re-run: constraints/table creation and revokes are idempotent.

DO $$
BEGIN
  IF to_regclass('public.organizations') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'organizations_data_mode_check'
         AND conrelid = 'public.organizations'::regclass
     ) THEN
    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_data_mode_check
      CHECK (data_mode IN ('SIMULATED', 'PILOT', 'LIVE'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.platform_launch_controls (
  org_id text PRIMARY KEY REFERENCES public.organizations(id) ON DELETE RESTRICT,
  data_mode text NOT NULL DEFAULT 'SIMULATED'
    CHECK (data_mode IN ('SIMULATED', 'PILOT', 'LIVE')),
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
REVOKE ALL ON TABLE public.platform_launch_controls FROM anon, authenticated;

INSERT INTO public.platform_launch_controls (org_id)
VALUES ('org_orderking')
ON CONFLICT (org_id) DO NOTHING;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'account','session','verification','user','otp_challenges',
    'employee_logins','employees','profiles','organizations',
    'payments','payment_intents','payment_webhook_events','refunds',
    'kingpay_transactions','kingpay_wallets',
    'journal_entries','journal_lines','ledger_entries','ledger_transactions','ledger_chain_state',
    'finance_reconciliations','settlement_batches','settlement_items',
    'founder_approvals','founder_client_leads','founder_enterprise_blueprints','founder_platforms',
    'founder_remote_gigs','founder_separable_modules',
    'audit_logs','security_event_ledger','risk_signals','idempotency_keys',
    'platform_launch_controls','system_config','platform_settings','app_config'
  ]
  LOOP
    IF to_regclass('public.' || quote_ident(t)) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END $$;
