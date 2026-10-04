import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getKingpayBalance, addKingpayMoney, deductKingpayMoney } from "@/lib/server/kingpay.server";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function useRealKingPayWallet() {
  const { user } = useCurrentUserState();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["kingpay_balance", user?.id],
    queryFn: () => getKingpayBalance(),
    enabled: !!user,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    staleTime: 2500,
  });

  const addMoney = useMutation({
    mutationFn: (args: { amount: number; description: string }) =>
      addKingpayMoney({ data: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kingpay_balance", user?.id] }),
  });

  const deductMoney = useMutation({
    mutationFn: (args: { amount: number; description: string }) =>
      deductKingpayMoney({ data: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kingpay_balance", user?.id] }),
  });

  const setWalletBalance = (action: any) => {
    const current = data?.balance ?? 0;
    const target =
      typeof action === "function" ? action(current) : Number(action);

    const amount = target - current;
    if (amount > 0) {
      addMoney.mutate({ amount, description: "Wallet credit request" });
    } else if (amount < 0) {
      deductMoney.mutate({ amount: Math.abs(amount), description: "Wallet debit request" });
    }
  };

  const setKingCoins = () => {
    // Read-only until a verified KingPay rewards ledger is connected.
  };

  return {
    walletBalance: data?.balance ?? 0,
    setWalletBalance,
    kingCoins: data?.coins ?? 0,
    setKingCoins,
    topUpPending: addMoney.isPending,
    debitPending: deductMoney.isPending,
  };
}
