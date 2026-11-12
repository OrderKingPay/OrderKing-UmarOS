import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { createServerFn } from "@tanstack/react-start";
import { newId } from "@/lib/ids";

export interface WalletTopupOrderResponse {
  orderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  isSandbox: boolean;
}

export interface UtilityBillRecord {
  id: string;
  billerCode: string;
  billerName: string;
  accountMasked: string;
  amountPaise: number;
  gateway: string;
  status: string;
  createdAt: string;
}

function maskAccountNumber(account: string): string {
  const clean = account.trim();
  if (clean.length <= 4) return clean;
  return `${"*".repeat(Math.max(2, clean.length - 4))}${clean.slice(-4)}`;
}

export const getKingpayBalance = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }: any) => {
    try {
      const sql = await getSql();
      const rows = await sql<{ balance_paise: number; king_coins: number }>`
        SELECT balance_paise, king_coins FROM kingpay_wallets WHERE user_id = ${context.userId}
      `;
      if (rows.length === 0) {
        await sql`INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins) VALUES (${context.userId}, 0, 0) ON CONFLICT DO NOTHING`;
        return { balance: 0, coins: 0 };
      }
      return { balance: rows[0].balance_paise / 100, coins: Number(rows[0].king_coins) };
    } catch (err) {
      console.error("getKingpayBalance failed:", err);
      return { balance: 0, coins: 0 };
    }
  });

export const getKingpayLedger = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }: any) => {
    try {
      const sql = await getSql();
      const rows = await sql<{
        id: string;
        amount_paise: number;
        type: string;
        description: string;
        created_at: string;
      }>`
        SELECT id, amount_paise, type, description, created_at
        FROM kingpay_transactions
        WHERE user_id = ${context.userId}
        ORDER BY created_at DESC
        LIMIT 100
      `;
      return rows.map((r) => ({
        entry_id: r.id,
        transaction_id: r.id,
        timestamp: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        direction: (r.type === "CREDIT" ? "CREDIT" : "DEBIT") as "CREDIT" | "DEBIT",
        amount_paise: Number(r.amount_paise) || 0,
        account: "CUSTOMER_WALLET",
        memo: r.description || "",
      }));
    } catch (err) {
      console.error("getKingpayLedger failed:", err);
      return [];
    }
  });

export const addKingpayMoney = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { amount: number; description: string; gatewaySignature?: string }) => d)
  .handler(async () => {
    throw new Error(
      "Financial Security: Direct wallet minting is disabled. Complete verified payment via prepareWalletTopupOrder and verifyAndCreditWalletTopup."
    );
  });

export const deductKingpayMoney = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { amount: number; description: string }) => d)
  .handler(async ({ context, data }: any) => {
    if (typeof data.amount !== "number" || !Number.isFinite(data.amount) || data.amount <= 0) {
      throw new Error("Financial Security: Deduction amount must be a positive finite number.");
    }

    const sql = await getSql();
    const amountPaise = Math.round(data.amount * 100);
    if (amountPaise <= 0) {
      throw new Error("Financial Security: Deduction amount in paise must be positive.");
    }

    return await sql.transaction(async (tx) => {
      const rows = await tx<{ balance_paise: number }>`
        SELECT balance_paise FROM kingpay_wallets WHERE user_id = ${context.userId} FOR UPDATE
      `;
      const current = rows[0]?.balance_paise ?? 0;
      if (current < amountPaise) {
        throw new Error("Insufficient KingPay balance");
      }
      await tx`UPDATE kingpay_wallets SET balance_paise = balance_paise - ${amountPaise}, updated_at = NOW() WHERE user_id = ${context.userId}`;
      await tx`INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description) VALUES (${newId("kptx")}, ${context.userId}, ${amountPaise}, 'DEBIT', ${data.description})`;
      return { success: true };
    });
  });

