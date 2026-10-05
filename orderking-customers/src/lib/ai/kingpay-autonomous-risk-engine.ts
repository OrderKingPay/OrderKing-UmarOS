/**
 * KingPay risk/ledger capability boundary.
 *
 * Preserved for future activation, but production financial decisions may not
 * write directly from the browser or claim a ledger reconciliation until the
 * server-side provider, authoritative ledger schema, audit trail and policy
 * engine are connected.
 */
export class KingPayAutonomousRiskEngine {
  static async executeRealTimeFraudScan(userId: string, transactionAmount: number, deviceId: string) {
    void userId;
    void transactionAmount;
    void deviceId;
    return {
      authorized: false,
      riskScore: null,
      status: "NOT_ENABLED" as const,
      reason: "Server-side fraud/risk service is not connected; no wallet freeze or payment authorization was performed.",
    };
  }

  static async autonomousLedgerReconciliation(
    orderId: string,
    totalPaid: number,
    restaurantCut: number,
    riderCut: number,
  ) {
    void orderId;
    void totalPaid;
    void restaurantCut;
    void riderCut;
    throw new Error(
      "Ledger reconciliation is not enabled until the authoritative server ledger and settlement provider are connected.",
    );
  }
}
