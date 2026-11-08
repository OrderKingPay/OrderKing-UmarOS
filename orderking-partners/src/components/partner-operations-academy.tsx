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
      <Card className="relative overflow-hidden border-gray-200 bg-gradient-to-r from-gray-50 via-white to-emerald-50/30 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                OrderKing Partner Academy
              </span>
              <span className="text-xs font-mono text-gray-500">
                Standard Kitchen Operating Procedures (SOP)
              </span>
            </div>
            <h1 className="text-xl font-bold font-display text-gray-900 tracking-tight">
              Restaurant Partner Operations &amp; Excellence Academy
            </h1>
            <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
              Standard operating procedures for commercial Indian kitchens. Eliminate staff training
              friction, protect your restaurant from spurious deductions, and master 120s order SLAs.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to="/assistant">
              <Button
                size="sm"
                className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold text-xs rounded-xl"
              >
                <Sparkles className="mr-1.5 size-3.5" /> Partner Help Assistant
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-3 py-2">
          <Search className="size-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SOPs: 'how to pack soup', 'handover OTP', 'FSSAI temperature', 'Section 9(5) GST'..."
            className="w-full bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-gray-500 hover:text-gray-800 font-mono"
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
                    ? "bg-[#E23744] text-white shadow-xs"
                    : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:text-gray-900"
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
          <div className="text-[11px] font-mono uppercase tracking-wider text-gray-500 px-1 font-semibold flex items-center justify-between">
            <span>Operational Modules ({filteredModules.length})</span>
            <span>Select to View</span>
          </div>

          <div className="space-y-2">
            {filteredModules.length === 0 ? (
              <Card className="border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-500">
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
                        ? "border-[#E23744] bg-red-50/40 shadow-xs"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
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
                            isSelected ? "text-gray-900 font-bold" : "text-gray-800 group-hover:text-gray-900"
                          }`}
                        >
                          {module.title}
                        </h3>
                        <p className="text-[11px] text-gray-500 line-clamp-1">
                          {module.subtitle}
                        </p>
                      </div>
                      <ChevronRight
                        className={`size-4 shrink-0 transition ${
                          isSelected
                            ? "text-[#E23744] translate-x-0.5"
                            : "text-gray-400 group-hover:text-gray-700"
                        }`}
                      />
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                      <span>SLA: {module.slaTarget}</span>
                      <span className="text-emerald-700 font-bold">{module.keyMetric}</span>
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
            <Card className="border-gray-200 bg-white p-5 space-y-5 shadow-xs">
              {/* Active Header */}
              <div className="space-y-2 border-b border-gray-100 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getCategoryColor(
                      activeModule.category
                    )}`}
                  >
                    {activeModule.badge}
                  </span>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-gray-500">
                      Target: <strong className="text-gray-800">{activeModule.slaTarget}</strong>
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-emerald-700 font-bold">
                      Standard: <strong>{activeModule.keyMetric}</strong>
                    </span>
                  </div>
                </div>

                <h2 className="text-lg font-bold font-display text-gray-900">
                  {activeModule.title}
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {activeModule.summary}
                </p>
              </div>

              {/* Step-by-Step SOP Instructions */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-gray-500 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>Mandatory Execution Steps ({activeModule.steps.length})</span>
                </h3>

                <div className="space-y-2.5">
                  {activeModule.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 space-y-2"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold font-mono">
                          {step.stepNumber}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-gray-900">
                            {step.title}
                          </h4>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {step.instruction}
                          </p>
                        </div>
                      </div>

                      {step.criticalInvariant && (
                        <div className="ml-9 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] text-rose-900 flex items-start gap-2">
                          <AlertTriangle className="size-3.5 shrink-0 text-rose-600 mt-0.5" />
                          <span>
                            <strong>Critical Rule:</strong> {step.criticalInvariant}
                          </span>
                        </div>
                      )}

                      {step.proTip && (
                        <div className="ml-9 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-900 flex items-start gap-2">
                          <Award className="size-3.5 shrink-0 text-emerald-600 mt-0.5" />
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
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-amber-900">
                    Avoid Common Operations Pitfalls
                  </h4>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-700 list-disc list-inside">
                  {activeModule.commonMistakes.map((mistake, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {mistake}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Arbitration & Legal Sense Protection */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-emerald-900">
                    OrderKing Arbitration &amp; Payout Protection
                  </h4>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {activeModule.arbitrationProtection}
                </p>
              </div>

              {/* Action Bar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 text-xs">
                <div className="flex items-center gap-2 text-gray-500">
                  <Timer className="size-3.5 text-gray-400" />
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
                    className="border-gray-300 hover:border-[#E23744] text-xs rounded-xl"
                  >
                    <Sparkles className="mr-1.5 size-3.5 text-gray-500" /> Ask Support
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
