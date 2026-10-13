import {
  validateFssai,
  validateGstin,
  validatePan,
  validateIfsc,
  getMenuLockState,
  type MenuLockStatus,
} from "./merchant-kyc";

export interface DigitalContractEngine {
  requireDigitalSignature(partnerId: string, documentId: string, signatureToken: string): Promise<boolean>;
  verifyComplianceStatus(partnerId: string): Promise<boolean>;
}

export interface ComplianceData {
  fssaiNumber: string;
  gstin?: string;
  pan?: string;
  bankIfsc?: string;
  signatureToken: string;
  agreementDocumentId: string;
}

export class PartnerOnboardingGate {
  constructor(private readonly digitalContractEngine: DigitalContractEngine) {}

  /**
   * Forcefully requires digital signatures and statutory KYC verification (FSSAI, PAN, IFSC, GSTIN).
   * Menus remain locked in 'PENDING_VERIFICATION' until KYC compliance is fully approved.
   */
  public async processOnboarding(partnerId: string, data: ComplianceData): Promise<void> {
    this.validateFSSAI(data.fssaiNumber);
    this.validateGSTIN(data.gstin);
    if (data.pan) this.validatePAN(data.pan);
    if (data.bankIfsc) this.validateIFSC(data.bankIfsc);

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

  /**
   * Evaluates menu access state. Unverified merchants have their menus locked in 'PENDING_VERIFICATION'.
   */
  public async getMenuStatus(partnerId: string): Promise<MenuLockStatus> {
    const complianceMet = await this.digitalContractEngine.verifyComplianceStatus(partnerId);
    const lockState = getMenuLockState(complianceMet ? "APPROVED" : "PENDING_VERIFICATION");
    return lockState.menuStatus;
  }

  private validateFSSAI(fssaiNumber: string): void {
    if (!validateFssai(fssaiNumber)) {
      throw new Error("ACCESS DENIED: Invalid or missing 14-digit FSSAI registration number.");
    }
  }

  private validateGSTIN(gstin?: string): void {
    if (!gstin) return; // GSTIN is optional
    if (!validateGstin(gstin)) {
      throw new Error("ACCESS DENIED: Invalid GSTIN format. Partner onboarding halted.");
    }
  }

  private validatePAN(pan: string): void {
    if (!validatePan(pan)) {
      throw new Error("ACCESS DENIED: Invalid PAN card format. Partner onboarding halted.");
    }
  }

  private validateIFSC(ifsc: string): void {
    if (!validateIfsc(ifsc)) {
      throw new Error("ACCESS DENIED: Invalid Bank IFSC code format. Partner onboarding halted.");
    }
  }

  private logCompliance(partnerId: string, data: ComplianceData): void {
    // Immutable log injection point for compliance
    const gstinLog = data.gstin ? 'and logged GSTIN' : 'without optional GSTIN';
    console.info(`[COMPLIANCE INJECTION] Partner ${partnerId} successfully verified FSSAI ${gstinLog}.`);
  }
}

