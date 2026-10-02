
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getKingpayBalance } from "@/lib/server/kingpay.server";
import { supabase } from "@/lib/db-cloud";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function useRealKingPayWallet() {
  const { user } = useCurrentUserState();
  const queryClient = useQueryClient();

  const { data } = useQuery({
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
            coins: payload.new.king_coins,
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const walletBalance = data?.balance ?? 0;
  const kingCoins = data?.coins ?? 0;


}
