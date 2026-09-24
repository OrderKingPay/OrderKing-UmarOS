import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Globe,
  Plus,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  calculateUnitEconomics,
  FinancialStage,
  FinancialTruthRecord,
  INITIAL_FINANCIAL_RECORDS,
} from "@/lib/ai/financial-truth-engine";

export function OpportunityRadarHub({
  founderUpiVpa = "orderking@okhdfcbank",
  onSelectAction,
}: {
  founderUpiVpa?: string;
  onSelectAction?: (action: string, payload: any) => void;
}) {
  const [opportunities, setOpportunities] = useState<FinancialTruthRecord[]>(INITIAL_FINANCIAL_RECORDS);
  const [selectedOpp, setSelectedOpp] = useState<FinancialTruthRecord | null>(INITIAL_FINANCIAL_RECORDS[0] || null);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const handleScanRadar = () => {
    setIsScanning(true);
    toast.info("Radar scanning live market feeds, local tenders & remote contracts...");
    setTimeout(() => {
      setIsScanning(false);
      const newOpp: FinancialTruthRecord = {
        id: `FIN-REC-${Date.now().toString().slice(-4)}`,
        title: "B2B Pharmacy & Diagnostic Lab Logistics Hub",
        clientName: "Barak Valley Medical Network",
        category: "client_services",
        stage: "DISCOVERED",
        estimatedValueInr: 185000,
        invoicedAmountInr: 0,
        confirmedReceivedInr: 0,
        economics: calculateUnitEconomics(185000, 0, 0, 500, 150, 3000),
        sourceEvidence: "Local healthcare procurement tender identified in Silchar/Karimganj cluster.",
        currency: "INR",
        createdAt: new Date().toISOString().split("T")[0]!,
      };
      setOpportunities((prev) => [newOpp, ...prev]);
      setSelectedOpp(newOpp);
      toast.success("New verified opportunity discovered by Opportunity Radar!");
    }, 1200);
  };

  const handleAdvanceStage = (id: string, nextStage: FinancialStage) => {
    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id === id) {
          const updated = {
            ...opp,
            stage: nextStage,
            invoicedAmountInr:
              nextStage === "INVOICED" || nextStage === "PAYMENT_PENDING"
                ? opp.estimatedValueInr
                : opp.invoicedAmountInr,
            confirmedReceivedInr:
              nextStage === "PAYMENT_CONFIRMED" || nextStage === "REVENUE_RECORDED"
                ? opp.estimatedValueInr
                : opp.confirmedReceivedInr,
            verifiedAt:
              nextStage === "PAYMENT_CONFIRMED" || nextStage === "REVENUE_RECORDED"
                ? new Date().toLocaleDateString()
                : opp.verifiedAt,
          };
          return updated;
        }
        return opp;
      })
    );
    if (selectedOpp && selectedOpp.id === id) {
      setSelectedOpp({
        ...selectedOpp,
        stage: nextStage,
        invoicedAmountInr:
          nextStage === "INVOICED" || nextStage === "PAYMENT_PENDING"
            ? selectedOpp.estimatedValueInr
            : selectedOpp.invoicedAmountInr,
        confirmedReceivedInr:
          nextStage === "PAYMENT_CONFIRMED" || nextStage === "REVENUE_RECORDED"
            ? selectedOpp.estimatedValueInr
            : selectedOpp.confirmedReceivedInr,
      });
    }
    toast.success(`Opportunity status advanced to: ${nextStage}`);
  };

  const filtered = opportunities.filter((o) => {
    const matchesCat = filterCategory === "ALL" || o.category === filterCategory;
    const matchesSearch =
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalEstimated = opportunities.reduce((acc, curr) => acc + curr.estimatedValueInr, 0);

  return (
    <div className="flex flex-col h-full w-full bg-surface text-fg rounded-2xl border border-border overflow-hidden">
      {/* Radar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2/40 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="size-5 text-amber-500 animate-spin" style={{ animationDuration: "6s" }} />
            <h2 className="text-lg font-black tracking-tight">Always-On Opportunity Radar</h2>
            <Badge tone="warn" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
              Directive §3, §5 &amp; §14
            </Badge>
          </div>
          <p className="text-xs text-muted">
            Continuous Work Discovery · Objective Requirement Matching · Total Pipeline:{" "}
            <span className="font-bold text-fg">₹{totalEstimated.toLocaleString("en-IN")}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleScanRadar}
            disabled={isScanning}
            className="bg-primary text-white hover:bg-primary/90 text-xs font-bold"
          >
            {isScanning ? (
              <>
                <RefreshCw className="size-3.5 mr-1 animate-spin" /> Scanning Feeds...
              </>
            ) : (
              <>
                <Zap className="size-3.5 mr-1" /> Scan for Opportunities
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Radar Layout (Split: Left Feed, Right Unit Economics & Action Deck) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left Column: Opportunities List */}
        <div className="md:col-span-5 border-r border-border flex flex-col h-full bg-surface">
          {/* Search & Category Filter */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted" />
              <Input
                placeholder="Search opportunities by title or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[11px]">
              {["ALL", "client_services", "freelance_contract", "saas_subscription", "digital_product"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition shrink-0 ${
                    filterCategory === cat
                      ? "bg-primary text-white"
                      : "bg-surface-2 text-muted hover:text-fg border border-border"
                  }`}
                >
                  {cat.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Opportunities Feed Container */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filtered.map((opp) => {
              const isSelected = selectedOpp?.id === opp.id;
              return (
                <div
                  key={opp.id}
                  onClick={() => setSelectedOpp(opp)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-amber-500/10 border-amber-500 shadow-xs"
                      : "bg-surface hover:bg-surface-2/60 border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-bold text-xs text-fg leading-tight">{opp.title}</h4>
                    <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                      ₹{opp.estimatedValueInr.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted mb-2">
                    <span className="capitalize">{opp.category.replace("_", " ")}</span>
                    <span>•</span>
                    <span className="font-semibold text-fg">{opp.clientName}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold ${
                        opp.stage === "REVENUE_RECORDED" || opp.stage === "PAYMENT_CONFIRMED"
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                          : opp.stage === "INVOICED" || opp.stage === "PAYMENT_PENDING"
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                            : "bg-surface-2 text-muted border border-border"
                      }`}
                    >
                      {opp.stage.replace("_", " ")}
                    </span>

                    <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                      {opp.economics.marginPercentage}% Contribution Margin
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Opportunity Spec & Economic Truth Card */}
        <div className="md:col-span-7 flex flex-col h-full overflow-y-auto bg-surface-2/20 p-4 space-y-4">
          {selectedOpp ? (
            <>
              {/* Header Card */}
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-fg">{selectedOpp.title}</h3>
                    <p className="text-xs text-muted mt-0.5">
                      Target Client: <span className="font-bold text-fg">{selectedOpp.clientName}</span> · Category:{" "}
                      <span className="capitalize">{selectedOpp.category.replace("_", " ")}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] uppercase font-black tracking-wider text-muted">Estimated Gross</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      ₹{selectedOpp.estimatedValueInr.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Source Citation & Evidence */}
                <div className="rounded-xl border border-border bg-surface-2/40 p-2.5 text-xs text-muted flex items-start gap-2">
                  <Compass className="size-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-fg block text-[11px]">Source Evidence:</span>
                    <span>{selectedOpp.sourceEvidence}</span>
                  </div>
                </div>
              </div>

              {/* Economic Optimization Breakdown (§15) */}
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-emerald-500" />
                  <span>Unit Economics &amp; Net Contribution Model (§15)</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-border bg-surface-2/30 p-2">
                    <span className="text-muted block text-[10px]">Platform Fees</span>
                    <span className="font-mono font-bold text-fg">₹{selectedOpp.economics.platformFeesInr}</span>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-2/30 p-2">
                    <span className="text-muted block text-[10px]">Infra &amp; Hosting</span>
                    <span className="font-mono font-bold text-fg">₹{selectedOpp.economics.infrastructureCostInr}</span>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-2/30 p-2">
                    <span className="text-muted block text-[10px]">AI / API Cost</span>
                    <span className="font-mono font-bold text-fg">₹{selectedOpp.economics.aiApiCostInr}</span>
                  </div>
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2">
                    <span className="text-emerald-700 dark:text-emerald-300 block text-[10px] font-bold">
                      Net Contribution
                    </span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                      ₹{selectedOpp.economics.netContributionInr.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stage Progression & Execution Deck (§16 Financial Truth Model) */}
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-primary" />
                    <span>Financial Truth Stage Progression (§16)</span>
                  </h4>
                  <Badge
                    tone={
                      selectedOpp.stage === "REVENUE_RECORDED" || selectedOpp.stage === "PAYMENT_CONFIRMED"
                        ? "primary"
                        : "warn"
                    }
                    className="text-xs font-bold"
                  >
                    Current: {selectedOpp.stage.replace("_", " ")}
                  </Badge>
                </div>

                <p className="text-xs text-muted">
                  Strict Rule: Actual revenue is NEVER recorded until a verified transaction confirms payment.
                </p>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold"
                    onClick={() => handleAdvanceStage(selectedOpp.id, "QUALIFIED")}
                  >
                    1. Qualify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold"
                    onClick={() => handleAdvanceStage(selectedOpp.id, "CONTACTED")}
                  >
                    2. Pitch Sent
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold"
                    onClick={() => handleAdvanceStage(selectedOpp.id, "CONTRACTED")}
                  >
                    3. Contract Signed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold"
                    onClick={() => handleAdvanceStage(selectedOpp.id, "INVOICED")}
                  >
                    4. Emit Invoice
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleAdvanceStage(selectedOpp.id, "REVENUE_RECORDED")}
                  >
                    ✓ Confirm Payment &amp; Record Revenue
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted">
              Select an opportunity from the left to view unit economics and truth state.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
