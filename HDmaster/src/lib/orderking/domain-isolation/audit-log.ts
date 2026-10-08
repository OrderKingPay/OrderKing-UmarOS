import { Domain } from './domains';

export interface AuditLogEntry {
  source: Domain;
  target: Domain;
  action: string;
  decision: 'ALLOWED' | 'DENIED';
  reason: string;
  timestamp: string;
}

export class AuditLog {
  private static logs: AuditLogEntry[] = [];

  public static logCrossDomainAccess(
    source: Domain,
    target: Domain,
    action: string,
    decision: 'ALLOWED' | 'DENIED',
    reason: string,
    timestamp: Date = new Date()
  ): void {
    this.logs.push({
      source,
      target,
      action,
      decision,
      reason,
      timestamp: timestamp.toISOString(),
    });
  }

  public static getAuditLog(): AuditLogEntry[] {
    return [...this.logs];
  }
  
  public static clear(): void {
    this.logs = [];
  }
}
