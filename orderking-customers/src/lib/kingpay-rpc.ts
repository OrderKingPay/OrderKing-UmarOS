import { createServerFn } from "@tanstack/react-start";

export const getKingpayBalanceRpc = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getKingpayBalance } = await import("./server/kingpay.server");
    return await getKingpayBalance();
  });

export const listKingpayTransactionsRpc = createServerFn({ method: "GET" })
  .handler(async () => {
    const { listKingpayTransactions } = await import("./server/kingpay.server");
    return await listKingpayTransactions();
  });
