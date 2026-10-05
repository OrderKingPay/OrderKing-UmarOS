import type { Sql } from "@/lib/db";

const cryptoNotReady = (): never => {
  throw new Error(
    "Crypto payments are disabled: an approved crypto payment provider, exchange-rate source, transaction verifier, custody model, and compliance approval are required before activation.",
  );
};

/**
 * Future crypto payment capability.
 *
 * It remains in the codebase but is fail-closed until a real provider adapter
 * and compliance approval are available. No addresses, exchange rates, payment
 * confirmations, or founder-profit ledger entries are fabricated.
 */
export const CryptoTreasury = {
  async generatePaymentIntent(orderId: string, amountInr: number, currency: "USDC" | "USDT") {
    void orderId;
    void amountInr;
    void currency;
    cryptoNotReady();
  },

  async verifyTransaction(orderId: string, txHash: string): Promise<boolean> {
    void orderId;
    void txHash;
    cryptoNotReady();
  },
};

export type CryptoSql = Sql;