export const prepareWalletTopupOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { amountRupees: number; source?: string }) => d)
  .handler(async ({ context, data }): Promise<WalletTopupOrderResponse> => {
    const amountRupees = Math.round(Number(data?.amountRupees) || 0);
    if (!Number.isFinite(amountRupees) || amountRupees < 10 || amountRupees > 100_000) {
      throw new Error("Top-up amount must be between ₹10 and ₹1,00,000.");
    }
    const amountPaise = amountRupees * 100;
    const { getRazorpayConfig } = await import("./razorpay.server");
    const config = getRazorpayConfig();
    if (!config.hasCredentials || !config.keyId || !config.keySecret) {
      throw new Error("Online wallet top-up gateway is not configured on the server.");
    }

    const receipt = `wlt_${String(context.userId).slice(-8)}_${Date.now()}`.slice(0, 40);
    const authHeader = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt,
        notes: {
          purpose: "KINGPAY_WALLET_TOPUP",
          userId: String(context.userId),
          source: data?.source || "upi",
        },
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      throw new Error("Payment gateway could not create a top-up order. Please try again.");
    }
    const rzpOrder = (await res.json()) as { id?: string; amount?: number; currency?: string };
    if (!rzpOrder.id || rzpOrder.amount !== amountPaise || rzpOrder.currency !== "INR") {
      throw new Error("Invalid payment gateway order response.");
    }
    return {
      orderId: rzpOrder.id,
      amountPaise,
      currency: "INR",
      keyId: config.keyId,
      isSandbox: config.keyId.startsWith("rzp_test_"),
    };
  });

export const verifyAndCreditWalletTopup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      amountPaise: number;
    }) => d
  )
  .handler(async ({ context, data }) => {
    const amountPaise = Math.round(Number(data?.amountPaise) || 0);
    if (
      !data?.razorpayOrderId?.trim() ||
      !data?.razorpayPaymentId?.trim() ||
      !data?.razorpaySignature?.trim() ||
      amountPaise < 1000 ||
      amountPaise > 10_000_000
    ) {
      throw new Error("Incomplete payment verification payload.");
    }
    const { verifyRazorpaySignature } = await import("./razorpay.server");
    const isValid = verifyRazorpaySignature({
      razorpayOrderId: data.razorpayOrderId.trim(),
      razorpayPaymentId: data.razorpayPaymentId.trim(),
      razorpaySignature: data.razorpaySignature.trim(),
    });
    if (!isValid) {
      throw new Error("Payment signature verification failed. Wallet was not credited.");
    }

    const sql = await getSql();
    const txId = `kptx_${data.razorpayPaymentId.trim()}`;
    const result = await sql.transaction(async (tx) => {
      const existing = await tx<{ id: string }>`
        SELECT id FROM kingpay_transactions WHERE id = ${txId} LIMIT 1
      `;
      if (existing[0]) {
        const wallet = await tx<{ balance_paise: number }>`
          SELECT balance_paise FROM kingpay_wallets WHERE user_id = ${context.userId} LIMIT 1
        `;
        return {
          success: true,
          duplicate: true,
          transactionId: txId,
          balancePaise: Number(wallet[0]?.balance_paise ?? 0),
        };
      }

      await tx`
        INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins)
        VALUES (${context.userId}, 0, 0)
        ON CONFLICT DO NOTHING
      `;
      const updated = await tx<{ balance_paise: number }>`
        UPDATE kingpay_wallets
        SET balance_paise = balance_paise + ${amountPaise}, updated_at = NOW()
        WHERE user_id = ${context.userId}
        RETURNING balance_paise
      `;
      await tx`
        INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description)
        VALUES (${txId}, ${context.userId}, ${amountPaise}, 'CREDIT', ${`Wallet Top-up · Razorpay ${data.razorpayPaymentId.trim()}`})
      `;
      try {
        await tx`
          INSERT INTO transactions (id, order_id, amount, gateway, status)
          VALUES (${data.razorpayPaymentId.trim()}, ${data.razorpayOrderId.trim()}, ${amountPaise}, 'razorpay', 'CAPTURED')
          ON CONFLICT (id) DO NOTHING
        `;
      } catch {
        // Non-blocking audit mirror if gateway transactions table differs
      }
      return {
        success: true,
        duplicate: false,
        transactionId: txId,
        balancePaise: Number(updated[0]?.balance_paise ?? 0),
      };
    });

    return result;
  });

