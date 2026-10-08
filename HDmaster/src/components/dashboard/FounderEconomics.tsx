import { useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { money, MetricCard, Panel } from "@/components/command/widgets";

export const getLiveEconomics = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();

  // Gross Revenue from ledger_transactions
  const txs = await sql<{ gross: number }>`SELECT COALESCE(SUM(total_amount_paise), 0)::bigint as gross FROM ledger_transactions`;
  
  // Payouts from settlement_batches
  // Fallback to net_paise or payable_paise just in case schema differs slightly between environments
  const settlements = await sql<{ payouts: number }>`
    SELECT COALESCE(SUM(payable_paise), 0)::bigint as payouts 
    FROM settlement_batches
  `;
  
  // Wallet Balance from kingpay_wallets
  const wallets = await sql<{ wallet_balance: number }>`SELECT COALESCE(SUM(balance_paise), 0)::bigint as wallet_balance FROM kingpay_wallets`;

  const gross = Number(txs[0]?.gross || 0);
  const payouts = Number(settlements[0]?.payouts || 0);
  const walletBalance = Number(wallets[0]?.wallet_balance || 0);

  const netContribution = gross - payouts;

  return {
    gross,
    payouts,
    walletBalance,
    netContribution,
    isEmpty: gross === 0 && payouts === 0 && walletBalance === 0,
  };
});

export function FounderEconomics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["founder-economics-live"],
    queryFn: () => getLiveEconomics(),
    refetchInterval: 10000,
  });

  if (isLoading || !data) return <p className="text-muted text-sm">Loading Live Economics...</p>;
  if (error) return <p className="text-red-500 text-sm">Failed to load live economics.</p>;

  if (data.isEmpty) {
    return (
      <Panel title="Live Founder Economics (Database)">
        <div className="rounded-[16px] border border-border bg-elevated p-8 text-center">
          <h2 className="font-display text-2xl text-muted">Awaiting First Transaction</h2>
          <p className="text-sm text-muted mt-2">Zero mock data. Live database aggregation ready.</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Live Founder Economics (Database)">
      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard label="Gross Revenue" value={money(data.gross)} source="ledger_transactions" />
        <MetricCard label="Payouts" value={money(data.payouts)} source="settlement_batches" tone="warning" />
        <MetricCard label="Net Contribution" value={money(data.netContribution)} source="Computed" tone={data.netContribution >= 0 ? "success" : "danger"} />
        <MetricCard label="Wallet Liability" value={money(data.walletBalance)} source="kingpay_wallets" tone="warning" />
      </div>
    </Panel>
  );
}
