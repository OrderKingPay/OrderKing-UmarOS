const fs = require('fs');
const file = 'orderking-customers/src/routes/king-pay.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
const imports = import { getKingpayBalance, addKingpayMoney, deductKingpayMoney } from "@/lib/server/kingpay.server";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/db-cloud";;

content = content.replace('import { CameraScannerModal, type ParsedUpiResult } from "@/components/scanner/camera-scanner-modal";', imports + '\nimport { CameraScannerModal, type ParsedUpiResult } from "@/components/scanner/camera-scanner-modal";');

// 2. Replace walletBalance state with useQuery
const balanceHook =   const queryClient = useQueryClient();
  const { data: realBalances } = useQuery({
    queryKey: ['kingpay_balance'],
    queryFn: () => getKingpayBalance(),
    staleTime: Infinity, // handled by realtime
  });
  const walletBalance = realBalances?.balance ?? 0;
  const kingCoins = realBalances?.coins ?? 0;

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
          filter: \user_id=eq.\\,
        },
        (payload) => {
          queryClient.setQueryData(['kingpay_balance'], {
            balance: payload.new.balance_paise / 100,
            coins: payload.new.king_coins,
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const deductMutation = useMutation({
    mutationFn: (args: { amount: number; description: string }) => deductKingpayMoney({ data: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kingpay_balance'] }),
  });
  
  const addMutation = useMutation({
    mutationFn: (args: { amount: number; description: string }) => addKingpayMoney({ data: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kingpay_balance'] }),
  });
;

content = content.replace(/const \[walletBalance, setWalletBalance\] = useState\(750\);/g, balanceHook);
content = content.replace(/const \[kingCoins, setKingCoins\] = useState\(4200\);/g, '');

// 3. Remove localStorage interactions
content = content.replace(/if \(typeof window !== "undefined"\) \{[\s\S]*?localStorage\.setItem\("ok_king_pay_wallet_balance"[\s\S]*?\}/g, '');

// 4. Update interactions to use mutations
content = content.replace(/const newBal = walletBalance - amount;\s*setWalletBalance\(newBal\);/g, 'deductMutation.mutate({ amount, description: "Utility Payment" });');
content = content.replace(/setWalletBalance\(\(prev\) => prev \+ chosen\.value\);/g, 'addMutation.mutate({ amount: chosen.value, description: "Claimed Cash Reward" });');
content = content.replace(/setWalletBalance\(\(prev\) => prev \+ rupeeDiscount\);/g, 'addMutation.mutate({ amount: rupeeDiscount, description: "Burned King Coins" });');
content = content.replace(/setWalletBalance\(newBal\);/g, '/* handled by backend/realtime */');

// Add Money Dialog fixes
content = content.replace(/setWalletBalance\(walletBalance \+ val\);/g, 'addMutation.mutate({ amount: val, description: "Added Money to Wallet" }); toast.success(₹ Added Successfully!);');

// For QR Scanner Payment
content = content.replace(/const newBal = walletBalance - amt;\s*\/\* handled by backend\/realtime \*\//g, 'deductMutation.mutate({ amount: amt, description: "QR Payment" });');


fs.writeFileSync(file, content, 'utf8');
