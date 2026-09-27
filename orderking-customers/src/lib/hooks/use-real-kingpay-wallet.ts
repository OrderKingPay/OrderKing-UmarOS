import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getKingpayBalance } from "@/lib/server/kingpay.server";
import { supabase } from "@/lib/db-cloud";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

/**
 * Read-only realtime KingPay wallet view.
 *
 * Wallet credits are never minted from browser state. Credits must originate
 * from a verified provider/webhook/ledger event on the server.
 */
export function useRealKingPayWallet() {
  const { user } = useCurrentUserState();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["kingpay_balance", user?.id],
    queryFn: () => getKingpayBalance(),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`kingpay_wallet_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "kingpay_wallets",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const next = payload.new as { balance_paise?: number; king_coins?: number };
          queryClient.setQueryData(["kingpay_balance", user.id], {
            balance: Number(next.balance_paise ?? 0) / 100,
            coins: Number(next.king_coins ?? 0),
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    walletBalance: query.data?.balance ?? 0,
    kingCoins: query.data?.coins ?? 0,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching,
    refreshWallet: () => queryClient.invalidateQueries({ queryKey: ["kingpay_balance", user?.id] }),
  };
}
