import { useState, useRef } from "react";
import { QrCode, Printer, Sparkles, Copy, Check, Gift, Layers, Utensils, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useCommissionTokens } from "@orderking/ui";
import { toast } from "sonner";

interface InStoreMarketingKitProps {
  restaurantId?: string;
  restaurantName?: string;
}

export function InStoreMarketingKit({
  restaurantId = "default-outlet",
  restaurantName = "Your Restaurant Kitchen",
}: InStoreMarketingKitProps) {
  const commissionTokens = useCommissionTokens();
  const dineInCommissionDisplay =
    commissionTokens.dineInBps === 0 ? "0%" : `${(commissionTokens.dineInBps / 100).toFixed(0)}%`;
  const [selectedFormat, setSelectedFormat] = useState<"table_tent" | "counter_standee" | "bill_insert">("table_tent");
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [batchCount, setBatchCount] = useState<number>(10);
  const [tableNumber, setTableNumber] = useState<string>("T-01");
  const [discountPercent, setDiscountPercent] = useState<string>("15");
  const [cashbackOffer, setCashbackOffer] = useState<string>("10% KingPay Instant Cashback");
  const [customHeadline, setCustomHeadline] = useState<string>("Scan to Order from Table & Earn Instant Cashbacks");
  const [copied, setCopied] = useState<boolean>(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const customerOrderUrl = `https://orderkingpay.com/r/${restaurantId}?table=${encodeURIComponent(tableNumber)}&promo=DINEIN${discountPercent}&cashback=10`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(customerOrderUrl);
    setCopied(true);
    toast.success("Customer Table Ordering Link copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const tableList = isBatchMode
    ? Array.from({ length: Math.min(30, Math.max(1, batchCount)) }, (_, i) => `Table ${String(i + 1).padStart(2, "0")}`)
    : [tableNumber || "Table 01"];

  return (
    <div className="space-y-5">
      {/* Top Value Banner */}
      <Card className="border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-white">
                  In-Store Viral Customer Acquisition &amp; Table QR Kit
                </h3>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                  {dineInCommissionDisplay} COMMISSION DINE-IN
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Turn your dine-in guests into high-frequency repeat customers. Print branded Table Tent QR cards and counter standees encouraging diners to order and earn instant cashbacks on Order King.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyLink}
              className="text-xs font-semibold"
            >
              {copied ? <Check className="mr-1.5 size-3.5 text-emerald-400" /> : <Copy className="mr-1.5 size-3.5" />}
              {copied ? "Copied Link" : "Copy Table URL"}
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              <Printer className="mr-1.5 size-3.5" /> Print Marketing Kit
            </Button>
          </div>
        </div>

        {/* Growth ROI Stat Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-emerald-500/20 text-xs">
          <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Aggregator Cut Avoided</span>
            <div className="font-bold text-emerald-400 mt-0.5 text-sm">Save ~24% per Order</div>
            <p className="text-[10px] text-slate-400">Zero commission on orders placed via table QR</p>
          </div>
          <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Diner Retention &amp; Cashback</span>
            <div className="font-bold text-amber-300 mt-0.5 text-sm">KingPay Wallet Cashbacks</div>
            <p className="text-[10px] text-slate-400">Diners return to redeem cashback balance</p>
          </div>
          <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Table Service Velocity</span>
            <div className="font-bold text-emerald-400 mt-0.5 text-sm">Instant KDS &amp; KOT Print</div>
            <p className="text-[10px] text-slate-400">Orders route straight to kitchen stations</p>
          </div>
        </div>
      </Card>

      {/* Format Selector & Customizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-white">1. Select Marketing Format</h4>
            <p className="text-xs text-slate-400 mt-0.5">Choose the print material format for your outlet:</p>
          </div>

          <div className="space-y-2">
            {[
              { id: "table_tent", label: "🍽️ Branded Table Tent Card (A5 Folding)", desc: "Dual-sided folding card for dining tables with fold guidelines" },
              { id: "counter_standee", label: "🏷️ Counter Standee (A4 Acrylic Stand)", desc: "Display at billing counter and pickup windows with UPI support" },
              { id: "bill_insert", label: "🧾 Bill Folder Slip (3×4 Inch)", desc: "Slip inside leather bill folders for next-order cashback" },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setSelectedFormat(fmt.id as any)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selectedFormat === fmt.id
                    ? "border-emerald-500 bg-emerald-950/30 text-white"
                    : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="font-bold text-xs">{fmt.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{fmt.desc}</div>
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800">
            {/* Single vs Multi-Table Generator */}
            <div>
              <Label className="text-xs text-slate-300">Table Number Generator</Label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsBatchMode(false)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border ${
                    !isBatchMode
                      ? "border-emerald-500 bg-emerald-600 text-white"
                      : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  Single Table
                </button>
                <button
                  type="button"
                  onClick={() => setIsBatchMode(true)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border ${
                    isBatchMode
                      ? "border-emerald-500 bg-emerald-600 text-white"
                      : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  Batch Multi-Table
                </button>
              </div>
            </div>

            {isBatchMode ? (
              <div>
                <Label className="text-xs text-slate-300">Number of Tables to Generate (1 to 30)</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value) || 10)}
                  className="mt-1 h-9 text-xs bg-slate-950 border-slate-800 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Will generate printable cards for Table 01 through Table {String(batchCount).padStart(2, "0")}
                </span>
              </div>
            ) : (
              <div>
                <Label className="text-xs text-slate-300">Table Number / Station Label</Label>
                <Input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. Table 04, Rooftop 02"
                  className="mt-1 h-9 text-xs bg-slate-950 border-slate-800 font-mono"
                />
              </div>
            )}

            {/* Customer Cashback Incentive */}
            <div>
              <Label className="text-xs text-slate-300 flex items-center gap-1.5">
                <Gift className="size-3 text-amber-400" /> Dine-In Customer Cashback Reward
              </Label>
              <div className="grid grid-cols-1 gap-1.5 mt-1">
                {[
                  "10% KingPay Instant Cashback",
                  "Flat ₹50 KingPay Wallet Cashback",
                  "2X Cashback Loyalty Coins",
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCashbackOffer(c);
                      setCustomHeadline(`Scan to Order from Table & Earn ${c}`);
                    }}
                    className={`rounded-lg p-2 text-left text-xs font-medium border transition ${
                      cashbackOffer === c
                        ? "border-amber-500/70 bg-amber-500/15 text-amber-200 font-bold"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    💰 {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount Selector */}
            <div>
              <Label className="text-xs text-slate-300">Diner Promotion Discount (%)</Label>
              <div className="flex gap-2 mt-1">
                {["10", "15", "20", "25"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDiscountPercent(d);
                      setCustomHeadline(`Scan to Order from Table & Get ${d}% OFF + ${cashbackOffer}`);
                    }}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border ${
                      discountPercent === d
                        ? "border-emerald-500 bg-emerald-600 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    {d}% OFF
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-300">Custom Headline Call-to-Action</Label>
              <Input
                value={customHeadline}
                onChange={(e) => setCustomHeadline(e.target.value)}
                placeholder="Callout text on standee"
                className="mt-1 h-9 text-xs bg-slate-950 border-slate-800"
              />
            </div>
          </div>
        </Card>

        {/* Live Print Preview Card (Wired for window.print) */}
        <div className="lg:col-span-2">
          <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-semibold text-sm text-white">2. Live Print Preview</h4>
                <p className="text-xs text-slate-400">
                  {isBatchMode
                    ? `Showing ${tableList.length} Table Cards for Batch Print`
                    : "Actual look of your branded in-store customer collateral"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Format: {selectedFormat.replace("_", " ").toUpperCase()}
                </span>
                <Button
                  size="sm"
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  <Printer className="mr-1.5 size-3.5" /> Print Now
                </Button>
              </div>
            </div>

            {/* Standee Render Box with Print Layout */}
            <div
              ref={printAreaRef}
              className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-6 max-h-[680px] overflow-y-auto"
            >
              {tableList.map((tableName, index) => (
                <div
                  key={index}
                  className="mx-auto w-full max-w-md rounded-2xl border-4 border-slate-900 bg-white p-6 text-slate-900 shadow-2xl text-center space-y-4 print:w-full print:border-none print:shadow-none print:page-break-after-always"
                >
                  {/* Table Tent Fold Guideline if Table Tent format */}
                  {selectedFormat === "table_tent" && (
                    <div className="border-b-2 border-dashed border-slate-300 pb-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                      ✂️ --- FOLD ALONG DASHED LINE FOR TABLE TENT --- ✂️
                    </div>
                  )}

                  {/* Header Branding */}
                  <div className="space-y-1">
                    <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                      Official Dine-In QR Order
                    </span>
                    <h2 className="font-display text-xl font-black text-slate-950 tracking-tight">
                      {restaurantName}
                    </h2>
                    <div className="inline-block rounded-lg bg-slate-100 border border-slate-200 px-3 py-0.5 text-xs font-bold font-mono text-slate-800">
                      {tableName}
                    </div>
                  </div>

                  {/* High-Res QR Code Representation */}
                  <div className="mx-auto w-44 h-44 rounded-2xl border-2 border-slate-900 p-2.5 bg-white flex flex-col items-center justify-center shadow-inner relative group">
                    <div className="w-full h-full border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-2 bg-slate-50">
                      <QrCode className="size-28 text-slate-900" />
                      <span className="text-[9px] font-mono font-bold text-slate-600 mt-1">
                        SCAN WITH CAMERA / UPI
                      </span>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-white/95 rounded-2xl transition text-xs font-bold text-emerald-700 p-2">
                      <span>OrderKing Pay Engine</span>
                      <span className="text-[9px] font-mono text-slate-500 font-normal mt-0.5">
                        table={tableName}
                      </span>
                    </div>
                  </div>

                  {/* Promo & Cashback Callout */}
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 space-y-1.5">
                    <div className="font-extrabold text-sm text-emerald-950">
                      🎉 {customHeadline}
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-0.5 text-[11px] font-bold text-amber-900">
                      <Gift className="size-3 text-amber-700" />
                      <span>{cashbackOffer}</span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Order directly from your phone. Zero queue, fastest table delivery, and cashbacks credited instantly to your KingPay Wallet.
                    </p>
                  </div>

                  {/* Footer Brand Watermark */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>
                      Powered by <strong>Order King</strong>
                    </span>
                    <span>{dineInCommissionDisplay} Commission Network</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
              <span>💡 Tip: Print on 250+ GSM cardstock or place inside transparent acrylic T-stands for durable table presentation.</span>
              <Button
                size="sm"
                onClick={handlePrint}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                <Printer className="mr-1.5 size-3.5" /> Print Now
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
