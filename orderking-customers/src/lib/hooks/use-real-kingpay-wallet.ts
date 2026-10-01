
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getKingpayBalanceRpc,
  listKingpayTransactionsRpc,
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

    // Coins are server-authoritative until a verified reward mutation is connected.
  const setKingCoins = (..._args: unknown[]) => {};

  return { walletBalance, kingCoins, setKingCoins, transactions, refreshWallet };
}
