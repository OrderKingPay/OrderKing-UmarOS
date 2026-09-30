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

export const addKingpayMoneyRpc = createServerFn({ method: "POST" })
  .validator((data: { amount: number; description: string }) => data)
  .handler(async ({ data }) => {
    const { addKingpayMoney } = await import("./server/kingpay.server");
    return await addKingpayMoney({ data });
  });

export const deductKingpayMoneyRpc = createServerFn({ method: "POST" })
  .validator((data: { amount: number; description: string }) => data)
  .handler(async ({ data }) => {
    const { deductKingpayMoney } = await import("./server/kingpay.server");
    return await deductKingpayMoney({ data });
  });
