export type CapabilityStatus = 'IMPLEMENTED' | 'PARTIAL' | 'BLOCKED' | 'NOT_IMPLEMENTED';

export interface Capability {
  id: string;
  domain: string;
  name: string;
  description: string;
  status: CapabilityStatus;
  health: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN';
  dependencies: string[];
  permissions: string[];
  version: string;
  rollbackPath: string | null;
  blockerReason?: string;
}

export const CAPABILITY_REGISTRY: Capability[] = [
  // PLATFORM
  { id: 'cap_plat_customers', domain: 'platform', name: 'Customer Management', description: 'View and manage customer accounts.', status: 'IMPLEMENTED', health: 'ONLINE', dependencies: ['db.user'], permissions: ['admin:read', 'admin:write'], version: '1.0.0', rollbackPath: null },
  { id: 'cap_plat_restaurants', domain: 'platform', name: 'Restaurant Onboarding', description: 'KYC and approval for new partners.', status: 'IMPLEMENTED', health: 'ONLINE', dependencies: ['db.restaurants'], permissions: ['admin:write'], version: '1.1.0', rollbackPath: null },
  { id: 'cap_plat_riders', domain: 'platform', name: 'Fleet Dispatch', description: 'Tracking and assignment of riders.', status: 'PARTIAL', health: 'DEGRADED', dependencies: ['db.riders', 'mapbox'], permissions: ['admin:write'], version: '0.9.0', rollbackPath: null, blockerReason: 'Missing Mapbox API key for live GPS.' },

  // BUSINESS
  { id: 'cap_biz_commissions', domain: 'business', name: 'Commission Engine', description: 'Dynamic fee and commission calculation.', status: 'IMPLEMENTED', health: 'ONLINE', dependencies: ['db.platform_settings'], permissions: ['finance:write'], version: '1.0.0', rollbackPath: null },
  { id: 'cap_biz_surge', domain: 'business', name: 'Surge Pricing Engine', description: 'Elastic demand multiplier.', status: 'IMPLEMENTED', health: 'ONLINE', dependencies: ['db.orders', 'db.riders'], permissions: ['finance:write'], version: '1.0.0', rollbackPath: 'v0.9.0' },
  { id: 'cap_biz_settlements', domain: 'business', name: 'Partner Settlements', description: 'Automated ledger payout to partners.', status: 'PARTIAL', health: 'DEGRADED', dependencies: ['db.partner_ledgers', 'razorpay'], permissions: ['finance:write'], version: '1.0.0', rollbackPath: null, blockerReason: 'Requires production Razorpay Route credentials.' },

  // AI
  { id: 'cap_ai_router', domain: 'ai', name: 'Multi-Model Router', description: 'Intelligent routing between AI providers.', status: 'IMPLEMENTED', health: 'ONLINE', dependencies: ['gemini', 'openai'], permissions: ['system:read'], version: '1.2.0', rollbackPath: 'v1.1.0' },
  { id: 'cap_ai_umar_voice', domain: 'ai', name: 'UMAR Voice Command', description: 'Conversational control layer for Founder.', status: 'IMPLEMENTED', health: 'ONLINE', dependencies: ['gemini', 'db.system_audit_logs'], permissions: ['founder:execute'], version: '2.0.0', rollbackPath: 'v1.0.0' },

  // AUTOMATION
  { id: 'cap_auto_engine', domain: 'automation', name: 'Event Automation Engine', description: 'Trigger-based workflow orchestrator.', status: 'IMPLEMENTED', health: 'ONLINE', dependencies: ['db.system_audit_logs'], permissions: ['system:write'], version: '1.0.0', rollbackPath: null },
  
  // ALGORITHMS
  { id: 'cap_algo_ranking', domain: 'algorithms', name: 'Restaurant Ranking', description: 'Search and discovery feed ranking.', status: 'NOT_IMPLEMENTED', health: 'UNKNOWN', dependencies: ['db.restaurants'], permissions: ['admin:write'], version: '0.0.0', rollbackPath: null, blockerReason: 'Requires Elasticsearch or pgvector integration.' },

  // CONTENT
  { id: 'cap_content_dailyhub', domain: 'content', name: 'Daily Hub / Gig Economy', description: 'AI Tutor curated remote jobs and schemes.', status: 'IMPLEMENTED', health: 'ONLINE', dependencies: ['db'], permissions: ['content:write'], version: '1.0.0', rollbackPath: null },
  { id: 'cap_content_localization', domain: 'content', name: 'Language System', description: 'Multi-dialect string dictionary.', status: 'IMPLEMENTED', health: 'ONLINE', dependencies: [], permissions: ['content:write'], version: '1.0.0', rollbackPath: null },

  // SECURITY
  { id: 'cap_sec_audit', domain: 'security', name: 'Immutable Audit Trail', description: 'System-wide event logging.', status: 'IMPLEMENTED', health: 'ONLINE', dependencies: ['db.system_audit_logs'], permissions: ['audit:read'], version: '1.0.0', rollbackPath: null },
  { id: 'cap_sec_rbac', domain: 'security', name: 'Role-Based Access Control', description: 'Strict permission gating for API routes.', status: 'PARTIAL', health: 'DEGRADED', dependencies: ['db.user_roles'], permissions: ['admin:write'], version: '0.5.0', rollbackPath: null, blockerReason: 'Session middleware bypass exists on edge routes.' },
];
