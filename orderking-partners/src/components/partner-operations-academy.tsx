import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PARTNER_ACADEMY_MODULES,
  type SopModule,
  queryPartnerAcademy,
} from "@/lib/academy/partner-sop-data";
import {
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Search,
  Sparkles,
  Timer,
  ChevronRight,
  PackageCheck,
  ChefHat,
  Bike,
  Scale,
  Wallet,
  ExternalLink,
} from "lucide-react";

export function PartnerOperationsAcademy({
  initialQuery = "",
  onAskSpark,
}: {
  initialQuery?: string;
  onAskSpark?: (prompt: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    PARTNER_ACADEMY_MODULES[0]?.id ?? "sop-acceptance-sla"
  );

  const filteredModules = useMemo(() => {
    let list = PARTNER_ACADEMY_MODULES;
    if (searchQuery.trim()) {
      list = queryPartnerAcademy(searchQuery);
    }
    if (selectedCategory !== "ALL") {
      list = list.filter((m) => m.category === selectedCategory);
    }
    return list;
  }, [searchQuery, selectedCategory]);

  const activeModule: SopModule | undefined = useMemo(() => {
    return (
      filteredModules.find((m) => m.id === selectedModuleId) ??
      filteredModules[0] ??
      PARTNER_ACADEMY_MODULES[0]
    );
  }, [filteredModules, selectedModuleId]);

  const categories = [
    { id: "ALL", label: "All SOPs", icon: BookOpen },
    { id: "OPERATIONS", label: "Prep & SLA", icon: ChefHat },
    { id: "PACKAGING", label: "Packaging & Seals", icon: PackageCheck },
    { id: "DISPATCH", label: "Rider Handover", icon: Bike },
    { id: "HYGIENE", label: "FSSAI & Hygiene", icon: ShieldCheck },
    { id: "DISPUTES", label: "Disputes & Payouts", icon: Scale },
    { id: "FINANCE", label: "T+1 & Taxes", icon: Wallet },
  ];

  function getCategoryColor(cat: SopModule["category"]) {
    switch (cat) {
      case "OPERATIONS":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "PACKAGING":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "DISPATCH":
        return "text-purple-400 bg-purple-500/10 border-purple-500/30";
      case "HYGIENE":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "DISPUTES":
        return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      case "FINANCE":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    }
  }

  return (
    <div className="space-y-4">
      {/* Academy Header Banner */}
      <Card className="relative overflow-hidden border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                OrderKing Partner Academy
              </span>
              <span className="text-xs font-mono text-slate-400">
                Standard Kitchen Operating Procedures (SOP)
              </span>
            </div>
            <h1 className="text-xl font-bold font-display text-white tracking-tight">
              Restaurant Partner Operations &amp; Excellence Academy
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Standard operating procedures for commercial Indian kitchens. Eliminate staff training
              friction, protect your restaurant from spurious deductions, and master 120s order SLAs.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to="/assistant">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md"
              >
                <Sparkles className="mr-1.5 size-3.5 text-emerald-200" /> Ask King Spark AI
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2">
          <Search className="size-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SOPs: 'how to pack soup', 'handover OTP', 'FSSAI temperature', 'Section 9(5) GST'..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-slate-400 hover:text-slate-200 font-mono"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="mt-3 flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  active
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Module Sidebar / Selector */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 px-1 font-semibold flex items-center justify-between">
            <span>Operational Modules ({filteredModules.length})</span>
            <span>Select to View</span>
          </div>

          <div className="space-y-2">
            {filteredModules.length === 0 ? (
              <Card className="border-slate-800 bg-slate-900/50 p-6 text-center text-xs text-slate-400">
                No matching SOP found. Try searching for "packaging", "OTP", or "GST".
              </Card>
            ) : (
              filteredModules.map((module) => {
                const isSelected = activeModule?.id === module.id;
                return (
                  <div
                    key={module.id}
                    onClick={() => setSelectedModuleId(module.id)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition group ${
                      isSelected
                        ? "border-emerald-500/60 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 shadow-sm"
                        : "border-slate-800/90 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold border ${getCategoryColor(
                              module.category
                            )}`}
                          >
                            {module.badge}
                          </span>
                        </div>
                        <h3
                          className={`text-xs font-semibold ${
                            isSelected ? "text-emerald-300" : "text-slate-200 group-hover:text-white"
                          }`}
                        >
                          {module.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {module.subtitle}
                        </p>
                      </div>
                      <ChevronRight
                        className={`size-4 shrink-0 transition ${
                          isSelected
                            ? "text-emerald-400 translate-x-0.5"
                            : "text-slate-500 group-hover:text-slate-300"
                        }`}
                      />
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>SLA: {module.slaTarget}</span>
                      <span className="text-emerald-400">{module.keyMetric}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Module Detail Content */}
        <div className="lg:col-span-8">
          {activeModule ? (
            <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-5">
              {/* Active Header */}
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getCategoryColor(
                      activeModule.category
                    )}`}
                  >
                    {activeModule.badge}
                  </span>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400">
                      Target: <strong className="text-slate-200">{activeModule.slaTarget}</strong>
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-emerald-400">
                      Standard: <strong>{activeModule.keyMetric}</strong>
                    </span>
                  </div>
                </div>

                <h2 className="text-lg font-bold font-display text-white">
                  {activeModule.title}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeModule.summary}
                </p>
              </div>

              {/* Step-by-Step SOP Instructions */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <span>Mandatory Execution Steps ({activeModule.steps.length})</span>
                </h3>

                <div className="space-y-2.5">
                  {activeModule.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
                          {step.stepNumber}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-100">
                            {step.title}
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {step.instruction}
                          </p>
                        </div>
                      </div>

                      {step.criticalInvariant && (
                        <div className="ml-9 rounded-lg border border-rose-500/30 bg-rose-950/20 px-3 py-1.5 text-[11px] text-rose-300 flex items-start gap-2">
                          <AlertTriangle className="size-3.5 shrink-0 text-rose-400 mt-0.5" />
                          <span>
                            <strong>Critical Rule:</strong> {step.criticalInvariant}
                          </span>
                        </div>
                      )}

                      {step.proTip && (
                        <div className="ml-9 rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3 py-1.5 text-[11px] text-emerald-300 flex items-start gap-2">
                          <Award className="size-3.5 shrink-0 text-emerald-400 mt-0.5" />
                          <span>
                            <strong>Kitchen Pro-Tip:</strong> {step.proTip}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Mistakes Checklist */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-amber-300">
                    Avoid Common Operations Pitfalls
                  </h4>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                  {activeModule.commonMistakes.map((mistake, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {mistake}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Arbitration & Legal Sense Protection */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-emerald-300">
                    OrderKing Arbitration &amp; Payout Protection
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeModule.arbitrationProtection}
                </p>
              </div>

              {/* Action Bar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Timer className="size-3.5 text-slate-400" />
                  <span>Always in effect across OrderKing merchant network</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (onAskSpark) {
                        onAskSpark(`Explain the SOP for: ${activeModule.title}`);
                      }
                    }}
                    className="border-slate-700 hover:border-emerald-500 text-xs"
                  >
                    <Sparkles className="mr-1.5 size-3.5 text-emerald-400" /> Ask King Spark
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
