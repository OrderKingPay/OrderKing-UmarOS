export interface DecodeResult {
  vpa: string | null;
  amount: number | null;
}

/**
 * Extracts the target VPA (UPI ID) and amount from the scanned BharatQR code.
 * Assuming standard UPI URI format: upi://pay?pa=vpa@bank&pn=Name&am=100.00
 */
export function decodeScannedQR(qrString: string): DecodeResult {
  try {
    const url = new URL(qrString);
    if (url.protocol !== 'upi:') {
      throw new Error('Invalid QR code format. Expected UPI URI.');
    }
    const vpa = url.searchParams.get('pa');
    const amountStr = url.searchParams.get('am');
    const amount = amountStr ? parseFloat(amountStr) : null;
    return { vpa, amount };
  } catch (error) {
    console.error('Error decoding QR string:', error);
    return { vpa: null, amount: null };
  }
}

import { canonicalLedger } from "./finance/canonical-ledger.ts";

/**
 * Verifies the user has enough authentic funds in their KingPay ecosystem wallet
 * and records double-entry deduction to the immutable ledger.
 * ZERO SIMULATED MONEY - Strict Sovereign Invariant.
 */
export async function chargeUserWallet(userId: string, amount: number, memo?: string): Promise<boolean> {
  const amountPaise = Math.round(amount * 100);
  try {
    const authenticBalancePaise = await canonicalLedger.getKingPayWalletBalancePaise(userId);
    if (authenticBalancePaise < amountPaise) {
      console.error(
        `Insufficient authentic funds for user ${userId}: available ₹${(authenticBalancePaise / 100).toFixed(2)}, required ₹${amount.toFixed(2)}`
      );
      return false;
    }

    await canonicalLedger.recordKingPayPayment({
      userId,
      recipientId: "MERCHANT_NODAL",
      amountPaise,
      idempotencyKey: `charge-${userId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      memo: memo || `KingPay wallet charge for ${userId}`,
    });

    return true;
  } catch (error) {
    console.error(`Error charging user wallet for ${userId}:`, error);
    return false;
  }
}

import {
  executeRazorpayXPayout as executeRazorpayXUnifiedPayout,
  type PayoutDisbursementResult,
  type PayoutDisbursementInput,
} from "./finance/razorpayx-payout-engine.ts";

/**
 * The actual API blueprint to hit RazorpayX/Cashfree to send real money to the public bank.
 * Backwards compatible with (targetVpa: string, amount: number) and (input: PayoutDisbursementInput).
 */
export async function executeRazorpayXPayout(
  inputOrVpa: string | PayoutDisbursementInput,
  amount?: number,
): Promise<any> {
  return await executeRazorpayXUnifiedPayout(inputOrVpa as any, amount);
}
