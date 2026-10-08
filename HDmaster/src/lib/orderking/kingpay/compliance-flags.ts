import { RegulatoryAuditLogger, ActivationAttempt } from './regulatory-audit';

export type KingPayFeature = 
  | 'upi' 
  | 'collect' 
  | 'pay' 
  | 'scan' 
  | 'wallet' 
  | 'recharge' 
  | 'autopay' 
  | 'settlements';

// @ts-expect-error JSON import outside rootDir
import secrets from '../../../../secrets.json';

export class KingPayComplianceMaster {
  private features: Record<KingPayFeature, boolean>;

  private auditLogger: RegulatoryAuditLogger;

  constructor(auditLogger?: RegulatoryAuditLogger) {
    this.auditLogger = auditLogger || new RegulatoryAuditLogger();
    this.features = Object.assign({
      upi: false,
      collect: false,
      pay: false,
      scan: false,
      wallet: false,
      recharge: false,
      autopay: false,
      settlements: false,
    }, secrets.KINGPAY_FEATURES || {});
  }

  public isFeatureEnabled(feature: KingPayFeature): boolean {
    return this.features[feature];
  }

  public activateFeature(
    feature: KingPayFeature, 
    requestedBy: string, 
    kycKybVerified: boolean, 
    pspAuthorized: boolean,
    authorizationReference?: string
  ): boolean {
    const attempt: ActivationAttempt = {
      featureName: feature,
      requestedBy,
      kycKybVerified,
      pspAuthorized,
      timestamp: new Date(),
      authorizationReference
    };

    this.auditLogger.logActivationAttempt(attempt);

    if (this.auditLogger.validateActivation(attempt)) {
      this.features[feature] = true;
      return true;
    }

    return false;
  }
  
  public deactivateFeature(feature: KingPayFeature): void {
      this.features[feature] = false;
  }
}

export const complianceMaster = new KingPayComplianceMaster();
