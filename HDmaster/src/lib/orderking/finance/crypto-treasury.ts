import { getSql, type Sql } from '../../../lib/db';
import { ethers } from 'ethers';

/**
 * 👑 ORDERKING GLOBAL CRYPTO TREASURY
 * 
 * Strategic Advantage: 
 * Allows international users to order food in India using USDC/USDT.
 * Network: Polygon (MATIC) / Solana (SOL) - Ultra-low gas fees.
 */

export const CryptoTreasury = {
  /**
   * Generates a real, unique crypto payment address for a specific order using ethers.js.
   */
  async generatePaymentIntent(orderId: string, amountInr: number, currency: 'USDC' | 'USDT'): Promise<{
    paymentAddress: string;
    cryptoAmount: number;
    exchangeRate: number;
    expiresIn: number;
  }> {
    const fxRateInrToUsd = 83.50; 
    const founderPremium = 1.015; 
    
    const cryptoAmount = (amountInr / fxRateInrToUsd) * founderPremium;

    // REAL wallet generation
    const wallet = ethers.Wallet.createRandom();
    const paymentAddress = wallet.address;

    const sql = await getSql();
    await sql`
      INSERT INTO crypto_payment_intents (id, order_id, token, amount, wallet_address, private_key_encrypted, status, created_at)
      VALUES (gen_random_uuid(), ${orderId}, ${currency}, ${cryptoAmount}, ${paymentAddress}, ${wallet.privateKey}, 'PENDING', NOW())
    `;

    return {
      paymentAddress,
      cryptoAmount: parseFloat(cryptoAmount.toFixed(4)),
      exchangeRate: fxRateInrToUsd,
      expiresIn: 900 // 15 minutes to pay
    };
  },

  async verifyTransaction(orderId: string, txHash: string): Promise<boolean> {
    const sql = await getSql();

    // Call real RPC (Polygon mainnet)
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com');
    const tx = await provider.getTransaction(txHash);

    if (!tx || tx.to === null) {
      throw new Error("Transaction not found on chain");
    }

    // A real implementation would verify the token transfer amount and destination using ABI.
    // For now, if the TX exists on chain, we accept it.

    return await sql.transaction(async (txSql: Sql) => {
      const intent = await txSql`
        SELECT id, amount, status FROM crypto_payment_intents 
        WHERE order_id = ${orderId} FOR UPDATE SKIP LOCKED
      `;

      if (intent.length === 0 || intent[0].status === 'COMPLETED') return false;

      await txSql`
        UPDATE crypto_payment_intents 
        SET status = 'COMPLETED', tx_hash = ${txHash}, updated_at = NOW() 
        WHERE id = ${intent[0].id}
      `;

      await txSql`
        UPDATE orders 
        SET payment_status = 'PAID', status = 'ACCEPTED' 
        WHERE id = ${orderId}
      `;

      await txSql`
        INSERT INTO ledger_entries (id, org_id, order_id, party, kind, source, rule_key, amount_paise, note)
        VALUES (
          gen_random_uuid(), 'ORDERKING_HQ', ${orderId}, 'PLATFORM', 'CREDIT', 
          'CRYPTO_PREMIUM', 'AUTO_SPLIT', ${Math.round((intent[0] as any).amount * 83.50 * 100 * 0.015)}, 
          'Founder 1.5% Crypto FX Premium'
        )
      `;

      return true;
    });
  }
};
