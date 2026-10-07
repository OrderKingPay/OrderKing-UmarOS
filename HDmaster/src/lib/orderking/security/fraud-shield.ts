export interface OrderRiskContext {
  orderId: string;
  customerId: string;
  totalAmountPaise: number;
  isAccountVerified: boolean;
  customerDeviceIP: string;
  customerGPSLocation: { lat: number; lng: number };
  recentOrderCountIn24h: number;
}

export interface FraudEvaluation {
  isFraudulent: boolean;
  riskScore: number;
  reasons: string[];
}

export class FraudShield {
  private static MAX_UNVERIFIED_AMOUNT_PAISE = 500000; // 5000 INR
  private static MAX_ORDER_VELOCITY_24H = 10;
  
  public evaluateOrderRisk(context: OrderRiskContext): FraudEvaluation {
    const reasons: string[] = [];
    let riskScore = 0;

    // 1. Abnormally large orders from unverified accounts
    if (!context.isAccountVerified && context.totalAmountPaise > FraudShield.MAX_UNVERIFIED_AMOUNT_PAISE) {
      reasons.push(`High value order (₹${context.totalAmountPaise/100}) from unverified account`);
      riskScore += 45;
    }

    // 2. Velocity checks (rapid consecutive orders)
    if (context.recentOrderCountIn24h > FraudShield.MAX_ORDER_VELOCITY_24H) {
      reasons.push(`High order velocity: ${context.recentOrderCountIn24h} orders in 24h`);
      riskScore += 30;
    }

    // 3. GPS Spoofing detection
    if (context.customerGPSLocation.lat === 0 && context.customerGPSLocation.lng === 0) {
      reasons.push(`Suspicious GPS coordinates (0,0) indicating potential spoofing`);
      riskScore += 50;
    }

    if (!context.isAccountVerified) {
      riskScore += 10;
    }
    
    if (context.totalAmountPaise > 1000000) { 
      riskScore += 25;
      reasons.push(`Very high order value (₹${context.totalAmountPaise/100})`);
    }

    riskScore = Math.min(riskScore, 100);
    const isFraudulent = riskScore >= 70;

    return {
      isFraudulent,
      riskScore,
      reasons
    };
  }
}

export const fraudShield = new FraudShield();
