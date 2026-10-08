import { getSql as defaultGetSql } from "../../db.ts";
import { randomUUID } from "crypto";

export type MemoryTier = 'working' | 'episodic' | 'semantic' | 'procedural';

export interface MemoryEntry {
  id?: string;
  tenantId: string;
  domainId: string;
  tier: MemoryTier;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemoryQuery {
  tenantId: string;
  domainId: string;
  tier?: MemoryTier;
  queryVector?: number[];
  limit?: number;
  metadataFilter?: Record<string, any>;
}

/**
 * Multi-Tier Governed Agent Memory Engine
 * Implements Working, Episodic, Semantic, and Procedural memory with vector retrieval,
 * strict tenant/domain isolation, and policy-gated access.
 */
export class MultiTierMemoryEngine {
  private getSqlFn: () => Promise<any>;

  constructor(getSqlFn: () => Promise<any> = defaultGetSql) {
    this.getSqlFn = getSqlFn;
  }

  /**
   * Storing a memory. If embedding is missing and it's semantic/procedural,
   * we ideally should generate it, but we assume it's passed here.
   */
  async storeMemory(entry: MemoryEntry): Promise<string> {
    this.enforcePolicy(entry.tenantId, entry.domainId);

    const sql = await this.getSqlFn();
    const id = entry.id || randomUUID();
    const metadata = entry.metadata ? JSON.stringify(entry.metadata) : '{}';

    // Format embedding for pgvector: '[1,2,3]'
    const embeddingValue = entry.embedding && entry.embedding.length > 0 
      ? `[${entry.embedding.join(',')}]` 
      : null;

    await sql`
      INSERT INTO ai_agent_memory (id, tenant_id, domain_id, memory_tier, content, embedding, metadata)
      VALUES (${id}, ${entry.tenantId}, ${entry.domainId}, ${entry.tier}, ${entry.content}, ${embeddingValue}::vector, ${metadata}::jsonb)
    `;

    return id;
  }

  /**
   * Retrieve memory based on isolation and optional semantic similarity.
   */
  async retrieveMemory(query: MemoryQuery): Promise<MemoryEntry[]> {
    this.enforcePolicy(query.tenantId, query.domainId);

    const sql = await this.getSqlFn();
    const limit = query.limit || 10;
    
    // We construct the query conditionally. Using getSql().query for dynamic parts.
    let baseQuery = `
      SELECT id, tenant_id, domain_id, memory_tier, content, metadata, created_at, updated_at
      FROM ai_agent_memory
      WHERE tenant_id = $1 AND domain_id = $2
    `;
    const params: any[] = [query.tenantId, query.domainId];
    let paramIndex = 3;

    if (query.tier) {
      baseQuery += ` AND memory_tier = $${paramIndex}`;
      params.push(query.tier);
      paramIndex++;
    }

    if (query.queryVector && query.queryVector.length > 0) {
      const vecStr = `[${query.queryVector.join(',')}]`;
      baseQuery += ` ORDER BY embedding <-> $${paramIndex}::vector ASC`;
      params.push(vecStr);
      paramIndex++;
    } else {
      baseQuery += ` ORDER BY created_at DESC`;
    }

    baseQuery += ` LIMIT $${paramIndex}`;
    params.push(limit);

    const rows: any[] = await sql.query(baseQuery, params);

    // Apply metadata filtering in-memory if requested (or we could do it in SQL)
    let results = rows.map((r: any) => ({
      id: r.id,
      tenantId: r.tenant_id,
      domainId: r.domain_id,
      tier: r.memory_tier,
      content: r.content,
      metadata: r.metadata,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    if (query.metadataFilter) {
      const filters = Object.entries(query.metadataFilter);
      results = results.filter((r: any) => {
        return filters.every(([k, v]) => r.metadata && r.metadata[k] === v);
      });
    }

    return results;
  }

  /**
   * Enforces strict policy-gated access to memories.
   * Throws if context violates data governance.
   */
  private enforcePolicy(tenantId: string, domainId: string) {
    if (!tenantId || !domainId) {
      throw new Error("Governance Policy Violation: Tenant and Domain context is required for memory access.");
    }
    // Additional policy checks could be inserted here (e.g. checking user roles)
  }
}
