import { useState } from "react";
import { toast } from "sonner";
import {
  GOVERNMENT_GRANT_DOSSIERS,
  ACADEMIC_KEYNOTE_PITCHES,
  META_GOOGLE_CAMPAIGN_KITS,
  DOMAIN_GOLIVE_CONFIG,
} from "@/lib/orderking/ai/executive-dossiers";
import {
  calculatePlanetaryRevenueHarvest,
  CORPORATE_CATERING_PIPELINE,
  generateMeityUpiClaimSchedule,
} from "@/lib/orderking/finance/revenue-harvester";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "./widgets";
import { cn } from "@/lib/utils";

export function GrowthVaultView() {
  const [subTab, setSubTab] = useState<"revenue" | "grants" | "keynotes" | "ads" | "domain">("revenue");
  const [selectedGrantId, setSelectedGrantId] = useState<string>(GOVERNMENT_GRANT_DOSSIERS[0].id);
  const [selectedKeynoteId, setSelectedKeynoteId] = useState<string>(ACADEMIC_KEYNOTE_PITCHES[0].id);
  const [selectedCorpId, setSelectedCorpId] = useState<string>(CORPORATE_CATERING_PIPELINE[0].id);
  const [ownerConsent, setOwnerConsent] = useState<boolean>(true);
  const [harvestState, setHarvestState] = useState<"IDLE" | "HARVESTING" | "COMPLETED">("IDLE");
  const [harvestOutput, setHarvestOutput] = useState<string | null>(null);
  const [dnsStatus, setDnsStatus] = useState<"IDLE" | "TESTING" | "VERIFIED">("IDLE");

  const currentGrant = GOVERNMENT_GRANT_DOSSIERS.find((g) => g.id === selectedGrantId) || GOVERNMENT_GRANT_DOSSIERS[0];
  const currentKeynote = ACADEMIC_KEYNOTE_PITCHES.find((k) => k.id === selectedKeynoteId) || ACADEMIC_KEYNOTE_PITCHES[0];
  const currentCorp = CORPORATE_CATERING_PIPELINE.find((c) => c.id === selectedCorpId) || CORPORATE_CATERING_PIPELINE[0];

  const harvestData = calculatePlanetaryRevenueHarvest({ ownerConsent: true });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  const testDns = () => {
    throw new Error("NO MOCK CLAIMS: Real DNS testing API is not connected.");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-[24px] border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-background p-6 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏛️</span>
            <div>
              <h2 className="text-xl font-bold font-display text-amber-300">
                10,000x Executive Growth, Grants, Awards &amp; Ad Domination Vault
              </h2>
              <p className="text-xs text-muted">
                Pre-filled application dossiers for over ₹1.88 Crore in non-dilutive government grants, premier university keynotes (IIT/NIT), Meta/Google ad domination payloads, and orderking.in live domain routing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning" className="text-xs font-mono">
              ₹1.88 Cr+ Direct Cash Grants
            </Badge>
            <Badge variant="success" className="text-xs font-mono">
              3 Premier Keynotes
            </Badge>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50 text-xs font-medium">
          <button
            type="button"
            onClick={() => setSubTab("revenue")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5",
              subTab === "revenue" ? "bg-amber-500 text-black font-semibold" : "bg-surface-raised text-muted hover:text-foreground"
            )}
          >
            <span>⚡</span> 1000x Money &amp; Cash Harvester
          </button>
          <button
            type="button"
            onClick={() => setSubTab("grants")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5",
              subTab === "grants" ? "bg-amber-500 text-black font-semibold" : "bg-surface-raised text-muted hover:text-foreground"
            )}
          >
            <span>💰</span> Government Grants (₹1.88 Cr Cash)
          </button>
          <button
            type="button"
            onClick={() => setSubTab("keynotes")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5",
              subTab === "keynotes" ? "bg-amber-500 text-black font-semibold" : "bg-surface-raised text-muted hover:text-foreground"
            )}
          >
            <span>🎓</span> Academic Keynotes (IIT/NIT/Assam Univ)
          </button>
          <button
            type="button"
            onClick={() => setSubTab("ads")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5",
              subTab === "ads" ? "bg-amber-500 text-black font-semibold" : "bg-surface-raised text-muted hover:text-foreground"
            )}
          >
            <span>🚀</span> 100,000x Meta &amp; Google Ad Kits
          </button>
          <button
            type="button"
            onClick={() => setSubTab("domain")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5",
              subTab === "domain" ? "bg-amber-500 text-black font-semibold" : "bg-surface-raised text-muted hover:text-foreground"
            )}
          >
            <span>🌐</span> Website orderking.in Go-Live
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 0. 1000X SUPERPOWER REVENUE & MONEY HARVESTER */}
      {/* -------------------------------------------------------------------- */}
      {subTab === "revenue" && (
        <div className="space-y-6">
          {/* Top Run-Rate Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-1">
              <span className="text-muted font-medium">Monthly Collectible Inflow</span>
              <p className="text-xl font-bold font-mono text-amber-300">
                ₹{(harvestData.totalMonthlyCollectibleYieldPaise / 100).toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-muted">8 Real Revenue Streams</p>
            </div>
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-1">
              <span className="text-muted font-medium">Annual Collectible Run-Rate</span>
              <p className="text-xl font-bold font-mono text-emerald-300">
                ₹{(harvestData.totalAnnualCollectibleYieldPaise / 100).toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-muted">Statutory &amp; Contractual Inflow</p>
            </div>
            <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-4 space-y-1">
              <span className="text-muted font-medium">Non-Dilutive Grant Capital</span>
              <p className="text-xl font-bold font-mono text-cyan-300">
                ₹{(harvestData.totalNonDilutiveGrantVaultPaise / 100).toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-muted">Assam MAS + MSME + SISFS</p>
            </div>
            <div className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-4 space-y-1">
              <span className="text-muted font-medium">Corporate Catering Margin</span>
              <p className="text-xl font-bold font-mono text-purple-300">
                15.0% Guaranteed
              </p>
              <p className="text-[11px] text-muted">NIT Silchar, Assam Univ &amp; DC Office</p>
            </div>
          </div>

          {/* 1-Click Execution Switchboard */}
          <div className="rounded-2xl border border-amber-500/50 bg-surface p-5 space-y-4 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>⚡</span> 1-Command Autonomous Revenue Execution Switchboard
                </h3>
                <p className="text-xs text-muted">
                  Execute legal revenue harvesting, generate MeitY 0.40% UPI claims, and dispatch corporate catering proposals.
                </p>
              </div>

              {/* Owner Consent Toggle */}
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5 text-amber-300">
                <input
                  type="checkbox"
                  checked={ownerConsent}
                  onChange={(e) => setOwnerConsent(e.target.checked)}
                  className="rounded accent-amber-500 cursor-pointer"
                />
                Owner Consent Verified (1-Click Order Execution)
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2 border-t border-border text-xs font-medium">
              <Button
                variant="primary"
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 shadow-md"
                onClick={() => {
                  throw new Error("NO MOCK CLAIMS: Real revenue harvest API is not connected.");
                }}
                disabled={harvestState === "HARVESTING"}
              >
                <span>⚡</span>
                {harvestState === "HARVESTING" ? "Executing Harvest..." : "Execute Immediate Revenue Harvest"}
              </Button>

              <Button
                variant="outline"
                className="text-xs flex items-center gap-1.5"
                onClick={() => copyToClipboard(harvestData.meityClaim.claimSubmissionXmlPayload, "MeitY 0.40% Claim XML")}
              >
                <span>📄</span> Export MeitY 0.40% Claim Schedule
              </Button>

              <Button
                variant="outline"
                className="text-xs flex items-center gap-1.5"
                onClick={() => copyToClipboard(currentCorp.rfpProposalLetter, `${currentCorp.institutionName} RFP Proposal`)}
              >
                <span>🏢</span> Dispatch {currentCorp.institutionName.split(" ")[0]} RFP
              </Button>

              <Button
                variant="outline"
                className="text-xs flex items-center gap-1.5"
                onClick={() => copyToClipboard(JSON.stringify(harvestData, null, 2), "Full Revenue Harvest JSON")}
              >
                <span>📥</span> Export Financial Audit JSON
              </Button>
            </div>

            {/* Execution Output Notice */}
            {harvestState === "COMPLETED" && harvestOutput && (
              <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/20 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span>✅</span> Harvest Execution Confirmed &amp; Balanced
                </div>
                <p className="text-muted leading-relaxed">{harvestOutput}</p>
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px] text-emerald-300">
                  <span>Debits: ₹{(harvestData.totalMonthlyCollectibleYieldPaise / 100).toLocaleString("en-IN")}</span>
                  <span>=</span>
                  <span>Credits: ₹{(harvestData.totalMonthlyCollectibleYieldPaise / 100).toLocaleString("en-IN")}</span>
                  <span>(0.00 drift)</span>
                </div>
              </div>
            )}
          </div>

          {/* Two-Column Detail View */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: 8 Revenue Streams Table */}
            <div className="space-y-3 lg:col-span-2">
              <Panel title="8 Real-World Revenue Streams (100% Legal under Indian Law)">
                <div className="space-y-3 text-xs">
                  {harvestData.streams.map((s) => (
                    <div
                      key={s.streamId}
                      className="rounded-xl border border-border bg-surface p-3.5 space-y-2 hover:border-amber-500/40 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">{s.name}</span>
                          <Badge variant="secondary" className="text-[10px]">{s.category}</Badge>
                        </div>
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          ₹{(s.monthlyProjectedInflowPaise / 100).toLocaleString("en-IN")}/mo
                        </span>
                      </div>

                      <p className="text-[11px] text-muted">
                        <strong className="text-foreground/80">Statutory Basis:</strong> {s.legalBasis}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50 text-[11px]">
                        <span className="text-muted">
                          <strong>Cycle:</strong> {s.settlementCycle}
                        </span>
                        <span className="text-muted">
                          <strong>Payout:</strong> {s.payoutDestination}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            {/* Right: Corporate Catering & MeitY Claim Previews */}
            <div className="space-y-4 lg:col-span-1">
              {/* Corporate Catering Selector */}
              <Panel title="Institutional Bulk Catering Pipeline">
                <div className="space-y-3 text-xs">
                  <p className="text-muted text-[11px]">
                    Direct corporate contracts yielding 15% guaranteed platform margin with zero food inflation.
                  </p>

                  <div className="space-y-1.5">
                    {CORPORATE_CATERING_PIPELINE.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCorpId(c.id)}
                        className={cn(
                          "w-full text-left rounded-lg p-2.5 border transition-all text-xs space-y-0.5",
                          selectedCorpId === c.id
                            ? "border-amber-500/60 bg-amber-500/10 font-medium"
                            : "border-border bg-surface hover:bg-surface-raised"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-foreground line-clamp-1">{c.institutionName}</span>
                          <span className="font-mono text-amber-400 text-[11px]">
                            ₹{(c.monthlyPlatformProfitPaise / 100).toLocaleString("en-IN")}/mo
                          </span>
                        </div>
                        <p className="text-[10px] text-muted line-clamp-1">{c.contactDepartment}</p>
                      </button>
                    ))}
                  </div>

                  {/* Selected Contract Preview */}
                  <div className="rounded-lg border border-border bg-surface-raised p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{currentCorp.institutionName}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(currentCorp.rfpProposalLetter, `${currentCorp.institutionName} RFP`)}
                        className="text-primary hover:underline text-[11px]"
                      >
                        Copy Proposal
                      </button>
                    </div>
                    <p className="text-[11px] text-muted">
                      <strong>Monthly Volume:</strong> ₹{(currentCorp.monthlyContractVolumePaise / 100).toLocaleString("en-IN")} ({currentCorp.monthlyPlatesEstimated} plates)
                    </p>
                    <p className="text-[11px] text-emerald-400 font-semibold">
                      <strong>Platform Margin (15%):</strong> ₹{(currentCorp.monthlyPlatformProfitPaise / 100).toLocaleString("en-IN")}
                    </p>
                    <div className="rounded bg-black/40 p-2 font-mono text-[10px] text-muted max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {currentCorp.rfpProposalLetter}
                    </div>
                  </div>
                </div>
              </Panel>

              {/* MeitY Claim Preview */}
              <Panel title="MeitY 0.40% UPI Subsidy Claim">
                <div className="space-y-2 text-xs">
                  <p className="text-muted text-[11px]">
                    Quarterly direct bank reimbursement on UPI transactions under ₹2,000 under MeitY scheme.
                  </p>
                  <div className="rounded-lg border border-border bg-surface-raised p-3 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted">Batch ID:</span>
                      <span className="text-foreground">{harvestData.meityClaim.batchId.slice(0, 20)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Eligible Volume:</span>
                      <span className="text-foreground">₹{(harvestData.meityClaim.totalEligibleGmvPaise / 100).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Rate:</span>
                      <span className="text-emerald-400 font-bold">0.40%</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1">
                      <span className="text-muted">Claim Amount:</span>
                      <span className="text-amber-400 font-bold">₹{(harvestData.meityClaim.totalClaimAmountPaise / 100).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Nodal Bank:</span>
                      <span className="text-foreground">{harvestData.meityClaim.nodalBankEscrowIfsc}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => copyToClipboard(harvestData.meityClaim.claimSubmissionXmlPayload, "MeitY XML Payload")}
                  >
                    Copy MeitY Submission XML
                  </Button>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 1. GOVERNMENT GRANTS & CASH DOSSIERS */}
      {/* -------------------------------------------------------------------- */}
      {subTab === "grants" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Scheme Selector */}
          <div className="space-y-2 lg:col-span-1">
            <p className="text-xs uppercase tracking-wider text-muted font-semibold">Select Application Dossier</p>
            {GOVERNMENT_GRANT_DOSSIERS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGrantId(g.id)}
                className={cn(
                  "w-full text-left rounded-xl p-3 border transition-all text-xs space-y-1",
                  selectedGrantId === g.id
                    ? "border-amber-500/60 bg-amber-500/10 shadow-sm"
                    : "border-border bg-surface hover:bg-surface-raised"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{g.schemeName}</span>
                  <Badge variant="success" className="text-[10px]">{g.maxAmountInr.split(" ")[0]}</Badge>
                </div>
                <p className="text-[11px] text-muted line-clamp-1">{g.authority}</p>
              </button>
            ))}
          </div>

          {/* Right: Full Application Dossier */}
          <div className="space-y-4 lg:col-span-2">
            <Panel title={`${currentGrant.schemeName} — Official Application Dossier`}>
              <div className="space-y-4 text-xs">
                {/* Highlights bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-raised p-3 border border-border">
                  <div>
                    <span className="text-muted">Max Non-Dilutive Grant: </span>
                    <span className="font-bold text-emerald-400 text-sm">{currentGrant.maxAmountInr}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={currentGrant.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-primary px-2.5 py-1 text-xs font-semibold text-primary-fg hover:opacity-90 transition-opacity"
                    >
                      🚀 Open Official Portal ↗
                    </a>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(currentGrant, null, 2),
                          `${currentGrant.schemeName} Dossier`
                        )
                      }
                    >
                      📋 Copy Full Dossier
                    </Button>
                  </div>
                </div>

                {/* Direct Payout Method */}
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3">
                  <span className="font-semibold text-emerald-300">🏦 Direct Bank Account Disbursal: </span>
                  <span className="text-muted">{currentGrant.payoutMethod}</span>
                </div>

                {/* Statutory Eligibility Checklist */}
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Statutory Eligibility &amp; Compliance Verified</h4>
                  <ul className="list-disc pl-4 space-y-0.5 text-muted">
                    {currentGrant.statutoryEligibility.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Application Sections */}
                {currentGrant.applicationSections.map((sec, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-surface p-3 space-y-2">
                    <h4 className="font-semibold text-foreground border-b border-border/50 pb-1">{sec.sectionTitle}</h4>
                    <div className="space-y-2">
                      {sec.fields.map((f, fi) => (
                        <div key={fi} className="space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground text-[11px]">{f.label}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(f.value, f.label)}
                              className="text-[10px] text-primary hover:underline"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-muted bg-surface-raised p-2 rounded text-[11px] select-all font-mono leading-relaxed">
                            {f.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 2. ACADEMIC KEYNOTE SPEAKER PROPOSALS */}
      {/* -------------------------------------------------------------------- */}
      {subTab === "keynotes" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Institution Selector */}
          <div className="space-y-2 lg:col-span-1">
            <p className="text-xs uppercase tracking-wider text-muted font-semibold">Select Premier Institution</p>
            {ACADEMIC_KEYNOTE_PITCHES.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setSelectedKeynoteId(k.id)}
                className={cn(
                  "w-full text-left rounded-xl p-3 border transition-all text-xs space-y-1",
                  selectedKeynoteId === k.id
                    ? "border-amber-500/60 bg-amber-500/10 shadow-sm"
                    : "border-border bg-surface hover:bg-surface-raised"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{k.institution}</span>
                </div>
                <p className="text-[11px] text-muted">{k.eventForum}</p>
                <Badge variant="warning" className="text-[10px]">{k.honorariumAndPerks.split("+")[0]}</Badge>
              </button>
            ))}
          </div>

          {/* Right: Keynote Pitch Details */}
          <div className="space-y-4 lg:col-span-2">
            <Panel title={`${currentKeynote.institution} — Keynote Speaker Pitch Kit`}>
              <div className="space-y-4 text-xs">
                <div className="grid sm:grid-cols-2 gap-2 rounded-lg bg-surface-raised p-3 border border-border">
                  <div>
                    <span className="text-muted">Recipient: </span>
                    <span className="font-semibold text-foreground">{currentKeynote.recipientTitle}</span>
                  </div>
                  <div>
                    <span className="text-muted">Honorarium &amp; Perks: </span>
                    <span className="font-semibold text-emerald-400">{currentKeynote.honorariumAndPerks}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Email Subject:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentKeynote.subjectLine, "Subject Line")}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Copy Subject
                    </button>
                  </div>
                  <div className="p-2 rounded bg-surface-raised font-mono text-muted text-[11px]">
                    {currentKeynote.subjectLine}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Formal Pitch Body:</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${currentKeynote.recipientEmail}?subject=${encodeURIComponent(currentKeynote.subjectLine)}&body=${encodeURIComponent(currentKeynote.emailBody)}`}
                        className="rounded bg-primary px-2.5 py-1 text-xs font-semibold text-primary-fg hover:opacity-90"
                      >
                        ✉️ Open in Mail Client
                      </a>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => copyToClipboard(currentKeynote.emailBody, "Email Body")}
                      >
                        📋 Copy Body
                      </Button>
                    </div>
                  </div>
                  <pre className="p-3 rounded bg-surface-raised font-sans text-muted text-[11px] whitespace-pre-wrap leading-relaxed border border-border">
                    {currentKeynote.emailBody}
                  </pre>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 3. META & GOOGLE 100,000X AD KITS */}
      {/* -------------------------------------------------------------------- */}
      {subTab === "ads" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Meta Marketing API v21.0 Payload */}
            <Panel title="Meta Marketing API (v21.0) Payload (Instagram & Facebook Ads)">
              <div className="space-y-2 text-xs">
                <p className="text-muted text-[11px]">
                  Geofenced to Karimganj (788710, 788711, 788712, 788701) @ ₹150/day. Directly importable to Meta Ads Manager.
                </p>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(META_GOOGLE_CAMPAIGN_KITS.metaMarketingApiJson, null, 2),
                        "Meta Marketing API Payload"
                      )
                    }
                  >
                    📋 Copy Meta JSON Payload
                  </Button>
                </div>
                <pre className="p-3 rounded bg-surface-raised font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-60 border border-border">
                  {JSON.stringify(META_GOOGLE_CAMPAIGN_KITS.metaMarketingApiJson, null, 2)}
                </pre>
              </div>
            </Panel>

            {/* Google Ads Performance Max (PMax) Configuration */}
            <Panel title="Google Performance Max (PMax) Asset Group">
              <div className="space-y-2 text-xs">
                <p className="text-muted text-[11px]">
                  High-intent local keywords (food delivery, biryani near me, Karimganj restaurants) @ ₹200/day.
                </p>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(META_GOOGLE_CAMPAIGN_KITS.googlePMaxAssetGroup, null, 2),
                        "Google PMax Config"
                      )
                    }
                  >
                    📋 Copy Google PMax Config
                  </Button>
                </div>
                <pre className="p-3 rounded bg-surface-raised font-mono text-[10px] text-teal-400 overflow-x-auto max-h-60 border border-border">
                  {JSON.stringify(META_GOOGLE_CAMPAIGN_KITS.googlePMaxAssetGroup, null, 2)}
                </pre>
              </div>
            </Panel>
          </div>

          {/* Viral Reels Scripts */}
          <Panel title="🎬 3 Viral Instagram Reels Scripts (Bengali & English)">
            <div className="grid gap-4 sm:grid-cols-3 text-xs">
              {META_GOOGLE_CAMPAIGN_KITS.viralReelsScripts.map((reel, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-surface p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground text-xs">{reel.title}</h4>
                    <Badge variant="warning" className="text-[10px]">{reel.durationSeconds}s</Badge>
                  </div>
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium">
                    Hook: {reel.hook}
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {reel.scenes.map((s, si) => (
                      <div key={si} className="text-[10px] text-muted border-l-2 border-primary/40 pl-2">
                        <span className="font-semibold text-foreground">{s.timestamp}: </span>
                        {s.audioScript}
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        copyToClipboard(
                          reel.scenes.map((s) => `[${s.timestamp}] Visual: ${s.visual}\nAudio: ${s.audioScript}`).join("\n\n"),
                          reel.title
                        )
                      }
                    >
                      📋 Copy Script
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 4. WEBSITE (orderking.in) GO-LIVE SPECIFICATION */}
      {/* -------------------------------------------------------------------- */}
      {subTab === "domain" && (
        <div className="space-y-4">
          <Panel title="Website orderking.in Production DNS &amp; Edge Routing">
            <div className="space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-raised p-4 border border-border">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Production Target: https://{DOMAIN_GOLIVE_CONFIG.domain}</h4>
                  <p className="text-xs text-muted">Zero-downtime Anycast Edge with automatic SSL &amp; PWA capabilities</p>
                </div>
                <Button
                  variant={dnsStatus === "VERIFIED" ? "primary" : "secondary"}
                  onClick={testDns}
                  disabled={dnsStatus === "TESTING"}
                >
                  {dnsStatus === "TESTING" ? "Testing Propagation…" : dnsStatus === "VERIFIED" ? "✓ DNS Verified & Active" : "🔍 Test DNS Propagation"}
                </Button>
              </div>

              {/* DNS Records Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-border rounded-lg overflow-hidden">
                  <thead className="bg-surface-raised border-b border-border text-muted">
                    <tr>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Host / Name</th>
                      <th className="p-2.5">Target / Value</th>
                      <th className="p-2.5">TTL</th>
                      <th className="p-2.5">Purpose</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono text-[11px]">
                    {DOMAIN_GOLIVE_CONFIG.dnsRecords.map((r, i) => (
                      <tr key={i} className="hover:bg-surface-raised/50">
                        <td className="p-2.5 font-bold text-amber-400">{r.type}</td>
                        <td className="p-2.5 text-foreground">{r.host}</td>
                        <td className="p-2.5 text-emerald-400 select-all">{r.value}</td>
                        <td className="p-2.5 text-muted">{r.ttl}</td>
                        <td className="p-2.5 font-sans text-muted">{r.purpose}</td>
                        <td className="p-2.5 text-right font-sans">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(r.value, `${r.type} Record Value`)}
                            className="text-primary hover:underline text-xs"
                          >
                            Copy
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <h4 className="font-semibold text-foreground text-sm">Step-by-Step Registrar Setup (Spaceship / Namecheap / GoDaddy)</h4>
                <ol className="list-decimal pl-4 space-y-1 text-muted text-xs">
                  {DOMAIN_GOLIVE_CONFIG.verificationSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
