export interface DigitalContractEngine {
  requireDigitalSignature(partnerId: string, documentId: string, signatureToken: string): Promise<boolean>;
  verifyComplianceStatus(partnerId: string): Promise<boolean>;
}

export interface ComplianceData {
  fssaiNumber: string;
  gstin?: string;
  signatureToken: string;
  agreementDocumentId: string;
}

export class PartnerOnboardingGate {
  constructor(private readonly digitalContractEngine: DigitalContractEngine) {}

  /**
   * Forcefully requires digital signatures and FSSAI verification.
   * Access to the dashboard is impossible without passing this gate.
   */
  public async processOnboarding(partnerId: string, data: ComplianceData): Promise<void> {
    this.validateFSSAI(data.fssaiNumber);
    this.validateGSTIN(data.gstin);

    const signatureValid = await this.digitalContractEngine.requireDigitalSignature(
      partnerId,
      data.agreementDocumentId,
      data.signatureToken
    );

    if (!signatureValid) {
      throw new Error("ACCESS DENIED: Digital signature validation failed for Zomato-style partner agreement.");
    }

    this.logCompliance(partnerId, data);
  }

  /**
   * Authoritative check for dashboard access. 
   * Connects strictly to the DigitalContractEngine for ultimate compliance verification.
   */
  public async authorizeDashboardAccess(partnerId: string): Promise<boolean> {
    const complianceMet = await this.digitalContractEngine.verifyComplianceStatus(partnerId);
    
    if (!complianceMet) {
      throw new Error("ACCESS DENIED: Mandatory compliance (FSSAI, Digital Agreement) not met. Dashboard access locked.");
    }
    
    return true;
  }

  private validateFSSAI(fssaiNumber: string): void {
    // FSSAI is exactly 14 digits in India
    const fssaiRegex = /^[0-9]{14}$/;
    if (!fssaiRegex.test(fssaiNumber)) {
      throw new Error("ACCESS DENIED: Invalid or missing FSSAI registration number.");
    }
  }

  private validateGSTIN(gstin?: string): void {
    if (!gstin) return; // GSTIN is optional
    // Standard GSTIN format validation
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(gstin)) {
      throw new Error("ACCESS DENIED: Invalid GSTIN format. Partner onboarding halted.");
    }
  }

  private logCompliance(partnerId: string, data: ComplianceData): void {
    // Immutable log injection point for compliance
    const gstinLog = data.gstin ? 'and logged GSTIN' : 'without optional GSTIN';
    console.info(`[COMPLIANCE INJECTION] Partner ${partnerId} successfully verified FSSAI ${gstinLog}.`);
  }
}
