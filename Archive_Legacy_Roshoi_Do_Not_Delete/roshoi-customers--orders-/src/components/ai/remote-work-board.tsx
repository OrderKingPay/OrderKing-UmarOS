import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  FileText,
  Filter,
  Globe,
  MapPin,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CURATED_REMOTE_GIGS,
  RemoteContractGig,
} from "@/lib/ai/supreme-founder-ai-core";

export function RemoteWorkBoard({
  onSelectAction,
}: {
  onSelectAction?: (action: string, payload: any) => void;
}) {
  const [gigs, setGigs] = useState<
    Array<RemoteContractGig & { applicationStatus: "NOT_APPLIED" | "APPLIED" | "INTERVIEWING" | "OFFER_RECEIVED" }>
  >(() =>
    CURATED_REMOTE_GIGS.map((g) => ({
      ...g,
      applicationStatus: "NOT_APPLIED",
    }))
  );

  const [selectedGig, setSelectedGig] = useState<(typeof gigs)[0] | null>(gigs[0] || null);
  const [skillFilter, setSkillFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGigs = gigs.filter((gig) => {
    const matchesSkill =
      skillFilter === "ALL" || gig.skillsRequired.some((s) => s.toLowerCase().includes(skillFilter.toLowerCase()));
    const matchesSearch =
      gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.clientLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.platform.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSkill && matchesSearch;
  });

  const handleUpdateStatus = (
    gigId: string,
    status: "NOT_APPLIED" | "APPLIED" | "INTERVIEWING" | "OFFER_RECEIVED"
  ) => {
    setGigs((prev) =>
      prev.map((g) => (g.id === gigId ? { ...g, applicationStatus: status } : g))
    );
    if (selectedGig && selectedGig.id === gigId) {
      setSelectedGig({ ...selectedGig, applicationStatus: status });
    }
    toast.success(`Application status updated to: ${status}`);
  };

  return (
    <div className="flex flex-col h-full w-full bg-surface text-fg rounded-2xl border border-border overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2/40 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="size-5 text-blue-500" />
            <h2 className="text-lg font-black tracking-tight">Verified Remote Work &amp; High-Ticket Contracts</h2>
            <Badge tone="primary" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
              Directive §16
            </Badge>
          </div>
          <p className="text-xs text-muted">
            Direct Opportunity Discovery · Verified USD / Global Contracts · Strict Zero-Fabrication Standard
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-xs">
            ⚡ {gigs.length} Verified Contracts Available
          </Badge>
        </div>
      </div>

      {/* Main Workspace (Split List & Detail) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left Column: Gigs List */}
        <div className="md:col-span-5 border-r border-border flex flex-col h-full bg-surface">
          {/* Search & Skill Filter */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted" />
              <Input
                placeholder="Search contracts by role, tech stack, or platform..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[11px]">
              {["ALL", "React", "TypeScript", "Node.js", "PostgreSQL", "Full-Stack"].map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => setSkillFilter(skill)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition shrink-0 ${
                    skillFilter === skill
                      ? "bg-primary text-white"
                      : "bg-surface-2 text-muted hover:text-fg border border-border"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Gigs List Container */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredGigs.map((gig) => {
              const isSelected = selectedGig?.id === gig.id;
              return (
                <div
                  key={gig.id}
                  onClick={() => setSelectedGig(gig)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-blue-500/10 border-blue-500 shadow-xs"
                      : "bg-surface hover:bg-surface-2/60 border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-bold text-xs text-fg leading-tight">{gig.title}</h4>
                    <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                      ${gig.hourlyRateUsd}/hr
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted mb-2">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{gig.platform}</span>
                    <span>•</span>
                    <span>{gig.clientLocation}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {gig.skillsRequired.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted border border-border"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <Sparkles className="size-3" />
                      <span>{gig.matchScore}% Match Score</span>
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                        gig.applicationStatus === "APPLIED"
                          ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                          : gig.applicationStatus === "INTERVIEWING"
                            ? "bg-purple-500/20 text-purple-700 dark:text-purple-300"
                            : gig.applicationStatus === "OFFER_RECEIVED"
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                              : "bg-surface-2 text-muted"
                      }`}
                    >
                      {gig.applicationStatus.replace("_", " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Job Spec & Proposal Generator */}
        <div className="md:col-span-7 flex flex-col h-full overflow-y-auto bg-surface-2/20 p-4 space-y-4">
          {selectedGig ? (
            <>
              {/* Job Header */}
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-fg">{selectedGig.title}</h3>
                    <p className="text-xs text-muted flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{selectedGig.platform}</span>
                      <span>•</span>
                      <span>{selectedGig.clientLocation}</span>
                      <span>•</span>
                      <span>Duration: {selectedGig.duration}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] uppercase font-black tracking-wider text-muted">Compensation</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      ${selectedGig.hourlyRateUsd} <span className="text-xs font-normal text-muted">/ hour</span>
                    </p>
                    {selectedGig.fixedBudgetUsd && (
                      <p className="text-[11px] text-muted">Fixed: ${selectedGig.fixedBudgetUsd.toLocaleString()}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
                  {selectedGig.skillsRequired.map((s) => (
                    <Badge key={s} tone="neutral" className="text-xs font-semibold">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Description & Objective Fit */}
              <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase text-muted tracking-wider">Project Description &amp; Scope</h4>
                <p className="text-xs font-medium text-fg leading-relaxed">{selectedGig.description}</p>
              </div>

              {/* AI Tailored Proposal Generator */}
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-primary">
                      AI Tailored Bid &amp; Cover Proposal
                    </h4>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold"
                    onClick={() => {
                      void navigator.clipboard?.writeText(selectedGig.proposalTemplate);
                      toast.success("Tailored proposal copied to clipboard!");
                    }}
                  >
                    <Copy className="size-3 mr-1" /> Copy Proposal
                  </Button>
                </div>

                <div className="rounded-xl border border-border bg-surface p-3 font-mono text-xs text-muted whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedGig.proposalTemplate}
                </div>

                {/* Application Tracking Status Buttons */}
                <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-muted">Update Tracking:</span>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant={selectedGig.applicationStatus === "APPLIED" ? "primary" : "outline"}
                      className="text-xs font-bold"
                      onClick={() => handleUpdateStatus(selectedGig.id, "APPLIED")}
                    >
                      ✓ Applied
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedGig.applicationStatus === "INTERVIEWING" ? "primary" : "outline"}
                      className="text-xs font-bold"
                      onClick={() => handleUpdateStatus(selectedGig.id, "INTERVIEWING")}
                    >
                      💬 Interviewing
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedGig.applicationStatus === "OFFER_RECEIVED" ? "primary" : "outline"}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleUpdateStatus(selectedGig.id, "OFFER_RECEIVED")}
                    >
                      🎉 Offer Received
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted">
              Select an opportunity from the left to view requirements and generate tailored proposals.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
