
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getKingpayBalanceRpc,
  listKingpayTransactionsRpc,
  addKingpayMoneyRpc,
  deductKingpayMoneyRpc,
} from "@/lib/kingpay-rpc";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function useRealKingPayWallet() {
  const { user } = useCurrentUserState();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["kingpay_balance", user?.id],
    queryFn: () => getKingpayBalanceRpc(),
    enabled: !!user,
    refetchInterval: 10_000,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["kingpay_transactions", user?.id],
    queryFn: () => listKingpayTransactionsRpc(),
    enabled: !!user,
    refetchInterval: 10_000,
  });

  const walletBalance = data?.balance ?? 0;
  const kingCoins = data?.coins ?? 0;

  const refreshWallet = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["kingpay_balance", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["kingpay_transactions", user?.id] }),
    ]);
  };

  const addMoney = useMutation({
    mutationFn: (args: { amount: number; description: string }) => addKingpayMoneyRpc({ data: args }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kingpay_balance", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["kingpay_transactions", user?.id] });
    },
  });

  const deductMoney = useMutation({
    mutationFn: (args: { amount: number; description: string }) => deductKingpayMoneyRpc({ data: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kingpay_balance", user?.id] }),
  });

  // Compatibility setter: applies only real server-ledger deltas.
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

  // Coins are server-authoritative until a verified reward mutation is connected.
  const setKingCoins = (..._args: unknown[]) => {};

  return { walletBalance, setWalletBalance, kingCoins, setKingCoins, transactions, refreshWallet, addMoney };
}
