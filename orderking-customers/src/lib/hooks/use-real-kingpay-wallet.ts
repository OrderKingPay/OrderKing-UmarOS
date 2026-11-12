
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getKingpayBalance, deductKingpayMoney } from "@/lib/server/kingpay";
import { supabase } from "@/lib/db-cloud";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function useRealKingPayWallet() {
  const { user } = useCurrentUserState();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["kingpay_balance", user?.id],
    queryFn: () => getKingpayBalance(),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('kingpay_wallets_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kingpay_wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.setQueryData(["kingpay_balance", user.id], {
            balance: payload.new.balance_paise / 100,
            coins: Number(payload.new.king_coins),
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const walletBalance = data?.balance ?? 0;
  const walletBalancePaise = Math.round(walletBalance * 100);
  const kingCoins = data?.coins ?? 0;

  const deductMoney = useMutation({
    mutationFn: (args: { amount: number; description: string }) => deductKingpayMoney({ data: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kingpay_balance", user?.id] }),
  });

  return {
    walletBalance,
    walletBalancePaise,
    kingCoins,
    deductMoney,
    isLoading,
  };
}
