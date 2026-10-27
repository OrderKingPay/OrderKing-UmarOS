import { createFileRoute } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { useT } from "@/components/providers";
import { RefreshCw, ShieldCheck, Scale, Landmark, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/legal/refunds")({ component: RefundsPage });

function RefundsPage() {
  const { t } = useT();

  return (
    <CustomerShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 text-zinc-100">
        {/* Header Banner */}
        <div className="border-b border-zinc-800 pb-6 mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="bg-emerald-950/60 border-emerald-500/40 text-emerald-400 font-mono text-[10px] uppercase tracking-wider">
              Consumer Protection Compliant
            </Badge>
            <Badge className="bg-zinc-900 border-zinc-700 text-zinc-400 font-mono text-[10px]">
              Last Updated: October 2026
            </Badge>
            <Badge className="bg-amber-950/60 border-amber-500/40 text-amber-300 font-mono text-[10px]">
              GSTIN: 18AFXPH9838M1Z9
            </Badge>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight">
            OrderKing Cancellation &amp; Refund Policy
          </h1>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed max-w-3xl">
            Statutory Cancellation, Quality Remediation, and Refund Policy formulated under the Consumer Protection (E-Commerce) Rules, 2020
            and the Consumer Protection Act, 2019.
          </p>
        </div>

        <article className="space-y-8 text-sm leading-relaxed text-zinc-300">
          {/* Section 1: Cancellation Grace Window */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-white border-b border-zinc-800/80 pb-2">
              <Clock className="size-4 text-emerald-400" />
              <h2>1. Order Cancellation &amp; Kitchen Grace Window</h2>
            </div>
            <p>
              Under Rule 6(5) of the Consumer Protection (E-Commerce) Rules, 2020, consumers are entitled to transparent cancellation procedures:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>
                <strong className="text-white">Prior to Kitchen Acceptance:</strong> Consumers may cancel an order free of cancellation fees
                prior to the Restaurant Partner accepting and initiating culinary preparation. In this window, 100% of the transaction amount
                (including item price, delivery charge, taxes, and platform fee) is refunded.
              </li>
              <li>
                <strong className="text-white">Post Kitchen Acceptance:</strong> Once the Restaurant Partner accepts the order and commences preparation,
                perishable food ingredients are committed. Cancellations at this stage incur a cancellation fee equivalent to the merchant preparation costs,
                as permitted under applicable commerce guidelines.
              </li>
              <li>
                <strong className="text-white">Platform or Merchant Cancellations:</strong> If an order is cancelled by the Restaurant Partner due to stock
                unavailability, or by the Company due to severe weather/rider unavailability, a 100% full refund is automatically issued.
              </li>
            </ul>
          </section>

          {/* Section 2: Quality Defects & Missing Items */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-white border-b border-zinc-800/80 pb-2">
              <AlertTriangle className="size-4 text-emerald-400" />
              <h2>2. Food Quality Defects, Tampered Packaging &amp; Missing Items</h2>
            </div>
            <p>
              In accordance with the Food Safety and Standards Act, 2006, consumers are entitled to receive hygienic, unadulterated food in intact packaging.
              Refunds or replacements are provided under the following verified conditions:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>
                <strong className="text-white">Tampered or Broken Packaging Seal:</strong> Deliveries with broken tamper-evident seals may be rejected
                at the doorstep. A full refund will be processed upon photo verification.
              </li>
              <li>
                <strong className="text-white">Incorrect or Missing Items:</strong> Consumers must report missing or incorrect items via the in-app
                Support Desk within 2 hours of delivery with photographic evidence. Pro-rata refund for the missing items is initiated immediately.
              </li>
              <li>
                <strong className="text-white">Quality or Spoilage Defects:</strong> Legitimate complaints regarding food spoilage or foreign objects
                are investigated directly with the FSSAI-licensed Restaurant Partner. Full or partial compensation is credited accordingly.
              </li>
            </ul>
          </section>

          {/* Section 3: Refund Settlement Timelines & Payment Rails */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-white border-b border-zinc-800/80 pb-2">
              <RefreshCw className="size-4 text-emerald-400" />
              <h2>3. Refund Timelines &amp; Settlement Rails</h2>
            </div>
            <p>
              All refunds are computed server-side in exact integer paise and reversed directly through certified banking rails:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-zinc-800 rounded-lg">
                <thead className="bg-zinc-900/80 text-zinc-200">
                  <tr>
                    <th className="p-2.5 border-b border-zinc-800">Original Payment Method</th>
                    <th className="p-2.5 border-b border-zinc-800">Refund Destination</th>
                    <th className="p-2.5 border-b border-zinc-800">Statutory SLA Timeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  <tr>
                    <td className="p-2.5 font-medium text-white">KingPay Digital Wallet</td>
                    <td className="p-2.5">KingPay Wallet Ledger</td>
                    <td className="p-2.5 font-mono text-emerald-400">Instant (Within 120 seconds)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-white">Direct NPCI UPI (orderking@ybl)</td>
                    <td className="p-2.5">Original Source Bank Account via UPI VPA</td>
                    <td className="p-2.5 font-mono text-emerald-400">2 to 24 Business Hours</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-white">Debit / Credit Card (PCI-DSS)</td>
                    <td className="p-2.5">Original Issuing Bank Card Account</td>
                    <td className="p-2.5 font-mono text-emerald-400">5 to 7 Business Days</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-white">Netbanking / Payment Gateways</td>
                    <td className="p-2.5">Source Bank Account</td>
                    <td className="p-2.5 font-mono text-emerald-400">3 to 5 Business Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Grievance Officer & Statutory Redressal */}
          <section className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
            <div className="flex items-center gap-2 text-base font-bold text-white pb-1">
              <Scale className="size-4 text-emerald-400" />
              <h2>4. Grievance Redressal &amp; Consumer Escalations</h2>
            </div>
            <p>
              In accordance with Rule 5(4) of the Consumer Protection (E-Commerce) Rules, 2020:
            </p>
            <div className="mt-2 rounded-lg bg-zinc-950/80 border border-zinc-800 p-3 font-mono text-xs space-y-1 text-zinc-300">
              <div><strong className="text-white">Designation:</strong> Grievance Officer, Orderkingpay</div>
              <div><strong className="text-white">Entity:</strong> Orderkingpay (GSTIN: 18AFXPH9838M1Z9)</div>
              <div><strong className="text-white">Address:</strong> Orderkingpay Operations Hub, Sribhumi, Assam - 788710, India</div>
              <div><strong className="text-white">Grievance Email:</strong> <a href="mailto:grievance@orderkingpay.com" className="text-emerald-400 underline">grievance@orderkingpay.com</a></div>
              <div><strong className="text-white">Statutory SLA:</strong> Ticket acknowledged within 48 hours; full resolution within 30 days.</div>
            </div>
          </section>

          {/* Section 5: Governing Law & Jurisdiction */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-white border-b border-zinc-800/80 pb-2">
              <Landmark className="size-4 text-emerald-400" />
              <h2>5. Governing Law &amp; Jurisdiction</h2>
            </div>
            <p>
              This Policy is governed by the laws of India. Any unresolved dispute arising out of cancellations or refunds
              shall be subject to the <strong className="text-white">exclusive jurisdiction of the courts of Sribhumi / Karimganj, Assam, India</strong>.
            </p>
          </section>
        </article>
      </div>
    </CustomerShell>
  );
}
