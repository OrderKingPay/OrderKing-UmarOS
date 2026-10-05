import { getSql, type Sql } from "@/lib/db";

const unavailable = (operation: string): never => {
  throw new Error(`${operation} is unavailable until a real regulated/provider-backed crypto payment integration is configured.`);
};

export const CryptoTreasury = {
  async generatePaymentIntent(_orderId: string, _amountInr: number, _currency: "USDC" | "USDT") {
    return unavailable("Crypto payment intents");
  },

  async verifyTransaction(_orderId: string, _txHash: string): Promise<boolean> {
    return unavailable("Crypto transaction verification");
  },
};
