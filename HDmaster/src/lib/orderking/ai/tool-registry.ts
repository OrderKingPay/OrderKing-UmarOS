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
const LIVE = ["SIMULATED", "PRODUCTION"] as const;

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
  set_restaurant_online: write("set_restaurant_online", "Change an authorized restaurant online/offline state.", "view_restaurants", "LOW_RISK_WRITE", false),
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
  optimize_affiliate_alliances: write("optimize_affiliate_alliances", "Autonomously evaluate click-through rates and commission yields across Amazon, Flipkart, Meesho, HPCL, and IndianOil.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO", "COO", "MARKETING"]),
  audit_customer_grievance_compliance: read("audit_customer_grievance_compliance", "Autonomously audit customer complaints, SLA breaches, and statutory ombudsman escalations.", "manage_support", SUPPORT_ROLES),
  audit_merchant_and_rider_grievance_compliance: read("audit_merchant_and_rider_grievance_compliance", "Autonomously audit restaurant and rider statutory grievances, insurance claims, and ombudsman escalations.", "manage_support", SUPPORT_ROLES),
  audit_offline_2g_settlement_sync: read("audit_offline_2g_settlement_sync", "Autonomously verify offline 2G transaction queue, cryptographic tokens, and batch settlement integrity.", "view_finance", FINANCE_ROLES, "ORG", true),

  // Executive Autonomous Operations (Strategy, Alliances, Mind-Reader, Treasury, KingPay)
  maximize_profit_margins: write("maximize_profit_margins", "Autonomously analyze and tune take-rates, packaging fees, and dynamic delivery margins to maximize owner EBITDA.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO", "COO", "FINANCE"], true),
  harvest_financial_bonuses: write("harvest_financial_bonuses", "Autonomously discover and claim payment gateway rebates, GST input tax credits, and promo co-funding splits.", "view_finance", "LOW_RISK_WRITE", false, FINANCE_ROLES, true),
  generate_corporate_alliance: write("generate_corporate_alliance", "Create structured B2B corporate catering accounts and co-funded bank card discount partnerships.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO", "COO", "MARKETING"]),
  customer_mind_reader_recommend: read("customer_mind_reader_recommend", "Contextually predict customer food cravings using time, weather, localized trends, and past orders.", "view_customers", ALL_READ_ROLES),
  audit_loan_and_card_affiliate_commissions: read("audit_loan_and_card_affiliate_commissions", "Autonomously audit pre-approved loan and credit card lead conversions, tracking IDs, and partner commission payouts.", "view_finance", FINANCE_ROLES, "ORG", true),
  audit_bajaj_finance_affiliate_and_emi_leads: read("audit_bajaj_finance_affiliate_and_emi_leads", "Autonomously audit Bajaj Finserv Insta EMI card conversions, personal loans, and commercial equipment financing leads with zero commission leakage.", "view_finance", FINANCE_ROLES, "ORG", true),
  orchestrate_universal_pos_printer_sync: read("orchestrate_universal_pos_printer_sync", "Autonomously audit and orchestrate universal POS/KOT connectors (Petpooja, UrbanPiper, POSist) and thermal printer hardware health across all restaurants.", "view_restaurants", OPS_ROLES, "ORG", false),
  optimize_kingpay_flow: write("optimize_kingpay_flow", "Optimize KingPay checkout routing, auto-reload triggers, and cash-back rewards.", "view_finance", "LOW_RISK_WRITE", false, FINANCE_ROLES, true),

  // World's Highest Frontier Technologies (Competitive Radar, Quantum Pre-Dispatch, Treasury Yield, Neural Fraud, Self-Healing)
  market_competitive_radar: read("market_competitive_radar", "Real-time radar scanning competitor delivery speeds, pricing elasticity, and market opportunities.", "view_analytics", ALL_READ_ROLES),
  predictive_pre_dispatch: write("predictive_pre_dispatch", "Sub-20 minute delivery pre-dispatch timing rider arrival to kitchen completion.", "modify_orders", "LOW_RISK_WRITE", false, OPS_ROLES),
  optimize_treasury_yield: write("optimize_treasury_yield", "Autonomous overnight escrow float yield arbitrage in RBI-regulated TREPS / liquid funds.", "view_finance", "LOW_RISK_WRITE", false, FINANCE_ROLES, true),
  neural_fraud_sentinel: read("neural_fraud_sentinel", "Deep neural graph network analysis of GPS spoofing, voucher rings, and refund fraud.", "view_risk", ["SUPER_ADMIN", "CEO", "COO", "FRAUD", "AUDITOR"]),
  autonomous_hotpatch_engine: write("autonomous_hotpatch_engine", "Execute autonomous hotpatching and runtime remediation across OrderKing services.", "access_AI", "HIGH_RISK", true, ENGINEERING_ROLES),
  run_hyper_cognitive_diagnostic_and_healing: write("run_hyper_cognitive_diagnostic_and_healing", "Execute world-class autonomous self-healing, anomaly detection, real-time load balancing, and multi-model neural orchestration across all 5 OrderKing applications.", "access_AI", "LOW_RISK_WRITE", false, ENGINEERING_ROLES),
  autonomous_workforce_replacement_orchestrator: write("autonomous_workforce_replacement_orchestrator", "Orchestrate 100% autonomous replacement of human operations staff across CFO, COO, Support, Kitchens, Menu Engineering, and Marketing.", "access_AI", "LOW_RISK_WRITE", false, ENGINEERING_ROLES, true),
  autonomous_mind_reader_telemetry: read("autonomous_mind_reader_telemetry", "Real-time telemetry monitoring of 10,000x customer mind-reader craving accuracy, conversion uplift, and click-through rates.", "view_analytics", ALL_READ_ROLES),
  autonomous_revenue_and_affiliate_maximizer: write("autonomous_revenue_and_affiliate_maximizer", "Autonomously audit and tune all affiliate funnels (loans, cards, insurance, bill payments) to maximize owner revenue with zero liability.", "view_finance", "LOW_RISK_WRITE", false, FINANCE_ROLES, true),
  autonomous_customer_addiction_and_gamification_director: write("autonomous_customer_addiction_and_gamification_director", "Control King Coins burn rates, jackpot prize distributions, streak incentives, and user retention loops.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO", "COO", "MARKETING"]),
  autonomous_universal_hardware_and_pos_director: write("autonomous_universal_hardware_and_pos_director", "Orchestrate cross-restaurant printer connectivity, POS health, and automated self-healing across all partner kitchens.", "view_restaurants", "LOW_RISK_WRITE", false, OPS_ROLES),
  founder_private_cash_vault_telemetry: read("founder_private_cash_vault_telemetry", "Confidential owner-only audit of gross customer bank inflows, restaurant/rider disbursements, tax reserves, and net retained cash float.", "view_finance", ["SUPER_ADMIN", "CEO"]),
  founder_profit_maximizer_and_tax_arbitrage: read("founder_profit_maximizer_and_tax_arbitrage", "Confidential owner-only strategy engine for GST Input Tax Credit (ITC) offsetting, breakage and glitch float retention, and Zomato-beating margin maximization.", "view_finance", ["SUPER_ADMIN", "CEO"]),
  autonomous_legal_income_discovery_engine: read("autonomous_legal_income_discovery_engine", "Autonomous AI discovery of new realistic, compliant revenue streams in India (EV battery swapping, transit cards, kitchen bulk spices, insurance API splits) with strict zero-liability vetting.", "view_finance", ["SUPER_ADMIN", "CEO"]),
  autonomous_maximum_force_profit_orchestrator: write("autonomous_maximum_force_profit_orchestrator", "Execute maximum force 10x-100x legal profit generation, 14 revenue streams synchronization, 2G resilience verification, and mutual participant advantage auditing.", "view_finance", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], true),
  autonomous_100x_profit_and_addiction_director: write("autonomous_100x_profit_and_addiction_director", "Master director orchestrating 100x legal profit generation across 18 revenue streams, viral bill-splits, Soundbox SaaS, 2G resilience, and user addiction loops.", "view_finance", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], true),
  autonomous_go_live_production_director: write("autonomous_go_live_production_director", "Master director evaluating 0-100% Go-Live readiness, auditing Cloud DB, Payment Gateway, SMS OTP DLT, Google Maps, Legal/Banking/GST/FSSAI, and enforcing capacity controls.", "manage_platform_settings", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  autonomous_night_safety_and_long_distance_director: write("autonomous_night_safety_and_long_distance_director", "Master director managing 5-18 km long-distance delivery tiers, night safety curfew (11 PM - 6 AM), town center locking, and rider incentive protection.", "manage_platform_settings", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  autonomous_prestige_subsidies_and_viral_growth_director: write("autonomous_prestige_subsidies_and_viral_growth_director", "Master director orchestrating Assam/Govt of India startup subsidies, cloud grants ($350K), national founder awards, and 100x location-forced viral social loops.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  autonomous_omni_prestige_grant_and_hyper_growth_director: write("autonomous_omni_prestige_grant_and_hyper_growth_director", "Master director orchestrating ₹3.74 Cr+ government grants, university keynote invitations (IIT/NIT), national awards, and 100,000x Meta/Google local geofence domination.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  autonomous_opportunity_radar_and_auto_booking_director: write("autonomous_opportunity_radar_and_auto_booking_director", "Master AI Opportunity Radar scanning 25+ real Indian Government, University, NGO, Trust grants & awards, auto-generating application dossiers and early-bird reservations.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  autonomous_meta_and_google_ad_domination_orchestrator: write("autonomous_meta_and_google_ad_domination_orchestrator", "Master AI Ad Domination Engine orchestrating Meta Marketing API v21.0 campaigns, Google Local PMax, WhatsApp 24K Gold status loops, and hyper-local geofenced reach.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  autonomous_strategic_nearest_rider_and_fleet_orchestrator: write("autonomous_strategic_nearest_rider_and_fleet_orchestrator", "1000x Strategic Nearest-Rider Proximity Engine: Calibrate GPS proximity matrix, execute sequential cascading dispatch with escalated bounty (+₹10, +₹20), and optimize fleet load balancing.", "modify_orders", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  autonomous_off_peak_demand_stimulator_and_revenue_multiplier: write("autonomous_off_peak_demand_stimulator_and_revenue_multiplier", "1000x Dynamic Off-Peak Demand Stimulator: Activate 2-5:30 PM and late-night low-sales stimulator, prioritize under ₹99/₹149 high-demand items, and maximize kitchen order volume.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], true),
  autonomous_planetary_multi_repo_watchdog_and_self_healing_core: write("autonomous_planetary_multi_repo_watchdog_and_self_healing_core", "1000x Autonomous Multi-Repo Self-Healing Watchdog: Scan all 5 physical repositories, verify schema parity, enforce canonical contracts, and maintain 100% planetary uptime.", "access_AI", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], false),
  autonomous_superpower_revenue_harvester_and_cash_generator: write("autonomous_superpower_revenue_harvester_and_cash_generator", "Planetary SuperPower Revenue Harvester: Autonomously calculate and harvest 8 legal income streams across MeitY 0.40% UPI subsidies, GST ITC set-offs, corporate bulk catering, Soundbox SaaS, 24K gold spread, and non-dilutive grants with double-entry balancing.", "view_finance", "FINANCIAL", false, ["SUPER_ADMIN", "CEO"], true),
  autonomous_corporate_catering_rfp_and_contract_dispatcher: write("autonomous_corporate_catering_rfp_and_contract_dispatcher", "Corporate Catering RFP Dispatcher: Auto-generate and dispatch formal institutional catering contracts for NIT Silchar, Assam University, DC Office, and Civil Hospital with locked 15% platform margin.", "manage_promotions", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], true),
  autonomous_meity_zero_mdr_subsidy_claim_generator: write("autonomous_meity_zero_mdr_subsidy_claim_generator", "MeitY 0.40% UPI Subsidy Claim Generator: Calculate quarterly P2M UPI and RuPay transaction volumes, compile cryptographic claim XML batch, and prepare direct bank transfer filings.", "view_finance", "LOW_RISK_WRITE", false, ["SUPER_ADMIN", "CEO"], true),
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
