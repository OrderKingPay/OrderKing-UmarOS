const fs = require('fs');
const code = `import { getSql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";
import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";

export const getKingpayBalance = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getSessionUser();
  if (!user) return { balance: 0, coins: 0 };
  const sql = await getSql();
  const rows = await sql<{ balance_paise: number; king_coins: number }>\`
    SELECT balance_paise, king_coins FROM kingpay_wallets WHERE user_id = \${user.id}
  \`;
  if (rows.length === 0) {
    await sql\`INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins) VALUES (\${user.id}, 0, 0) ON CONFLICT DO NOTHING\`;
    return { balance: 0, coins: 0 };
  }
  return { balance: rows[0].balance_paise / 100, coins: Number(rows[0].king_coins) };
});

export const addKingpayMoney = createServerFn({ method: "POST" })
  .validator((d: { amount: number; description: string }) => d)
  .handler(async ({ data }) => {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");
    const sql = await getSql();
    const amountPaise = Math.round(data.amount * 100);
    
    await sql.transaction(async (tx) => {
      await tx\`INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins) VALUES (\${user.id}, 0, 0) ON CONFLICT DO NOTHING\`;
      await tx\`UPDATE kingpay_wallets SET balance_paise = balance_paise + \${amountPaise}, updated_at = NOW() WHERE user_id = \${user.id}\`;
      await tx\`INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description) VALUES (\${randomUUID()}, \${user.id}, \${amountPaise}, 'CREDIT', \${data.description})\`;
    });
    return { success: true };
  });

export const deductKingpayMoney = createServerFn({ method: "POST" })
  .validator((d: { amount: number; description: string }) => d)
  .handler(async ({ data }) => {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");
    const sql = await getSql();
    const amountPaise = Math.round(data.amount * 100);
    
    await sql.transaction(async (tx) => {
      const rows = await tx<{ balance_paise: number }>\`SELECT balance_paise FROM kingpay_wallets WHERE user_id = \${user.id} FOR UPDATE\`;
      if (rows.length === 0 || rows[0].balance_paise < amountPaise) {
        throw new Error("Insufficient Balance");
      }
      await tx\`UPDATE kingpay_wallets SET balance_paise = balance_paise - \${amountPaise}, updated_at = NOW() WHERE user_id = \${user.id}\`;
      await tx\`INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description) VALUES (\${randomUUID()}, \${user.id}, \${amountPaise}, 'DEBIT', \${data.description})\`;
    });
    return { success: true };
  });
`;

fs.writeFileSync('orderking-customers/src/lib/server/kingpay.server.ts', code, 'utf8');
