import type { DataMode } from "@/lib/orderking/types";
import type { Permission } from "@/lib/orderking/permissions";

export type AiToolRisk = "READ" | "LOW_RISK_WRITE" | "FINANCIAL" | "HIGH_RISK" | "EMERGENCY";
export type AiToolAvailability = "READ_ONLY" | "WRITE" | "APPROVAL_REQUIRED";
export type AiToolScope = "ORG" | "CITY" | "AREA" | "OWNER";

export type MasterAiToolSpec = {
  name: string;
  description: string;
  requiredPermission: Permission;
  allowedRoles: readonly string[];
  dataScope: AiToolScope;
  availableIn: readonly DataMode[];
  risk: AiToolRisk;
  availability: AiToolAvailability;
  confirmationRequired: boolean;
  auditRequired: boolean;
  reversible: boolean;
  financialImpact: boolean;
};

const ALL_READ_ROLES = ["SUPER_ADMIN", "CEO", "COO", "AREA_MANAGER", "ANALYST", "AUDITOR"] as const;
const OPS_ROLES = ["SUPER_ADMIN", "CEO", "COO", "AREA_MANAGER"] as const;
const FINANCE_ROLES = ["SUPER_ADMIN", "CEO", "COO", "FINANCE"] as const;
const SUPPORT_ROLES = ["SUPER_ADMIN", "CEO", "COO", "CUSTOMER_SUPPORT", "RESTAURANT_SUPPORT", "RIDER_SUPPORT"] as const;
const ENGINEERING_ROLES = ["SUPER_ADMIN", "CEO", "COO"] as const;
const LIVE = ["SANDBOX", "PRODUCTION"] as const;

const read = (
  name: string,
  description: string,
  requiredPermission: Permission,
  allowedRoles: readonly string[] = ALL_READ_ROLES,
  dataScope: AiToolScope = "ORG",
  financialImpact = false,
): MasterAiToolSpec => ({
  name, description, requiredPermission, allowedRoles, dataScope,
  availableIn: LIVE, risk: "READ", availability: "READ_ONLY",
  confirmationRequired: false, auditRequired: true, reversible: true, financialImpact,
});

const write = (
  name: string,
  description: string,
  requiredPermission: Permission,
  risk: AiToolRisk,
  confirmationRequired: boolean,
  allowedRoles: readonly string[] = OPS_ROLES,
  financialImpact = false,
): MasterAiToolSpec => ({
  name, description, requiredPermission, allowedRoles, dataScope: "ORG",
  availableIn: LIVE, risk, availability: confirmationRequired ? "APPROVAL_REQUIRED" : "WRITE",
  confirmationRequired, auditRequired: true, reversible: risk !== "EMERGENCY", financialImpact,
});

/**
 * Master AI policy registry. This is the capability contract for the
 * operating AI and engineering agent. Registry policy never grants access;
 * every implementation must still pass live RBAC, tenant scope, data-mode,
 * validation, idempotency and audit checks before execution.
 */
