// @ts-nocheck
import { getSql } from "@/lib/db";
import type { 
  ClientLead, 
  ConnectedPlatform, 
  RemoteContractGig, 
  SeparableModule, 
  EnterpriseProjectBlueprint 
} from "../ai/supreme-founder-ai-core";

export async function getCuratedClientLeadsFromDb(): Promise<ClientLead[]> {
  // Static seed opportunities are not presented as verified external leads.
  return [];
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
    status: "STANDBY",
    apiLatencyMs: 0,
    lastSyncTime: "NOT_VERIFIED",
    authMethod: String(r.auth_method),
    guardrailProtection: {
      sandboxVerified: false,
      zeroDataLeak: false,
      rollbackSnapshotReady: false,
      rateLimitSafe: false,
    },
    supportedActions: [],
  })) as unknown as ConnectedPlatform[];
}

export async function getCuratedRemoteGigsFromDb(): Promise<RemoteContractGig[]> {
  // Seeded contract records are not verified live marketplace opportunities.
  return [];
}

export async function getSeparableModulesFromDb(): Promise<SeparableModule[]> {
  // Static module catalog records are not evidence of deployed standalone products.
  return [];
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
      // Blueprint metadata is not proof of deployment. Never expose seeded preview URLs,
      // credentials, or handoff-ready claims until a real deployment and credential vault
      // workflow has produced verified evidence.
      livePreviewUrl: "",
      estimatedBuildTime: String(r.estimated_build_time),
      commercialValueInr: 0,
      clientHandoffReady: false,
      handoffCredentials: undefined as any,
      files: Array.isArray(r.files) ? r.files as any[] : []
    };
  }
  return result;
}
