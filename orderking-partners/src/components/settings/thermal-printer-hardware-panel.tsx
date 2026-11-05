import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateEscPosReceipt, type PaperWidth } from "@/lib/hardware/escpos";
import {
  Printer,
  FileText,
  CheckCircle2,
  Copy,
  Receipt,
  Utensils,
  User,
  Bike,
  Eye,
  X,
} from "lucide-react";

export interface ThermalPrinterHardwarePanelProps {
  restaurantId?: string;
  restaurantName?: string;
}

export function ThermalPrinterHardwarePanel({
  restaurantId,
  restaurantName = "OrderKing Partner Kitchen",
}: ThermalPrinterHardwarePanelProps) {
  // 1. Thermal Receipt Paper Width Selector (58mm / 2-inch vs 80mm / 3-inch)
  const [paperWidth, setPaperWidth] = useState<PaperWidth>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_paper_width");
      if (saved === "58mm" || saved === "80mm") return saved;
    }
    return "80mm"; // 80mm standard
  });

  // 2. Auto-Print Kitchen Order Ticket (KOT) on Acceptance Toggle
  const [autoPrintKot, setAutoPrintKot] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_auto_print_kot");
      if (saved !== null) return saved === "true";
      const fallback = localStorage.getItem("ok_auto_print_on_order");
      if (fallback !== null) return fallback === "true";
    }
    return true; // Enabled by default
  });

  // 3. Number of KOT copies to print (1 Kitchen, 1 Customer, 1 Rider)
  const [kitchenCopies, setKitchenCopies] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_kot_copies_kitchen");
      if (saved) return Math.min(3, Math.max(1, Number(saved)));
    }
    return 1;
  });

  const [customerCopies, setCustomerCopies] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_kot_copies_customer");
      if (saved) return Math.min(2, Math.max(0, Number(saved)));
    }
    return 1;
  });

  const [riderCopies, setRiderCopies] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_kot_copies_rider");
      if (saved) return Math.min(2, Math.max(0, Number(saved)));
    }
    return 1;
  });

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [previewTicket, setPreviewTicket] = useState<{
    show: boolean;
    copyType: "KITCHEN" | "CUSTOMER" | "RIDER";
    text: string;
  } | null>(null);

  const totalCopies = kitchenCopies + customerCopies + riderCopies;

  const handleSaveHardware = () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("ok_paper_width", paperWidth);
        localStorage.setItem("ok_auto_print_kot", String(autoPrintKot));
        localStorage.setItem("ok_auto_print_on_order", String(autoPrintKot));
        localStorage.setItem("ok_kot_copies_kitchen", String(kitchenCopies));
        localStorage.setItem("ok_kot_copies_customer", String(customerCopies));
        localStorage.setItem("ok_kot_copies_rider", String(riderCopies));
      }
      setSaveMsg(
        `Thermal Printer hardware settings saved: ${paperWidth} Paper, Auto-Print on Acceptance is ${autoPrintKot ? "ENABLED" : "DISABLED"}, Total Copies: ${totalCopies} (${kitchenCopies} Kitchen, ${customerCopies} Customer, ${riderCopies} Rider).`,
      );
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Failed to save printer settings");
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewReceipt = (copyType: "KITCHEN" | "CUSTOMER" | "RIDER") => {
    const res = generateEscPosReceipt(
      {
        restaurantName,
        orderNumber: "OK-8942",
        orderType: "DELIVERY",
        tableOrArea: "Station Pass / Order King Delivery",
        timestamp: new Date().toLocaleString("en-IN"),
        prepMinutes: 20,
        items: [
          {
            name: "Murgh Dum Biryani (Special)",
            quantity: 2,
            pricePaise: 54000,
            station: "CURRY",
            instructions: "Double spicy, separate raita",
          },
          {
            name: "Butter Garlic Naan (Crisp)",
            quantity: 3,
            pricePaise: 18000,
            station: "TANDOOR",
          },
          {
            name: "Gulab Jamun (2 pcs)",
            quantity: 1,
            pricePaise: 8000,
            station: "DESSERT",
          },
        ],
        subtotalPaise: 80000,
        packingPaise: 4000,
        discountPaise: 5000,
        cgstPaise: 1975,
        sgstPaise: 1975,
        totalPaise: 82950,
        specialInstructions: `*** ${copyType} COPY *** Handover token verified. Food grade sealed container.`,
        qrPayload: "https://orderking.in/r/OK-8942",
        autoCut: true,
      },
      paperWidth,
    );

    setPreviewTicket({
      show: true,
      copyType,
      text: res.plainText,
    });
  };

  return (
    <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Printer className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
              Thermal POS Printer &amp; Kitchen Ticket Settings
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                ESC/POS HARDWARE
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Configure receipt roll dimensions, automated KOT printing upon order acceptance, and multi-station ticket routing.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded">
            {paperWidth.toUpperCase()} · {totalCopies} COPIES CONFIGURED
          </span>
        </div>
      </div>

      {/* Main Grid: Paper Width, Auto-Print Toggle, and Copies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Section 1: Paper Width Selector */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">Paper Roll Width</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                {paperWidth === "80mm" ? "48 COLS" : "32 COLS"}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Select your thermal receipt printer roll dimensions to calibrate ESC/POS column alignment and auto-wrapping:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {/* 58mm Option */}
              <button
                type="button"
                onClick={() => setPaperWidth("58mm")}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  paperWidth === "58mm"
                    ? "border-emerald-500 bg-emerald-500/15 text-white shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-100">58mm (2-Inch)</span>
                    <span className="text-[10px] font-mono text-slate-400">· Mobile POS</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Compact bluetooth / handheld printer (32 columns)
                  </div>
                </div>
                {paperWidth === "58mm" ? (
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                ) : null}
              </button>

              {/* 80mm Option */}
              <button
                type="button"
                onClick={() => setPaperWidth("80mm")}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  paperWidth === "80mm"
                    ? "border-emerald-500 bg-emerald-500/15 text-white shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-100">80mm (3-Inch)</span>
                    <span className="text-[10px] font-mono text-emerald-400">· Standard KOT</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Heavy-duty kitchen &amp; billing desktop printer (48 columns)
                  </div>
                </div>
                {paperWidth === "80mm" ? (
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                ) : null}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex justify-between">
            <span>ESC/POS Standard</span>
            <span>Raw Bytecode Generation</span>
          </div>
        </div>

        {/* Section 2: Auto-Print KOT on Acceptance */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">Auto-Print on Accept</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPrintKot}
                  onChange={(e) => setAutoPrintKot(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              When enabled, clicking &quot;Accept Order&quot; on the Live Board or KDS instantly dispatches print jobs to your thermal printers with zero manual taps.
            </p>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Trigger Condition:</span>
                <span className="font-mono text-emerald-400 font-bold">STATE → ACCEPTED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Print Protocol:</span>
                <span className="font-mono text-slate-400">ESC/POS (TCP / USB / BT)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Paper Auto-Cut:</span>
                <span className="font-mono text-emerald-400">GS V 66 0 (Cut Enabled)</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            {autoPrintKot ? "✅ Zero-tap ticket dispatch active." : "⏸️ Manual ticket print required."}
          </div>
        </div>

        {/* Section 3: Number of KOT Copies to Print */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Copy className="size-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">Number of KOT Copies</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                {totalCopies} Total
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Distribute tickets automatically across kitchen station, customer invoice, and rider delivery handover:
            </p>

            <div className="space-y-2.5">
              {/* Copy 1: Kitchen Copy */}
              <div className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <Utensils className="size-3.5 text-emerald-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">1. Kitchen Copy</div>
                    <div className="text-[10px] text-slate-400">Prep stations / Head chef pass</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setKitchenCopies(cnt)}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-semibold transition ${
                        kitchenCopies === cnt
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handlePreviewReceipt("KITCHEN")}
                    title="Preview Kitchen Ticket"
                    className="p-1 rounded text-slate-400 hover:text-emerald-400 transition"
                  >
                    <Eye className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Copy 2: Customer Copy */}
              <div className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <User className="size-3.5 text-sky-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">2. Customer Copy</div>
                    <div className="text-[10px] text-slate-400">Guest invoice &amp; statutory tax receipt</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setCustomerCopies(cnt)}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-semibold transition ${
                        customerCopies === cnt
                          ? "bg-sky-500 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handlePreviewReceipt("CUSTOMER")}
                    title="Preview Customer Invoice"
                    className="p-1 rounded text-slate-400 hover:text-sky-400 transition"
                  >
                    <Eye className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Copy 3: Rider Copy */}
              <div className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <Bike className="size-3.5 text-amber-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">3. Rider Copy</div>
                    <div className="text-[10px] text-slate-400">Bag token &amp; rider delivery handover</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setRiderCopies(cnt)}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-semibold transition ${
                        riderCopies === cnt
                          ? "bg-amber-500 text-black font-bold"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handlePreviewReceipt("RIDER")}
                    title="Preview Rider Handover Ticket"
                    className="p-1 rounded text-slate-400 hover:text-amber-400 transition"
                  >
                    <Eye className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex justify-between">
            <span>Routing: 1 Kitchen · 1 Customer · 1 Rider</span>
            <button
              type="button"
              onClick={() => handlePreviewReceipt("KITCHEN")}
              className="text-emerald-400 hover:underline"
            >
              Test Print Preview
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Preview Modal / Drawer */}
      {previewTicket?.show ? (
        <div className="rounded-xl border border-emerald-500/40 bg-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Receipt className="size-4 text-emerald-400" />
              <span className="font-bold text-xs text-white">
                Live ESC/POS Sample Print Preview ({paperWidth} · {previewTicket.copyType} COPY)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPreviewTicket(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
          <pre
            className={`font-mono text-[10px] sm:text-xs leading-tight bg-slate-900 text-emerald-300 p-3 rounded-lg overflow-x-auto border border-slate-800 ${
              paperWidth === "58mm" ? "max-w-[340px]" : "max-w-[460px]"
            }`}
          >
            {previewTicket.text}
          </pre>
        </div>
      ) : null}

      {/* Footer Save Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
        <div className="text-xs text-emerald-400 flex items-center gap-1.5 min-h-[20px]">
          {saveMsg ? (
            <>
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              <span>{saveMsg}</span>
            </>
          ) : null}
        </div>
        <Button
          size="sm"
          disabled={saving}
          onClick={handleSaveHardware}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4"
        >
          {saving ? "Saving Hardware Settings..." : "Save Thermal POS Printer Settings"}
        </Button>
      </div>
    </Card>
  );
}
