export interface ActivationAttempt {
  featureName: string;
  requestedBy: string;
  kycKybVerified: boolean;
  pspAuthorized: boolean;
  timestamp: Date;
  authorizationReference?: string;
}

export class RegulatoryAuditLogger {
  private auditLogs: ActivationAttempt[] = [];

  public logActivationAttempt(attempt: ActivationAttempt): void {
    this.auditLogs.push(attempt);
    // In a real system, this would write to a secure, append-only audit trail
    console.log(`[REGULATORY AUDIT] Feature activation attempt logged: ${JSON.stringify(attempt)}`);
  }

  public validateActivation(attempt: ActivationAttempt): boolean {
    if (!attempt.kycKybVerified || !attempt.pspAuthorized) {
      console.warn(`[REGULATORY AUDIT] Activation REJECTED for feature ${attempt.featureName}. Missing KYC/KYB or PSP authorization.`);
      return false;
    }
    
    if (!attempt.authorizationReference) {
        console.warn(`[REGULATORY AUDIT] Activation REJECTED for feature ${attempt.featureName}. Missing authorization reference.`);
        return false;
    }

    console.log(`[REGULATORY AUDIT] Activation APPROVED for feature ${attempt.featureName}.`);
    return true;
  }

  public getAuditLogs(): ActivationAttempt[] {
    return [...this.auditLogs];
  }
}
