/**
 * LedgerAuditor
 * Scans ledger_transactions to detect anomalies, negative balances, or duplicate IDs.
 */

export interface LedgerTransaction {
    id: string;
    accountId: string;
    amount: bigint; // Positive for credit, negative for debit
    timestamp: Date;
}

export interface AuditResult {
    isValid: boolean;
    anomalies: string[];
}

export class LedgerAuditor {
    public auditTransactions(transactions: LedgerTransaction[]): AuditResult {
        const anomalies: string[] = [];
        const seenIds = new Set<string>();
        const accountBalances = new Map<string, bigint>();

        for (const tx of transactions) {
            // Check for duplicate IDs
            if (seenIds.has(tx.id)) {
                anomalies.push(`Duplicate transaction ID detected: ${tx.id}`);
            }
            seenIds.add(tx.id);

            // Update balance
            const currentBalance = accountBalances.get(tx.accountId) || 0n;
            const newBalance = currentBalance + tx.amount;
            accountBalances.set(tx.accountId, newBalance);
        }

        // Check for negative balances
        for (const [accountId, balance] of accountBalances.entries()) {
            if (balance < 0n) {
                anomalies.push(`Negative balance detected for account: ${accountId} (Balance: ${balance})`);
            }
        }

        return {
            isValid: anomalies.length === 0,
            anomalies
        };
    }
}
