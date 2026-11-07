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
  Eye,
  X,
} from "lucide-react";

export interface ThermalPrinterHardwarePanelProps {
  restaurantId?: string;
  restaurantName?: string;
}

export function ThermalPrinterHardwarePanel({
  restaurantId: _restaurantId,
  restaurantName = "OrderKing Partner Kitchen",
}: ThermalPrinterHardwarePanelProps) {
  // 1. Thermal Receipt Paper Width Selector (58mm vs 80mm)
  const [paperWidth, setPaperWidth] = useState<PaperWidth>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_paper_width");
      if (saved === "58mm" || saved === "80mm") return saved;
    }
    return "80mm";
  });

  // 2. Auto-Print Kitchen Order Ticket (KOT) on Acceptance Toggle
  const [autoPrintKot, setAutoPrintKot] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_auto_print_kot");
      if (saved !== null) return saved === "true";
      const fallback = localStorage.getItem("ok_auto_print_on_order");
      if (fallback !== null) return fallback === "true";
    }
    return true;
  });

  // 3. Number of KOT copies to print
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
        `Printer configuration saved: ${paperWidth} paper, auto-print ${autoPrintKot ? "enabled" : "disabled"}, ${totalCopies} total copies.`,
      );
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Failed to save printer settings");
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePreview = (copyType: "KITCHEN" | "CUSTOMER" | "RIDER") => {
    const res = generateEscPosReceipt(
      {
        restaurantName,
        orderNumber: "OK-8942",
        orderType: "DELIVERY",
        tableOrArea: "Delivery Order",
        timestamp: new Date().toLocaleString("en-IN"),
        prepMinutes: 20,
        items: [
          {
            name: "Dum Biryani",
            quantity: 2,
            pricePaise: 54000,
            station: "MAIN",
            instructions: "Extra raita",
          },
          {
            name: "Butter Naan",
            quantity: 3,
            pricePaise: 18000,
            station: "BREAD",
          },
          {
            name: "Gulab Jamun",
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
        specialInstructions: `*** ${copyType} COPY ***`,
        qrPayload: "https://partner.orderkingpay.com/orders",
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
    <Card className="border-gray-200 bg-white p-6 space-y-6 text-gray-900 rounded-2xl shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-[#E23744]">
            <Printer className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-gray-900 flex items-center gap-2">
              Receipt &amp; Kitchen Order Printers
            </h2>
            <p className="text-xs text-gray-500">
              Configure receipt roll sizes, automatic ticket printing upon order acceptance, and print copies.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
            {paperWidth} · {totalCopies} Copies
          </span>
        </div>
      </div>

      {/* Main Grid: Paper Width, Auto-Print Toggle, and Copies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Section 1: Paper Width Selector */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-[#E23744]" />
                <span className="font-bold text-xs text-gray-900">Receipt Paper Width</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Select your thermal receipt printer roll width for optimal text formatting:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {/* 58mm Option */}
              <button
                type="button"
                onClick={() => setPaperWidth("58mm")}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  paperWidth === "58mm"
                    ? "border-[#E23744] bg-red-50 text-red-900 shadow-xs"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div>
                  <div className="font-bold text-xs">58mm (2-Inch)</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Compact Bluetooth / Handheld POS
                  </div>
                </div>
                {paperWidth === "58mm" ? (
                  <CheckCircle2 className="size-4 text-[#E23744] shrink-0" />
                ) : null}
              </button>

              {/* 80mm Option */}
              <button
                type="button"
                onClick={() => setPaperWidth("80mm")}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  paperWidth === "80mm"
                    ? "border-[#E23744] bg-red-50 text-red-900 shadow-xs"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div>
                  <div className="font-bold text-xs">80mm (3-Inch)</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Standard Kitchen &amp; Billing Desk Printer
                  </div>
                </div>
                {paperWidth === "80mm" ? (
                  <CheckCircle2 className="size-4 text-[#E23744] shrink-0" />
                ) : null}
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Auto-Print on Acceptance */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-[#E23744]" />
                <span className="font-bold text-xs text-gray-900">Auto-Print on Accept</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPrintKot}
                  onChange={(e) => setAutoPrintKot(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E23744]"></div>
              </label>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              When enabled, accepting an order automatically prints the kitchen order ticket without requiring extra taps.
            </p>

            <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2 text-xs shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Trigger:</span>
                <span className="font-semibold text-gray-900">On Order Acceptance</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold ${autoPrintKot ? "text-emerald-700" : "text-gray-500"}`}>
                  {autoPrintKot ? "Automatic" : "Manual"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Number of Copies */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <Copy className="size-4 text-[#E23744]" />
                <span className="font-bold text-xs text-gray-900">Print Copies</span>
              </div>
              <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-xs">
                {totalCopies} Total
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Select how many copies are generated per order:
            </p>

            <div className="space-y-2.5">
              {/* Kitchen Copy */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-white shadow-xs">
                <div>
                  <div className="font-bold text-xs text-gray-900">Kitchen Copy</div>
                  <div className="text-[11px] text-gray-500">For chef &amp; preparation line</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setKitchenCopies(num)}
                      className={`size-7 rounded-lg text-xs font-bold transition ${
                        kitchenCopies === num
                          ? "bg-[#E23744] text-white shadow-xs"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Copy */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-white shadow-xs">
                <div>
                  <div className="font-bold text-xs text-gray-900">Customer Bill</div>
                  <div className="text-[11px] text-gray-500">Attach to food package</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCustomerCopies(num)}
                      className={`size-7 rounded-lg text-xs font-bold transition ${
                        customerCopies === num
                          ? "bg-[#E23744] text-white shadow-xs"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rider Copy */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-white shadow-xs">
                <div>
                  <div className="font-bold text-xs text-gray-900">Rider Handover</div>
                  <div className="text-[11px] text-gray-500">Delivery verification slip</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRiderCopies(num)}
                      className={`size-7 rounded-lg text-xs font-bold transition ${
                        riderCopies === num
                          ? "bg-[#E23744] text-white shadow-xs"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="pt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500 font-semibold mr-1">Preview Format:</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleGeneratePreview("KITCHEN")}
          className="h-8 text-xs font-semibold rounded-lg border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
        >
          <Eye className="mr-1.5 size-3.5 text-gray-500" /> Kitchen Ticket
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleGeneratePreview("CUSTOMER")}
          className="h-8 text-xs font-semibold rounded-lg border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
        >
          <Eye className="mr-1.5 size-3.5 text-gray-500" /> Customer Bill
        </Button>
      </div>

      {/* Ticket Preview Modal */}
      {previewTicket?.show ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="font-bold text-sm text-gray-900">
                {previewTicket.copyType} Preview ({paperWidth})
              </span>
              <button
                type="button"
                onClick={() => setPreviewTicket(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="size-4" />
              </button>
            </div>
            <pre className="max-h-80 overflow-y-auto rounded-xl bg-gray-50 border border-gray-200 p-3.5 font-mono text-[11px] leading-relaxed text-gray-800 whitespace-pre">
              {previewTicket.text}
            </pre>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => setPreviewTicket(null)}
                className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-4 rounded-xl"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Footer Save Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 min-h-[20px]">
          {saveMsg ? (
            <>
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>{saveMsg}</span>
            </>
          ) : null}
        </div>
        <Button
          size="sm"
          disabled={saving}
          onClick={handleSaveHardware}
          className="bg-[#E23744] hover:bg-[#d32f2f] text-white text-xs font-bold px-6 h-10 rounded-xl shadow-xs"
        >
          {saving ? "Saving..." : "Save Printer Settings"}
        </Button>
      </div>
    </Card>
  );
}
