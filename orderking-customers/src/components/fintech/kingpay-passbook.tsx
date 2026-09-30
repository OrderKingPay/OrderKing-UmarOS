
import React from "react";
import { ArrowDownLeft, ArrowUpRight, Search, FileText, Calendar } from "lucide-react";

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: "credit" | "debit";
  timestamp: string;
  status: string;
};

interface KingPayPassbookProps {
  transactions: Transaction[];
}

export function KingPayPassbook({ transactions }: KingPayPassbookProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filtered = transactions.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-4 border-b border-border bg-surface sticky top-0 z-10 flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-fg">Passbook & History</h2>
          <p className="text-sm text-muted">View all your recent KingPay transactions</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-fg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-muted"
          />
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted" />
            </div>
            <h3 className="text-lg font-bold text-fg mb-1">No transactions found</h3>
            <p className="text-sm text-muted">
              {searchTerm ? "Try a different search term" : "Your transaction history will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-surface-2 rounded-2xl border border-border">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    tx.type === "credit" ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"
                  }`}>
                    {tx.type === "credit" ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-fg text-sm line-clamp-1">{tx.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {tx.timestamp}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-500">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-bold text-base ${
                    tx.type === "credit" ? "text-green-500" : "text-fg"
                  }`}>
                    {tx.type === "credit" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-muted mt-1 uppercase">
                    {tx.type === "credit" ? "Received" : "Paid"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
