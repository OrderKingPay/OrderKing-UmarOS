import { getSql } from "@/lib/db";
import type { 
  ClientLead, 
  ConnectedPlatform, 
  RemoteContractGig, 
  SeparableModule, 
  EnterpriseProjectBlueprint 
} from "../ai/supreme-founder-ai-core";

export async function getCuratedClientLeadsFromDb(): Promise<ClientLead[]> {
  const sql = await getSql();
  const rows = await sql`SELECT * FROM founder_client_leads ORDER BY id ASC`;
  return rows.map(r => ({
    id: String(r.id),
    businessName: String(r.business_name),
    category: String(r.category) as any,
    location: String(r.location),
    monthlyRevenueEst: String(r.monthly_revenue_est),
    painPoint: String(r.pain_point),
    projectBudget: Number(r.project_budget),
    status: String(r.status) as any,
    suggestedSolution: String(r.suggested_solution),
    potentialGmvGrowth: String(r.potential_gmv_growth)
  }));
}

export async function getUniversalPlatformsFromDb(): Promise<ConnectedPlatform[]> {
  const sql = await getSql();
  const rows = await sql`SELECT * FROM founder_platforms ORDER BY id ASC`;
  return rows.map(r => ({
    id: String(r.id),
    name: String(r.name),
    category: String(r.category) as any,
    description: String(r.description),
    icon: String(r.icon),
    // Database seed rows are not proof of a live OAuth/API connection.
    // Expose seeded CONNECTED records as STANDBY until a real connector writes verified state.
    status: String(r.status) === "CONNECTED" ? "STANDBY" : String(r.status) as any,
    apiLatencyMs: String(r.status) === "CONNECTED" ? 0 : Number(r.api_latency_ms),
    lastSyncTime: String(r.status) === "CONNECTED" ? "NOT_VERIFIED" : String(r.last_sync_time),
    authMethod: String(r.auth_method) as any,
    guardrailProtection: String(r.status) === "CONNECTED"
      ? { sandboxVerified: false, zeroDataLeak: false, rollbackSnapshotReady: false, rateLimitSafe: false }
      : (r.guardrail_protection || {}) as any,
    supportedActions: Array.isArray(r.supported_actions) ? r.supported_actions : []
  }));
}

export async function getCuratedRemoteGigsFromDb(): Promise<RemoteContractGig[]> {
  const sql = await getSql();
  const rows = await sql`SELECT * FROM founder_remote_gigs ORDER BY id ASC`;
  return rows.map(r => ({
    id: String(r.id),
    title: String(r.title),
    clientLocation: String(r.client_location),
    hourlyRateUsd: Number(r.hourly_rate_usd),
    fixedBudgetUsd: r.fixed_budget_usd ? Number(r.fixed_budget_usd) : undefined,
    duration: String(r.duration),
    skillsRequired: Array.isArray(r.skills_required) ? r.skills_required : [],
    description: String(r.description),
    matchScore: Number(r.match_score),
    platform: String(r.platform) as any,
    proposalTemplate: String(r.proposal_template)
  }));
}

export async function getSeparableModulesFromDb(): Promise<SeparableModule[]> {
  const sql = await getSql();
  const rows = await sql`SELECT * FROM founder_separable_modules ORDER BY id ASC`;
  return rows.map(r => ({
    id: String(r.id),
    name: String(r.name),
    tagline: String(r.tagline),
    description: String(r.description),
    category: String(r.category) as any,
    standaloneRoute: String(r.standalone_route),
    subdomainUrl: String(r.subdomain_url),
    filesCount: Number(r.files_count),
    bundleSizeKb: Number(r.bundle_size_kb),
    techStack: Array.isArray(r.tech_stack) ? r.tech_stack : [],
    standalonePackageJson: (typeof r.standalone_package_json === 'object' && r.standalone_package_json !== null) ? (r.standalone_package_json as any) : { name: "", version: "1.0.0", scripts: {}, dependencies: {} },
    sampleComponentCode: String(r.sample_component_code)
  }));
}

export async function getEnterpriseBlueprintsFromDb(): Promise<Record<string, EnterpriseProjectBlueprint>> {
  const sql = await getSql();
  const rows = await sql`SELECT * FROM founder_enterprise_blueprints`;
  const result: Record<string, EnterpriseProjectBlueprint> = {};
  for (const r of rows) {
    const key = String(r.key_name);
    result[key] = {
      id: String(r.id),
      title: String(r.title),
      category: String(r.category) as any,
      targetOrganization: String(r.target_organization),
      techStack: Array.isArray(r.tech_stack) ? r.tech_stack as string[] : [],
      databaseSchema: typeof r.database_schema === 'object' && r.database_schema !== null ? r.database_schema as any : {},
      apiEndpoints: Array.isArray(r.api_endpoints) ? r.api_endpoints as string[] : [],
      frontendRoutes: Array.isArray(r.frontend_routes) ? r.frontend_routes as string[] : [],
      livePreviewUrl: String(r.live_preview_url),
      estimatedBuildTime: String(r.estimated_build_time),
      commercialValueInr: Number(r.commercial_value_inr),
      clientHandoffReady: Boolean(r.client_handoff_ready),
      handoffCredentials: typeof r.handoff_credentials === 'object' && r.handoff_credentials !== null ? r.handoff_credentials as any : undefined,
      files: Array.isArray(r.files) ? r.files as any[] : []
    };
  }
  return result as any;
}
