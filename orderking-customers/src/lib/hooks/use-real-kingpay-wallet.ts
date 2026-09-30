
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getKingpayBalance, listKingpayTransactions, addKingpayMoney, deductKingpayMoney } from "@/lib/server/kingpay.server";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function useRealKingPayWallet() {
  const { user } = useCurrentUserState();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["kingpay_balance", user?.id],
    queryFn: () => getKingpayBalance(),
    enabled: !!user,
    refetchInterval: 10_000,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["kingpay_transactions", user?.id],
    queryFn: () => listKingpayTransactions(),
    enabled: !!user,
    refetchInterval: 10_000,
  });

  const walletBalance = data?.balance ?? 0;
  const kingCoins = data?.coins ?? 0;

  const addMoney = useMutation({
    mutationFn: (args: { amount: number; description: string }) => addKingpayMoney({ data: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kingpay_balance", user?.id] }),
  });

  const deductMoney = useMutation({
    mutationFn: (args: { amount: number; description: string }) => deductKingpayMoney({ data: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kingpay_balance", user?.id] }),
  });

  // Mock setWalletBalance to emulate the useState tuple structure for easy patching
  const setWalletBalance = (action: any) => {
    let amount = 0;
    if (typeof action === 'function') {
      const result = action(walletBalance);
      amount = result - walletBalance;
    } else {
      amount = action - walletBalance;
    }
    
    if (amount > 0) {
      addMoney.mutate({ amount, description: "Wallet Top-up / Reward" });
    } else if (amount < 0) {
      deductMoney.mutate({ amount: Math.abs(amount), description: "Wallet Deduction" });
    }
  };

  const setKingCoins = () => { /* read only for now, mutations can be added */ };

  return { walletBalance, setWalletBalance, kingCoins, setKingCoins, transactions };
}
