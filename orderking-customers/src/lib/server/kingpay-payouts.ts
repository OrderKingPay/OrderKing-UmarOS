import { getSql } from "@/lib/db";
import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";

/**
 * KingPay Instant Settlement Engine
 * 
 * Secure financial operation with transaction boundaries and row locking.
 */

export const triggerInstantPayout = createServerFn({ method: "POST" })
  .validator((data: { restaurantId: string, amountPaise: number }) => data)
  .handler(async ({ data }) => {
    if (data.amountPaise <= 0) {
      throw new Error("Payout amount must be strictly positive.");
    }

    const sql = await getSql();
    
    // 1. Verify merchant KYC and Nodal account linking (No lock needed for KYC status)
    const merchant = await sql<{ bank_account: string, ifsc: string, status: string }>`
      SELECT bank_account, ifsc, status 
      FROM merchant_kyc 
      WHERE restaurant_id = ${data.restaurantId}
    `;

    if (merchant.length === 0 || merchant[0].status !== 'verified') {
      throw new Error("Merchant KYC not verified for instant payouts.");
    }

    const batchId = randomUUID();
    let mockUtr = `UTR${Date.now()}`;

    // 2. Secure Transaction Boundary
    await sql.transaction(async (tx: any) => {
      // Lock KingPay wallet row for update to prevent concurrent deductions
      const wallet = await tx<{ balance_paise: number }>`
        SELECT balance_paise FROM kingpay_merchant_wallets 
        WHERE restaurant_id = ${data.restaurantId} 
        FOR UPDATE
      `;

      if (wallet.length === 0) {
        throw new Error("Wallet not found.");
      }

      if (wallet[0].balance_paise < data.amountPaise) {
        throw new Error("Insufficient KingPay balance.");
      }

      // Deduct from wallet
      await tx`
        UPDATE kingpay_merchant_wallets 
        SET balance_paise = balance_paise - ${data.amountPaise},
            updated_at = NOW()
        WHERE restaurant_id = ${data.restaurantId}
      `;

      // Record the payout batch in the same transaction
      await tx`
        INSERT INTO payout_batches (id, restaurant_id, amount_paise, bank_ref, status, created_at)
        VALUES (${batchId}, ${data.restaurantId}, ${data.amountPaise}, ${mockUtr}, 'completed', NOW())
      `;
    });

    return { success: true, batchId, utr: mockUtr, amountPaise: data.amountPaise };
  });
