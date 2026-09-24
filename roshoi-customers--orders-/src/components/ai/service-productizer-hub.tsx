import { useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  DollarSign,
  ExternalLink,
  Layers,
  Package,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PRODUCTIZED_SERVICES,
  ProductizedService,
} from "@/lib/ai/service-productizer";

export function ServiceProductizerHub({
  founderUpiVpa = "orderking@okhdfcbank",
}: {
  founderUpiVpa?: string;
}) {
  const [services, setServices] = useState<ProductizedService[]>(PRODUCTIZED_SERVICES);
  const [selectedService, setSelectedService] = useState<ProductizedService>(PRODUCTIZED_SERVICES[0]!);

  return (
    <div className="flex flex-col h-full w-full bg-surface text-fg rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2/40 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="size-5 text-amber-500" />
            <h2 className="text-lg font-black tracking-tight">Service Productizer &amp; Packaging Catalog</h2>
            <Badge tone="warn" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
              Directive §7
            </Badge>
          </div>
          <p className="text-xs text-muted">
            High-Margin Ready-to-Sell Software Services · Guaranteed Deliverables &amp; Turnkey Blueprints
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="primary" className="text-xs font-bold">
            {services.length} Turnkey Packages Available
          </Badge>
        </div>
      </div>

      {/* Main Workspace (Split: Left Catalog, Right Package Spec & Action Deck) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left Column: Services Catalog */}
        <div className="md:col-span-5 border-r border-border flex flex-col h-full bg-surface">
          <div className="p-3 border-b border-border bg-surface-2/30">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-muted">Available Service Packages</h4>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {services.map((srv) => {
              const isSelected = selectedService.id === srv.id;
              return (
                <div
                  key={srv.id}
                  onClick={() => setSelectedService(srv)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-amber-500/10 border-amber-500 shadow-xs"
                      : "bg-surface hover:bg-surface-2/60 border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-bold text-xs text-fg leading-tight">{srv.name}</h4>
                    <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                      ₹{srv.priceRangeInr.min.toLocaleString("en-IN")}+
                    </span>
                  </div>

                  <p className="text-[11px] text-muted line-clamp-2 mb-2">{srv.problemSolved}</p>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {srv.timeline}
                    </span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                      {srv.marginPct}% Margin
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Package Spec */}
        <div className="md:col-span-7 flex flex-col h-full overflow-y-auto bg-surface-2/20 p-4 space-y-4">
          {/* Header Card */}
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-fg">{selectedService.name}</h3>
                <p className="text-xs text-muted mt-0.5">
                  Target: <strong className="text-fg">{selectedService.targetCustomer}</strong>
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase font-black tracking-wider text-muted">Price Range</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ₹{selectedService.priceRangeInr.min.toLocaleString("en-IN")} – ₹{selectedService.priceRangeInr.max.toLocaleString("en-IN")}
                </p>
                {selectedService.optionalRetainerInr && (
                  <p className="text-[11px] text-teal-600 dark:text-teal-400 font-bold">
                    + ₹{selectedService.optionalRetainerInr.toLocaleString("en-IN")}/mo Retainer
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-2/40 p-3 text-xs space-y-1">
              <span className="font-black uppercase text-[10px] text-muted tracking-wider">Problem Solved</span>
              <p className="text-fg font-medium">{selectedService.problemSolved}</p>
            </div>
          </div>

          {/* Deliverables List */}
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-2.5 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span>Standard Contract Deliverables</span>
            </h4>

            <ul className="space-y-1.5 text-xs text-fg">
              {selectedService.deliverables.map((deliv) => (
                <li key={deliv} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>{deliv}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Operations Deck */}
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              <span>Founder Packaging Operations (1-Tap Execution)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs font-bold justify-start"
                onClick={() => {
                  const proposal = `# Formal Enterprise Proposal: ${selectedService.name}\n\n**Client Problem:** ${selectedService.problemSolved}\n**Timeline:** ${selectedService.timeline}\n**Deliverables:**\n${selectedService.deliverables.map((d) => `- ${d}`).join("\n")}\n\n**Investment:** ₹${selectedService.priceRangeInr.min.toLocaleString("en-IN")}\n**Monthly Retainer:** ₹${selectedService.optionalRetainerInr || 0}/mo.`;
                  void navigator.clipboard?.writeText(proposal);
                  toast.success("Complete formal proposal copied to clipboard!");
                }}
              >
                📄 Copy Formal Proposal Markdown
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="text-xs font-bold justify-start"
                onClick={() => {
                  const invoiceId = `INV-${Date.now().toString().slice(-5)}`;
                  const upi = `upi://pay?pa=${founderUpiVpa}&pn=OrderKing&am=${selectedService.priceRangeInr.min}&cu=INR&tn=${selectedService.name.slice(0, 20)}`;
                  void navigator.clipboard?.writeText(upi);
                  toast.success(`Direct UPI Invoice link copied: ₹${selectedService.priceRangeInr.min.toLocaleString("en-IN")}`);
                }}
              >
                💳 Generate Standard Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
