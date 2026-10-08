export function checkPolicy(amount: number, token: string, approvals: number): boolean {
  if (amount > 10000 && approvals < 3) {
    throw new Error("Policy violation: Transactions over $10,000 require 3/3 multisig approval.");
  }
  return true;
}