export const prepareUtilityBillRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      billerCode: string;
      billerName: string;
      category: string;
      accountNumber: string;
      amountRupees: number;
      receipt: string;
    }) => d
  )
  .handler(async ({ context, data }): Promise<WalletTopupOrderResponse> => {
    const cleanAccount = (data?.accountNumber || "").trim();
    if (cleanAccount.length < 4) {
      throw new Error("Please enter a valid consumer account or mobile number.");
    }
    const amountRupees = Number(data?.amountRupees) || 0;
    const amountPaise = Math.round(amountRupees * 100);
    if (!Number.isSafeInteger(amountPaise) || amountPaise < 100 || amountPaise > 20_000_000) {
      throw new Error("Bill amount must be between ₹1 and ₹2,00,000.");
    }

    const { getRazorpayConfig } = await import("./razorpay.server");
    const config = getRazorpayConfig();
    if (!config.hasCredentials || !config.keyId || !config.keySecret) {
      throw new Error("Online utility payment gateway is unavailable. Please configure Razorpay credentials or use KingPay Wallet.");
    }

    const receipt = (data.receipt || `util_${Date.now()}`).slice(0, 40);
    const authHeader = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt,
        notes: {
          purpose: "UTILITY_BILL_PAYMENT",
          userId: String(context.userId),
          category: String(data.category || "utility").slice(0, 32),
          billerCode: String(data.billerCode || "").slice(0, 32),
          accountMasked: maskAccountNumber(cleanAccount),
        },
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      throw new Error("Payment gateway could not initiate utility checkout.");
    }
    const rzpOrder = (await res.json()) as { id?: string; amount?: number; currency?: string };
    if (!rzpOrder.id || rzpOrder.amount !== amountPaise || rzpOrder.currency !== "INR") {
      throw new Error("Invalid payment gateway order response.");
    }
    return {
      orderId: rzpOrder.id,
      amountPaise,
      currency: "INR",
      keyId: config.keyId,
      isSandbox: config.keyId.startsWith("rzp_test_"),
    };
  });

export const verifyAndRecordUtilityBillPayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      billerCode: string;
      billerName: string;
      category: string;
      accountNumber: string;
      amountPaise: number;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) => d
  )
  .handler(async ({ context, data }) => {
    const amountPaise = Math.round(Number(data?.amountPaise) || 0);
    if (
      !data?.razorpayOrderId?.trim() ||
      !data?.razorpayPaymentId?.trim() ||
      !data?.razorpaySignature?.trim() ||
      amountPaise < 100
    ) {
      throw new Error("Missing Razorpay verification parameters.");
    }
    const { verifyRazorpaySignature } = await import("./razorpay.server");
    const isValid = verifyRazorpaySignature({
      razorpayOrderId: data.razorpayOrderId.trim(),
      razorpayPaymentId: data.razorpayPaymentId.trim(),
      razorpaySignature: data.razorpaySignature.trim(),
    });
    if (!isValid) {
      throw new Error("Payment signature verification failed. Utility payment rejected.");
    }

    const sql = await getSql();
    const accountMasked = maskAccountNumber(data.accountNumber || "");
    const cleanBillerName = (data.billerName || data.billerCode || "Utility Biller").replace(/\|/g, "-").slice(0, 60);
    const encodedRef = `UTIL|${context.userId}|${data.billerCode}|${cleanBillerName}|${accountMasked}`;
    const paymentId = data.razorpayPaymentId.trim();

    try {
      await sql`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          order_id TEXT NOT NULL,
          amount BIGINT NOT NULL,
          gateway TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    } catch {
      // Table expected from migration 0026_gateway_transactions.sql
    }

    await sql`
      INSERT INTO transactions (id, order_id, amount, gateway, status)
      VALUES (${paymentId}, ${encodedRef}, ${amountPaise}, 'razorpay', 'PAID')
      ON CONFLICT (id) DO NOTHING
    `;

    return {
      success: true,
      transactionRef: paymentId,
      gateway: "Razorpay Verified",
      paidAtIso: new Date().toISOString(),
    };
  });

export const payUtilityBillWithWallet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      billerCode: string;
      billerName: string;
      category: string;
      accountNumber: string;
      amountRupees: number;
    }) => d
  )
  .handler(async ({ context, data }) => {
    const cleanAccount = (data?.accountNumber || "").trim();
    if (cleanAccount.length < 4) {
      throw new Error("Please enter a valid consumer account or mobile number.");
    }
    const amountPaise = Math.round((Number(data?.amountRupees) || 0) * 100);
    if (!Number.isSafeInteger(amountPaise) || amountPaise < 100 || amountPaise > 20_000_000) {
      throw new Error("Bill amount must be between ₹1 and ₹2,00,000.");
    }

    const sql = await getSql();
    const txId = newId("kputil");
    const accountMasked = maskAccountNumber(cleanAccount);
    const cleanBillerName = (data.billerName || data.billerCode || "Utility Biller").replace(/\|/g, "-").slice(0, 60);
    const encodedRef = `UTIL|${context.userId}|${data.billerCode}|${cleanBillerName}|${accountMasked}`;

    await sql.transaction(async (tx) => {
      const rows = await tx<{ balance_paise: number }>`
        SELECT balance_paise FROM kingpay_wallets WHERE user_id = ${context.userId} FOR UPDATE
      `;
      const current = Number(rows[0]?.balance_paise ?? 0);
      if (current < amountPaise) {
        throw new Error("Insufficient KingPay Wallet balance. Add money or pay via Razorpay.");
      }
      await tx`
        UPDATE kingpay_wallets
        SET balance_paise = balance_paise - ${amountPaise}, updated_at = NOW()
        WHERE user_id = ${context.userId}
      `;
      await tx`
        INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description)
        VALUES (${txId}, ${context.userId}, ${amountPaise}, 'DEBIT', ${`BILL: ${data.billerCode} (${accountMasked})`})
      `;
      await tx`
        INSERT INTO transactions (id, order_id, amount, gateway, status)
        VALUES (${txId}, ${encodedRef}, ${amountPaise}, 'kingpay_wallet', 'PAID')
      `;
    });

    return {
      success: true,
      transactionRef: txId,
      gateway: "KingPay Wallet",
      paidAtIso: new Date().toISOString(),
    };
  });

export const listMyUtilityBills = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<UtilityBillRecord[]> => {
    try {
      const sql = await getSql();
      const prefix = `UTIL|${context.userId}|%`;
      const rows = await sql<{
        id: string;
        order_id: string;
        amount: number;
        gateway: string;
        status: string;
        created_at: string;
      }>`
        SELECT id, order_id, amount, gateway, status, created_at::text as created_at
        FROM transactions
        WHERE order_id LIKE ${prefix}
        ORDER BY created_at DESC
        LIMIT 25
      `;
      return rows.map((r) => {
        const parts = (r.order_id || "").split("|");
        return {
          id: r.id,
          billerCode: parts[2] || "BILL",
          billerName: parts[3] || "Utility Biller",
          accountMasked: parts[4] || "",
          amountPaise: Number(r.amount) || 0,
          gateway: r.gateway,
          status: r.status,
          createdAt: r.created_at,
        };
      });
    } catch {
      return [];
    }
  });

