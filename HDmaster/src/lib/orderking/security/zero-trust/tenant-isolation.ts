/**
 * Ensures strict tenant isolation across the application.
 * Restaurant A can NEVER query Orders for Restaurant B.
 */
export class TenantIsolation {
  /**
   * Wraps a query object with a strict tenant ID filter.
   * E.g., for Prisma or Drizzle ORM, ensuring `tenantId` is always applied.
   */
  public static injectTenantFilter(query: any, expectedTenantId: string): any {
    if (!expectedTenantId) {
      throw new Error("CRITICAL: Tenant ID missing in query context. Aborting to prevent cross-tenant data leak.");
    }
    
    return {
      ...query,
      where: {
        ...(query.where || {}),
        tenantId: expectedTenantId,
      }
    };
  }

  /**
   * Verifies that a fetched record belongs to the requested tenant.
   */
  public static verifyRecordOwnership(record: { tenantId?: string }, expectedTenantId: string): void {
    if (!record.tenantId) {
       throw new Error("SECURITY VIOLATION: Record has no tenantId associated with it.");
    }
    if (record.tenantId !== expectedTenantId) {
      throw new Error(`SECURITY VIOLATION: Cross-tenant access attempted. Expected ${expectedTenantId}, got ${record.tenantId}`);
    }
  }
}
