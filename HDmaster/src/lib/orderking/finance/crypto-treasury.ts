import { getSql, type Sql } from "../../db";

/**
 * 👑 ORDERKING GLOBAL CRYPTO TREASURY
 * 
 * Strategic Advantage: 
 * Allows international users (Tourists, NRIs) to order food in India using USDC/USDT,
 * completely bypassing 3% Visa/Mastercard Forex fees.
 * The Founder retains 100% of the FX margin.
 * 
 * Network: Polygon (MATIC) / Solana (SOL) - Ultra-low gas fees.
 */

export const CryptoTreasury = {
  /**
   * Crypto checkout is preserved as a future provider capability.
   * It is deliberately fail-closed until a real regulated/provider integration
   * supplies an address, exchange rate, blockchain confirmation and reconciliation.
   */
  async generatePaymentIntent(_orderId: string, _amountInr: number, _currency: 'USDC' | 'USDT') {
    throw new Error("Crypto treasury is FUTURE/DISABLED: no verified production provider is configured.");
  },

  /**
   * Never promote a client-supplied transaction hash to PAID state.
   * A real provider/blockchain verifier must confirm the payment before this
   * capability can be enabled.
   */
  async verifyTransaction(_orderId: string, _txHash: string): Promise<boolean> {
    throw new Error("Crypto treasury is FUTURE/DISABLED: blockchain verification provider is not configured.");
  },
};
