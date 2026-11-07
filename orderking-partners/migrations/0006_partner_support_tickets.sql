-- Migration 0006: Partner Help Center & Support Tickets Desk
-- OrderKing Restaurant Partner Platform (Zomato-level parity)

CREATE TABLE IF NOT EXISTS partner_support_tickets (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  ticket_number TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- 'PAYOUT_ISSUE', 'ORDER_DISPUTE', 'MENU_UPDATE_REQUEST', 'HARDWARE_POS_SYNC', 'FSSAI_COMPLIANCE', 'OTHER'
  priority TEXT NOT NULL DEFAULT 'NORMAL', -- 'LOW', 'NORMAL', 'HIGH', 'CRITICAL'
  status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'AI_INVESTIGATING', 'RESOLVED', 'ESCALATED_TO_ADMIN'
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  order_id TEXT,
  attachment_url TEXT,
  ai_resolution_summary TEXT,
  resolution_code TEXT,
  resolved_at TIMESTAMPTZ,
  admin_assigned_to TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_tickets_rest_status ON partner_support_tickets (restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_tickets_created ON partner_support_tickets (restaurant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS partner_ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES partner_support_tickets(id) ON DELETE CASCADE,
  restaurant_id TEXT NOT NULL,
  author_type TEXT NOT NULL, -- 'MERCHANT', 'AI_ASSISTANT', 'ADMIN'
  author_user_id TEXT,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_ticket_msg_tkt ON partner_ticket_messages (ticket_id, created_at ASC);