export const MASTER_AI_TOOL_REGISTRY = {
  // Orders
  get_order: read("get_order", "Inspect a canonical order and authorized timeline.", "view_orders"),
  search_orders: read("search_orders", "Search canonical orders by authorized operational filters.", "view_orders"),
  list_recent_orders: read("list_recent_orders", "List recent orders for the authorized scope.", "view_orders"),
  list_delayed_orders: read("list_delayed_orders", "Identify orders exceeding operational thresholds.", "view_orders"),
  get_order_timeline: read("get_order_timeline", "Read the canonical order event timeline.", "view_orders"),
  get_order_events: read("get_order_events", "Read audited events for an order.", "view_audit_logs"),
  explain_order: read("explain_order", "Explain an order state using verified system events and calculations.", "view_orders"),
  cancel_order: write("cancel_order", "Request cancellation through the canonical order state machine.", "cancel_orders", "HIGH_RISK", true),
  reassign_order: write("reassign_order", "Request an authorized rider reassignment.", "modify_orders", "LOW_RISK_WRITE", false),
  retry_order_operation: write("retry_order_operation", "Retry a safe idempotent order operation after diagnosis.", "modify_orders", "LOW_RISK_WRITE", false),
  mark_intervention_required: write("mark_intervention_required", "Flag an order for human operational intervention.", "modify_orders", "LOW_RISK_WRITE", false),

  // Restaurants
  get_restaurant: read("get_restaurant", "Inspect an authorized restaurant and operational health.", "view_restaurants"),
  restaurant_health: read("restaurant_health", "Calculate restaurant operational health from verified data.", "view_restaurants"),
  restaurant_orders: read("restaurant_orders", "Read restaurant order activity and status distribution.", "view_orders"),
  restaurant_complaints: read("restaurant_complaints", "Read restaurant-related complaint cases.", "manage_support", SUPPORT_ROLES),
  restaurant_menu_status: read("restaurant_menu_status", "Inspect menu, availability and synchronization status.", "view_restaurants"),
  restaurant_hours: read("restaurant_hours", "Inspect operational hours and online/offline state.", "view_restaurants"),
  restaurant_settlement: read("restaurant_settlement", "Inspect restaurant settlement status and deductions.", "view_finance", FINANCE_ROLES, "ORG", true),
  restaurant_performance: read("restaurant_performance", "Analyze restaurant sales, acceptance, prep and service metrics.", "view_analytics"),
  set_restaurant_online: write("set_restaurant_online", "Change an authorized restaurant online/offline state.", "approve_restaurants", "LOW_RISK_WRITE", false),
  sync_restaurant_menu: write("sync_restaurant_menu", "Trigger a validated menu synchronization.", "manage_cms", "LOW_RISK_WRITE", false),
  onboard_restaurant: write("onboard_restaurant", "Onboard and activate a new restaurant with hours, zone, and financial terms.", "approve_restaurants", "LOW_RISK_WRITE", false),
  generate_menu: write("generate_menu", "Generate or update a complete restaurant menu with dishes, diet tags, and prices.", "manage_cms", "LOW_RISK_WRITE", false),

  // Riders / dispatch
  get_rider: read("get_rider", "Inspect an authorized rider and delivery-health information.", "view_riders"),
  rider_health: read("rider_health", "Calculate rider operational health from verified data.", "view_riders"),
  rider_active_orders: read("rider_active_orders", "Read a rider's active delivery workload.", "view_orders"),
  rider_location: read("rider_location", "Read the latest authorized rider location snapshot.", "view_riders"),
  rider_offer_status: read("rider_offer_status", "Inspect rider dispatch offers and expiry state.", "view_riders"),
  rider_earnings: read("rider_earnings", "Inspect verified rider earnings and settlement records.", "view_finance", FINANCE_ROLES, "ORG", true),
  rider_complaints: read("rider_complaints", "Read rider complaint cases and SLA state.", "manage_support", SUPPORT_ROLES),
  rider_performance: read("rider_performance", "Analyze rider acceptance, delivery and reliability metrics.", "view_analytics"),
  reassign_rider: write("reassign_rider", "Request reassignment of a delivery through canonical dispatch.", "modify_orders", "LOW_RISK_WRITE", false),
  onboard_rider: write("onboard_rider", "Onboard and KYC-verify a delivery rider partner.", "approve_riders", "LOW_RISK_WRITE", false),

  // Customers / support
  get_customer: read("get_customer", "Inspect an authorized customer profile within scope.", "view_customers"),
  customer_orders: read("customer_orders", "Read authorized customer order history.", "view_orders"),
  customer_complaints: read("customer_complaints", "Read customer complaints and support history.", "manage_support", SUPPORT_ROLES),
  customer_refunds: read("customer_refunds", "Read authorized customer refund history.", "issue_refunds", SUPPORT_ROLES, "ORG", true),
  customer_payment_status: read("customer_payment_status", "Inspect customer payment status without exposing payment secrets.", "view_finance", FINANCE_ROLES, "ORG", true),
  customer_support_history: read("customer_support_history", "Read authorized support interactions.", "manage_support", SUPPORT_ROLES),
  create_support_case: write("create_support_case", "Create a canonical support case with SLA and audit metadata.", "manage_support", "LOW_RISK_WRITE", false, SUPPORT_ROLES),

  // Finance
  get_payment: read("get_payment", "Inspect a canonical payment record and lifecycle.", "view_finance", FINANCE_ROLES, "ORG", true),
  verify_payment: write("verify_payment", "Run a non-destructive payment verification/reconciliation check.", "view_finance", "LOW_RISK_WRITE", false, FINANCE_ROLES, true),
  get_ledger_entries: read("get_ledger_entries", "Read immutable financial ledger entries.", "view_finance", FINANCE_ROLES, "ORG", true),
  reconcile_payment: write("reconcile_payment", "Run an idempotent payment reconciliation operation.", "view_finance", "LOW_RISK_WRITE", false, FINANCE_ROLES, true),
  refund_preview: read("refund_preview", "Calculate a refund preview without moving money.", "issue_refunds", FINANCE_ROLES, "ORG", true),
  issue_refund: write("issue_refund", "Issue an authorized refund through the guarded financial workflow.", "issue_refunds", "FINANCIAL", true, FINANCE_ROLES, true),
  settlement_preview: read("settlement_preview", "Preview merchant settlement calculations.", "approve_settlements", FINANCE_ROLES, "ORG", true),
  settlement_status: read("settlement_status", "Inspect settlement state and reconciliation exceptions.", "view_finance", FINANCE_ROLES, "ORG", true),
  commission_breakdown: read("commission_breakdown", "Explain commission calculations from ledger-backed data.", "view_finance", FINANCE_ROLES, "ORG", true),
  promotion_funder_breakdown: read("promotion_funder_breakdown", "Explain promotion funding between platform and merchant.", "view_finance", FINANCE_ROLES, "ORG", true),

  // Analytics / BI
  daily_report: read("daily_report", "Build a daily operating report from actual HDmaster data.", "view_analytics"),
  weekly_report: read("weekly_report", "Build a weekly operating report from actual HDmaster data.", "view_analytics"),
  monthly_report: read("monthly_report", "Build a monthly operating report from actual HDmaster data.", "view_analytics"),
  generate_executive_report: read("generate_executive_report", "Build an executive summary report with daily GMV, revenue, and SLAs.", "view_analytics"),
  generate_scheduled_report: read("generate_scheduled_report", "Build scheduled or on-demand operational reports for restaurants, riders, or platform with strict tenant isolation.", "view_analytics"),
  revenue_report: read("revenue_report", "Calculate revenue from verified order and financial records.", "view_analytics", ALL_READ_ROLES, "ORG", true),
  GMV_report: read("GMV_report", "Calculate GMV from canonical orders.", "view_analytics", ALL_READ_ROLES, "ORG", true),
  AOV_report: read("AOV_report", "Calculate average order value from canonical orders.", "view_analytics"),
  order_success_rate: read("order_success_rate", "Calculate completed-order success rate.", "view_analytics"),
  cancellation_rate: read("cancellation_rate", "Calculate cancellation rate with scope and period.", "view_analytics"),
  refund_rate: read("refund_rate", "Calculate refund rate from financial records.", "view_analytics", ALL_READ_ROLES, "ORG", true),
  restaurant_acceptance_rate: read("restaurant_acceptance_rate", "Calculate restaurant acceptance and timeout metrics.", "view_analytics"),
  rider_acceptance_rate: read("rider_acceptance_rate", "Calculate rider offer acceptance metrics.", "view_analytics"),
  delivery_time_report: read("delivery_time_report", "Analyze prep, pickup and delivery durations.", "view_analytics"),
  customer_retention: read("customer_retention", "Calculate retention cohorts from actual customer orders.", "view_analytics"),
  cohort_report: read("cohort_report", "Build customer cohort analysis from verified data.", "view_analytics"),
  profitability_report: read("profitability_report", "Calculate contribution and profitability using ledger-backed inputs.", "view_finance", FINANCE_ROLES, "ORG", true),

  // Risk / support / command center
  get_support_tickets: read("get_support_tickets", "Inspect authorized support queues and ticket state.", "manage_support", SUPPORT_ROLES),
  get_risk_signals: read("get_risk_signals", "Inspect authorized fraud and operational risk signals.", "view_risk", ["SUPER_ADMIN", "CEO", "COO", "FRAUD", "AUDITOR"]),
  get_delivery_metrics: read("get_delivery_metrics", "Inspect delivery and delayed-order metrics.", "view_orders"),
  auto_diagnose_and_prepare_fix: write("auto_diagnose_and_prepare_fix", "Autonomously diagnose system bottlenecks, order delays, and dispatch issues, preparing actionable remedial fixes with owner approval.", "modify_orders", "LOW_RISK_WRITE", false),
  get_campaign_metrics: read("get_campaign_metrics", "Inspect authorized promotion performance.", "manage_promotions", ["SUPER_ADMIN", "CEO", "COO", "MARKETING"]),
  get_dashboard: read("get_dashboard", "Read the authorized command-center dashboard snapshot.", "view_analytics"),
  get_ceo_brief: read("get_ceo_brief", "Build an executive operating brief from authorized HDmaster data.", "access_CEO_dashboard", ["SUPER_ADMIN", "CEO"], "OWNER", true),

  // Engineering agent — inspection, diagnosis and verification
  get_repository_status: read("get_repository_status", "Inspect repository identity, branch and engineering health.", "access_AI", ENGINEERING_ROLES, "OWNER"),
  get_git_status: read("get_git_status", "Inspect working-tree and branch state through authorized tooling.", "access_AI", ENGINEERING_ROLES, "OWNER"),
  get_recent_commits: read("get_recent_commits", "Inspect recent engineering changes and provenance.", "access_AI", ENGINEERING_ROLES, "OWNER"),
  inspect_file: read("inspect_file", "Read an authorized source/config file for diagnosis.", "access_AI", ENGINEERING_ROLES, "OWNER"),
  search_code: read("search_code", "Search the authorized codebase for symbols, dependencies and failures.", "access_AI", ENGINEERING_ROLES, "OWNER"),
  run_typecheck: write("run_typecheck", "Run the repository typecheck without changing source code.", "access_AI", "LOW_RISK_WRITE", false, ENGINEERING_ROLES),
  run_tests: write("run_tests", "Run the repository test suite without changing source code.", "access_AI", "LOW_RISK_WRITE", false, ENGINEERING_ROLES),
  run_lint: write("run_lint", "Run linting without changing source code.", "access_AI", "LOW_RISK_WRITE", false, ENGINEERING_ROLES),
  run_build: write("run_build", "Run a production build verification without deploying.", "access_AI", "LOW_RISK_WRITE", false, ENGINEERING_ROLES),
  inspect_ci: read("inspect_ci", "Inspect CI workflow state and required checks.", "access_AI", ENGINEERING_ROLES, "OWNER"),
  inspect_failed_ci: read("inspect_failed_ci", "Inspect failed CI jobs and logs to establish root cause.", "access_AI", ENGINEERING_ROLES, "OWNER"),
  diagnose_ci: write("diagnose_ci", "Produce a structured CI root-cause diagnosis from verified logs.", "access_AI", "LOW_RISK_WRITE", false, ENGINEERING_ROLES),
  create_patch: write("create_patch", "Prepare a minimal source patch after root-cause analysis.", "access_AI", "HIGH_RISK", true, ENGINEERING_ROLES),
  apply_patch: write("apply_patch", "Apply an authorized engineering patch to the repository.", "access_AI", "HIGH_RISK", true, ENGINEERING_ROLES),
  run_targeted_test: write("run_targeted_test", "Run focused verification for an engineering change.", "access_AI", "LOW_RISK_WRITE", false, ENGINEERING_ROLES),
  create_engineering_task: write("create_engineering_task", "Create a traceable engineering task with evidence and acceptance criteria.", "access_AI", "LOW_RISK_WRITE", false, ENGINEERING_ROLES),
  inspect_dependencies: read("inspect_dependencies", "Inspect dependency manifests and lockfile provenance.", "access_AI", ENGINEERING_ROLES, "OWNER"),
  inspect_security_findings: read("inspect_security_findings", "Inspect repository security findings and dependency risks.", "access_AI", ENGINEERING_ROLES, "OWNER"),

  // AI governance / observability
  inspect_ai_health: read("inspect_ai_health", "Inspect AI tool health, failures, latency and safety signals.", "access_AI", ENGINEERING_ROLES, "OWNER"),
  inspect_ai_audit: read("inspect_ai_audit", "Inspect AI actions, confirmations, denials and audit records.", "access_AI", ENGINEERING_ROLES, "OWNER"),
  evaluate_ai_tool: write("evaluate_ai_tool", "Run a deterministic evaluation against an AI tool contract.", "access_AI", "LOW_RISK_WRITE", false, ENGINEERING_ROLES),
  run_prompt_injection_test: write("run_prompt_injection_test", "Run security evaluations against untrusted AI inputs and tool boundaries.", "access_AI", "HIGH_RISK", true, ENGINEERING_ROLES),
  create_ai_evaluation_case: write("create_ai_evaluation_case", "Create a reproducible AI evaluation case and expected outcome.", "access_AI", "LOW_RISK_WRITE", false, ENGINEERING_ROLES),

  // Autonomous AI Employee Suite (Fintech, Ledger, Fraud, Settlements)
  reconcile_wallet_ledger: read("reconcile_wallet_ledger", "Autonomously audit double-entry ledger invariant, escrow float, and UPI deposits without human accountants.", "view_finance", FINANCE_ROLES, "ORG", true),
  analyze_fintech_risk: read("analyze_fintech_risk", "Autonomously evaluate user velocity, multi-accounting, and referral loop abuse to shield platform capital.", "view_risk", ["SUPER_ADMIN", "CEO", "COO", "FRAUD", "AUDITOR"]),
  run_weekly_settlements: write("run_weekly_settlements", "Autonomously generate Wednesday weekly settlements with statutory GST, TCS, and TDS deductions.", "view_finance", "HIGH_RISK", true, FINANCE_ROLES, true),
  optimize_affiliate_alliances: write("optimize_affiliate_alliances", "Evaluate active platform promotions and partner offers from PostgreSQL.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO", "COO", "MARKETING"]),
  audit_customer_grievance_compliance: read("audit_customer_grievance_compliance", "Autonomously audit customer complaints, SLA breaches, and statutory ombudsman escalations.", "manage_support", SUPPORT_ROLES),
  audit_merchant_and_rider_grievance_compliance: read("audit_merchant_and_rider_grievance_compliance", "Autonomously audit restaurant and rider statutory grievances, insurance claims, and ombudsman escalations.", "manage_support", SUPPORT_ROLES),
  audit_offline_2g_settlement_sync: read("audit_offline_2g_settlement_sync", "Autonomously verify offline 2G transaction queue, cryptographic tokens, and batch settlement integrity.", "view_finance", FINANCE_ROLES, "ORG", true),

  // Executive Operations (Strategy, Alliances, Treasury, KingPay)
  maximize_profit_margins: write("maximize_profit_margins", "Analyze and tune take-rates, packaging fees, and dynamic delivery margins to maximize operational EBITDA.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO", "COO", "FINANCE"], true),
  harvest_financial_bonuses: write("harvest_financial_bonuses", "Discover and claim payment gateway rebates, GST input tax credits, and promotional co-funding splits.", "view_finance", "LOW_RISK_WRITE", false, FINANCE_ROLES, true),
  generate_corporate_alliance: write("generate_corporate_alliance", "Create structured B2B corporate catering accounts and co-funded payment partnerships.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO", "COO", "MARKETING"]),
  customer_mind_reader_recommend: read("customer_mind_reader_recommend", "Contextually recommend menu items using time of day, category demand, and previous order history.", "view_customers", ALL_READ_ROLES),
  audit_loan_and_card_affiliate_commissions: read("audit_loan_and_card_affiliate_commissions", "Audit commercial loan and financial lead conversions, tracking IDs, and partner commission payouts.", "view_finance", FINANCE_ROLES, "ORG", true),
  audit_bajaj_finance_affiliate_and_emi_leads: read("audit_bajaj_finance_affiliate_and_emi_leads", "Audit equipment financing and consumer credit lead conversions with zero commission leakage.", "view_finance", FINANCE_ROLES, "ORG", true),
  orchestrate_universal_pos_printer_sync: read("orchestrate_universal_pos_printer_sync", "Audit and orchestrate universal POS/KOT connectors and thermal receipt printer hardware health across all restaurants.", "view_restaurants", OPS_ROLES, "ORG", false),
  optimize_kingpay_flow: write("optimize_kingpay_flow", "Optimize KingPay checkout routing, auto-reload triggers, and cash-back rewards.", "view_finance", "LOW_RISK_WRITE", false, FINANCE_ROLES, true),

  // Operational Technologies (Competitive Intelligence, Pre-Dispatch, Treasury Yield, Fraud Sentinel, System Health)
  market_competitive_radar: read("market_competitive_radar", "Monitor local delivery times, pricing elasticity, and service coverage.", "view_analytics", ALL_READ_ROLES),
  predictive_pre_dispatch: write("predictive_pre_dispatch", "Coordinate kitchen preparation time and courier dispatch arrival.", "modify_orders", "LOW_RISK_WRITE", false, OPS_ROLES),
  optimize_treasury_yield: write("optimize_treasury_yield", "Calculate working capital allocation and liquid balance returns.", "view_finance", "LOW_RISK_WRITE", false, FINANCE_ROLES, true),
  neural_fraud_sentinel: read("neural_fraud_sentinel", "Detect abnormal order velocity, GPS spoofing, and promotional abuse.", "view_risk", ["SUPER_ADMIN", "CEO", "COO", "FRAUD", "AUDITOR"]),
  autonomous_hotpatch_engine: write("autonomous_hotpatch_engine", "Execute runtime diagnostic checks and configuration updates across OrderKing services.", "access_AI", "HIGH_RISK", true, ENGINEERING_ROLES),
  run_hyper_cognitive_diagnostic_and_healing: write("run_hyper_cognitive_diagnostic_and_healing", "Run automated diagnostic health checks, anomaly detection, and database connection checks across platforms.", "access_AI", "LOW_RISK_WRITE", false, ENGINEERING_ROLES),
  autonomous_workforce_replacement_orchestrator: write("autonomous_workforce_replacement_orchestrator", "Automate operational task routing across finances, menu management, and support queues.", "access_AI", "LOW_RISK_WRITE", false, ENGINEERING_ROLES, true),
  autonomous_mind_reader_telemetry: read("autonomous_mind_reader_telemetry", "Monitor customer order conversion rate and dish preference telemetry.", "view_analytics", ALL_READ_ROLES),
  autonomous_revenue_and_affiliate_maximizer: write("autonomous_revenue_and_affiliate_maximizer", "Audit platform fee collection and third-party service integration margins.", "view_finance", "LOW_RISK_WRITE", false, FINANCE_ROLES, true),
  autonomous_customer_addiction_and_gamification_director: write("autonomous_customer_addiction_and_gamification_director", "Manage customer reward loyalty points, coin burn rates, and retention programs.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO", "COO", "MARKETING"]),
  autonomous_universal_hardware_and_pos_director: write("autonomous_universal_hardware_and_pos_director", "Monitor restaurant POS integrations and thermal receipt printer connectivity.", "view_restaurants", "LOW_RISK_WRITE", false, OPS_ROLES),
  founder_private_cash_vault_telemetry: read("founder_private_cash_vault_telemetry", "Review customer payment collections, merchant disbursements, and operational cash float.", "view_finance", ["SUPER_ADMIN", "CEO"]),
  founder_profit_maximizer_and_tax_arbitrage: read("founder_profit_maximizer_and_tax_arbitrage", "Review GST Input Tax Credit claims, payment processing costs, and contribution margins.", "view_finance", ["SUPER_ADMIN", "CEO"]),
  autonomous_legal_income_discovery_engine: read("autonomous_legal_income_discovery_engine", "Evaluate compliant statutory revenue streams and commercial partnership opportunities.", "view_finance", ["SUPER_ADMIN", "CEO"]),
  autonomous_maximum_force_profit_orchestrator: write("autonomous_maximum_force_profit_orchestrator", "Audit multi-stream financial performance and operational cost efficiency.", "view_finance", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], true),
  autonomous_High_Performance_profit_and_addiction_director: write("autonomous_High_Performance_profit_and_addiction_director", "Coordinate merchant SaaS, digital payments, and repeat customer retention.", "view_finance", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], true),
  autonomous_go_live_production_director: write("autonomous_go_live_production_director", "Audit production readiness across databases, payment gateways, SMS gateways, and mapping APIs.", "manage_platform_settings", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  autonomous_night_safety_and_long_distance_director: write("autonomous_night_safety_and_long_distance_director", "Configure delivery distance tiers, late-night operating hours, and rider safety parameters.", "manage_platform_settings", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  autonomous_prestige_subsidies_and_viral_growth_director: write("autonomous_prestige_subsidies_and_viral_growth_director", "Evaluate government startup subsidies, technology grants, and customer referral programs.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  autonomous_omni_prestige_grant_and_hyper_growth_director: write("autonomous_omni_prestige_grant_and_hyper_growth_director", "Manage technology grants, institutional partnerships, and local marketing channels.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  autonomous_opportunity_radar_and_auto_booking_director: write("autonomous_opportunity_radar_and_auto_booking_director", "Monitor eligible government startup grants and generate formal application dossiers.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  autonomous_meta_and_google_ad_domination_orchestrator: write("autonomous_meta_and_google_ad_domination_orchestrator", "Manage local digital advertising campaigns across Meta, Google Search, and messaging channels.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  autonomous_strategic_nearest_rider_and_fleet_orchestrator: write("autonomous_strategic_nearest_rider_and_fleet_orchestrator", "Calibrate GPS proximity matrix, execute sequential cascading dispatch, and balance fleet load.", "modify_orders", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  autonomous_off_peak_demand_stimulator_and_revenue_multiplier: write("autonomous_off_peak_demand_stimulator_and_revenue_multiplier", "Configure off-peak promotions for afternoon and late-night ordering windows.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], true),
  autonomous_planetary_multi_repo_watchdog_and_self_healing_core: write("autonomous_planetary_multi_repo_watchdog_and_self_healing_core", "Multi-repository integrity check: verify database schema parity, API contracts, and platform uptime.", "access_AI", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  autonomous_superpower_revenue_harvester_and_cash_generator: write("autonomous_superpower_revenue_harvester_and_cash_generator", "Calculate and optimize statutory income streams, merchant SaaS, and government grants with double-entry balancing.", "view_finance", "FINANCIAL", false, ["SUPER_ADMIN", "CEO"], true),
  autonomous_corporate_catering_rfp_and_contract_dispatcher: write("autonomous_corporate_catering_rfp_and_contract_dispatcher", "Generate and dispatch formal corporate catering contracts for local institutions and enterprises.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], true),
  autonomous_meity_zero_mdr_subsidy_claim_generator: write("autonomous_meity_zero_mdr_subsidy_claim_generator", "Calculate quarterly UPI and RuPay transaction volumes and prepare statutory reimbursement filings.", "view_finance", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], true),
  autonomous_planetary_viral_and_spreadable_tech_engine: write("autonomous_planetary_viral_and_spreadable_tech_engine", "Configure edge caching, customer referral loops, dynamic metadata, and messaging invitations.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  search_travel_flights: read("search_travel_flights", "Search for flights via external real providers (e.g. Amadeus).", "view_orders", ALL_READ_ROLES, "ORG", false),
  book_travel_flight: write("book_travel_flight", "Book a travel flight via external real provider.", "modify_orders", "LOW_RISK_WRITE", true, OPS_ROLES, true),
} as const satisfies Record<string, MasterAiToolSpec>;

export type MasterAiToolName = keyof typeof MASTER_AI_TOOL_REGISTRY;

export function getMasterAiToolSpec(name: string): MasterAiToolSpec | null {
  return name in MASTER_AI_TOOL_REGISTRY
    ? MASTER_AI_TOOL_REGISTRY[name as MasterAiToolName]
    : null;
}

export function toolAvailableInMode(name: string, mode: DataMode): boolean {
  return getMasterAiToolSpec(name)?.availableIn.includes(mode) ?? false;
}
