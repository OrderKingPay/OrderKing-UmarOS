import { systemLogger } from './logger';

export function logAudit(action: string, userId: string, resource: string, status: string, metadata?: Record<string, any>) {
  systemLogger.info('Security Audit Event', {
    auditEvent: true,
    action,
    userId,
    resource,
    status,
    metadata
  });
}
