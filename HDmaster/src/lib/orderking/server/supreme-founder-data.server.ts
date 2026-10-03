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
  // Seeded blueprints are planning artifacts, not deployed client projects.
  return {};
}
