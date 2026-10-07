/**
 * Agent Boundary Security Layer
 * 
 * Enforces strict rules for all agent task execution to prevent malicious or accidental
 * destructive operations, and enforces access control rules based on role.
 */

export interface AgentTaskPayload {
  type?: string;
  action?: string;
  sqlQuery?: string;
  query?: string;
  sql?: string;
  metadata?: {
    isFinancial?: boolean;
    founderMfaToken?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export function validateAgentTask(payload: any, role: string): boolean {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload: payload must be an object.');
  }

  const taskPayload = payload as AgentTaskPayload;
  
  // 1. Prevent destructive database operations (e.g., dropping tables)
  const sqlContent = taskPayload.sqlQuery || taskPayload.query || taskPayload.sql;
  if (typeof sqlContent === 'string') {
    const normalizedQuery = sqlContent.toUpperCase();
    const forbiddenPhrases = [
      'DROP TABLE',
      'DROP DATABASE',
      'DROP SCHEMA',
      'TRUNCATE TABLE',
      'ALTER TABLE DROP'
    ];

    for (const phrase of forbiddenPhrases) {
      if (normalizedQuery.includes(phrase)) {
        throw new Error(`Security Violation: Agent tasks are not permitted to execute destructive SQL (${phrase}).`);
      }
    }
  }

  // 2. Enforce Founder MFA override for financial tasks
  const isFinancial = 
    taskPayload.type === 'FINANCIAL' || 
    taskPayload.action === 'TRANSFER_FUNDS' || 
    taskPayload.metadata?.isFinancial === true;

  if (isFinancial) {
    if (role !== 'FOUNDER') {
      throw new Error('Security Violation: Financial tasks require FOUNDER role.');
    }
    if (!taskPayload.metadata || !taskPayload.metadata.founderMfaToken) {
      throw new Error('Security Violation: Financial tasks require Founder MFA override.');
    }
    // Note: MFA token validation logic would go here
  }

  // 3. Basic role boundary check
  if (role === 'GUEST' || role === 'UNAUTHENTICATED') {
    throw new Error(`Security Violation: Role ${role} is not permitted to execute agent tasks.`);
  }

  // Passed all checks
  return true;
}
