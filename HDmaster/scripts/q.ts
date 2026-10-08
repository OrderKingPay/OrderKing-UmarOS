import { getSql } from "./src/lib/db.ts";

async function run() {
  const sql = await getSql();
  const res1 = await sql`SELECT account, direction, SUM(amount_paise) as total FROM ledger_entries GROUP BY account, direction`;
  console.log("Ledger Entries:", res1);

  const res2 = await sql`SELECT SUM(gross_amount_paise) as gross, SUM(net_payout_paise) as payout FROM settlement_batches`;
  console.log("Settlements:", res2);

  const res3 = await sql`SELECT SUM(balance_paise) as wallets FROM kingpay_wallets`;
  console.log("Wallets:", res3);
  
  process.exit(0);
}
run().catch(console.error);
