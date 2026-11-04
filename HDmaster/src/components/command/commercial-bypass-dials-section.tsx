import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  SlidersHorizontal,
  Volume2,
  ShieldCheck,
  Building2,
  Plane,
  Train,
  PhoneCall,
  Navigation,
  Wrench,
  Share2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Radio,
  Layers,
  Lock,
  Scale,
  RefreshCw,
  Sliders,
  DollarSign,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatInr } from "@/lib/utils";
import {
  loadCommercialBypassDialsFn,
  updateCommercialBypassDialsFn,
  triggerSoundboxTestAlertFn,
} from "@/lib/orderking/actions";
import type { CommercialBypassDialsState } from "@/lib/orderking/server/commercial-dials.server";

export function CommercialBypassDialsSection() {
  const qc = useQueryClient();

  const bypassQ = useQuery({
    queryKey: ["commercial-bypass-dials"],
    queryFn: () => loadCommercialBypassDialsFn(),
  });

  const state: CommercialBypassDialsState | null =
    bypassQ.data && bypassQ.data.ok ? bypassQ.data.data : null;

  // Local draft states
  // 1. UPI & Soundbox
  const [primaryVpa, setPrimaryVpa] = useState<"orderking@ybl" | "9395065587@ybl" | "custom">("orderking@ybl");
  const [customVpa, setCustomVpa] = useState("");
  const [merchantDirectSettlement, setMerchantDirectSettlement] = useState(true);
  const [soundboxAlertsActive, setSoundboxAlertsActive] = useState(true);
  const [soundboxLanguage, setSoundboxLanguage] = useState<"BENGALI_SYLHETI" | "HINDI" | "ENGLISH">("BENGALI_SYLHETI");
  const [soundboxVolume, setSoundboxVolume] = useState(8);

  // 2. Section 9(5) Tax Dialects
  const [cgstSection9Enforced, setCgstSection9Enforced] = useState(true);
  const [interstateSupplyIgstMode, setInterstateSupplyIgstMode] = useState(true);
  const [section52TcsWithholdingActive, setSection52TcsWithholdingActive] = useState(true);
  const [section194OTdsWithholdingActive, setSection194OTdsWithholdingActive] = useState(true);
  const [statutoryInvoiceDialect, setStatutoryInvoiceDialect] = useState<"B2C_ECOM_CANONICAL" | "B2B_REVERSE_CHARGE">("B2C_ECOM_CANONICAL");

  // 3. Multi-brand Kitchen Controls
  const [virtualBrandClusteringEnabled, setVirtualBrandClusteringEnabled] = useState(true);
  const [maxVirtualBrandsPerKitchen, setMaxVirtualBrandsPerKitchen] = useState(5);
  const [sharedInventorySync, setSharedInventorySync] = useState(true);
  const [crossBrandOrderThrottling, setCrossBrandOrderThrottling] = useState(true);
  const [kitchenPrepDelayMultiplier, setKitchenPrepDelayMultiplier] = useState(1.0);

  // 4. Flight Convenience Fee Sliders
  const [flightConvenienceFeeDomesticInr, setFlightConvenienceFeeDomesticInr] = useState(499);
  const [flightConvenienceFeeInternationalInr, setFlightConvenienceFeeInternationalInr] = useState(1299);
  const [kingpayZeroFeeCheckoutActive, setKingpayZeroFeeCheckoutActive] = useState(true);

  // 5. Rail Quota & Tatkal Arbitrage
  const [tatkalServiceFeeInr, setTatkalServiceFeeInr] = useState(40);
  const [confirmationProbabilityThresholdPct, setConfirmationProbabilityThresholdPct] = useState(85);
  const [splitTicketingArbitrageEnabled, setSplitTicketingArbitrageEnabled] = useState(true);
  const [autoTatkalAlternativePrompt, setAutoTatkalAlternativePrompt] = useState(true);

  // 6. Telecom Fallback Switches
  const [primaryTelecomProvider, setPrimaryTelecomProvider] = useState<"FAST2SMS" | "WHATSAPP" | "TWILIO">("FAST2SMS");
  const [backupTelecomProvider, setBackupTelecomProvider] = useState<"WHATSAPP" | "FAST2SMS" | "TWILIO">("WHATSAPP");
  const [autoFailoverLatencyThresholdMs, setAutoFailoverLatencyThresholdMs] = useState(15000);
  const [whatsappOtpFallbackActive, setWhatsappOtpFallbackActive] = useState(true);
  const [regionalTelecomDialect, setRegionalTelecomDialect] = useState<"ASSAM_NORTHEAST_CIRCLE" | "NATIONAL_STANDARD">("ASSAM_NORTHEAST_CIRCLE");

  // 7. Proximity Dispatch Radius Controls
  const [dayShiftRadiusKm, setDayShiftRadiusKm] = useState(12.0);
  const [eveningShiftRadiusKm, setEveningShiftRadiusKm] = useState(7.5);
  const [lateNightShiftRadiusKm, setLateNightShiftRadiusKm] = useState(3.5);
  const [maxBatchCapacityPerRider, setMaxBatchCapacityPerRider] = useState(2);
  const [weatherSurgeDampenerMultiplier, setWeatherSurgeDampenerMultiplier] = useState(0.8);

  // 8. Garage Insurance Affiliate Markers
  const [rsaPartnerId, setRsaPartnerId] = useState("ACKO_FLEET_DIRECT");
  const [insuranceAffiliateCommissionBps, setInsuranceAffiliateCommissionBps] = useState(1500);
  const [mandatoryGigInsuranceCompliance, setMandatoryGigInsuranceCompliance] = useState(true);
  const [garageRoadsideAssistanceActive, setGarageRoadsideAssistanceActive] = useState(true);

  // 9. WhatsApp Viral Bounty Referral Dials
  const [customerReferralBountyInr, setCustomerReferralBountyInr] = useState(50);
  const [refereeFirstOrderDiscountInr, setRefereeFirstOrderDiscountInr] = useState(100);
  const [milestoneFiveFriendsBonusInr, setMilestoneFiveFriendsBonusInr] = useState(500);
  const [viralOneTapShareCampaignActive, setViralOneTapShareCampaignActive] = useState(true);
  const [viralShareTemplate, setViralShareTemplate] = useState(
    "OrderKing pe direct restaurant prices aur KingPay 0% fee ke saath khana mangao! Mera code use karo aur ₹100 pao."
  );

  const [isTestingSoundbox, setIsTestingSoundbox] = useState(false);

  useEffect(() => {
    if (state) {
      setPrimaryVpa(state.primaryVpa);
      setCustomVpa(state.customVpa || "");
      setMerchantDirectSettlement(state.merchantDirectSettlement);
      setSoundboxAlertsActive(state.soundboxAlertsActive);
      setSoundboxLanguage(state.soundboxLanguage);
      setSoundboxVolume(state.soundboxVolume);

      setCgstSection9Enforced(state.cgstSection9Enforced);
      setInterstateSupplyIgstMode(state.interstateSupplyIgstMode);
      setSection52TcsWithholdingActive(state.section52TcsWithholdingActive);
      setSection194OTdsWithholdingActive(state.section194OTdsWithholdingActive);
      setStatutoryInvoiceDialect(state.statutoryInvoiceDialect);

      setVirtualBrandClusteringEnabled(state.virtualBrandClusteringEnabled);
      setMaxVirtualBrandsPerKitchen(state.maxVirtualBrandsPerKitchen);
      setSharedInventorySync(state.sharedInventorySync);
      setCrossBrandOrderThrottling(state.crossBrandOrderThrottling);
      setKitchenPrepDelayMultiplier(state.kitchenPrepDelayMultiplier);

      setFlightConvenienceFeeDomesticInr(state.flightConvenienceFeeDomesticInr);
      setFlightConvenienceFeeInternationalInr(state.flightConvenienceFeeInternationalInr);
      setKingpayZeroFeeCheckoutActive(state.kingpayZeroFeeCheckoutActive);

      setTatkalServiceFeeInr(state.tatkalServiceFeeInr);
      setConfirmationProbabilityThresholdPct(state.confirmationProbabilityThresholdPct);
      setSplitTicketingArbitrageEnabled(state.splitTicketingArbitrageEnabled);
      setAutoTatkalAlternativePrompt(state.autoTatkalAlternativePrompt);

      setPrimaryTelecomProvider(state.primaryTelecomProvider);
      setBackupTelecomProvider(state.backupTelecomProvider);
      setAutoFailoverLatencyThresholdMs(state.autoFailoverLatencyThresholdMs);
      setWhatsappOtpFallbackActive(state.whatsappOtpFallbackActive);
      setRegionalTelecomDialect(state.regionalTelecomDialect);

      setDayShiftRadiusKm(state.dayShiftRadiusKm);
      setEveningShiftRadiusKm(state.eveningShiftRadiusKm);
      setLateNightShiftRadiusKm(state.lateNightShiftRadiusKm);
      setMaxBatchCapacityPerRider(state.maxBatchCapacityPerRider);
      setWeatherSurgeDampenerMultiplier(state.weatherSurgeDampenerMultiplier);

      setRsaPartnerId(state.rsaPartnerId);
      setInsuranceAffiliateCommissionBps(state.insuranceAffiliateCommissionBps);
      setMandatoryGigInsuranceCompliance(state.mandatoryGigInsuranceCompliance);
      setGarageRoadsideAssistanceActive(state.garageRoadsideAssistanceActive);

      setCustomerReferralBountyInr(state.customerReferralBountyInr);
      setRefereeFirstOrderDiscountInr(state.refereeFirstOrderDiscountInr);
      setMilestoneFiveFriendsBonusInr(state.milestoneFiveFriendsBonusInr);
      setViralOneTapShareCampaignActive(state.viralOneTapShareCampaignActive);
      setViralShareTemplate(state.viralShareTemplate);
    }
  }, [state]);

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<CommercialBypassDialsState>) =>
      updateCommercialBypassDialsFn({
        data: {
          patch,
          reason: "Founder Silent Bypass 10 Dial Synchronization",
        },
      }),
    onSuccess: (res) => {
      if (res && res.ok) {
        toast.success("Bypass Dial persisted to PostgreSQL & audited");
        void qc.invalidateQueries({ queryKey: ["commercial-bypass-dials"] });
      } else {
        toast.error((res as any)?.message || "Failed to update dial");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update bypass dial");
    },
  });

  const handleSoundboxTest = async () => {
    setIsTestingSoundbox(true);
    try {
      const res = await triggerSoundboxTestAlertFn({
        data: {
          amountInr: 500,
          language: soundboxLanguage,
          reason: "Founder Soundbox Audio Diagnostic Test",
        },
      });
      if (res && res.ok) {
        toast.success(`🔊 Soundbox Alert Triggered: "${res.message}"`);
        void qc.invalidateQueries({ queryKey: ["commercial-bypass-dials"] });
      } else {
        toast.error("Soundbox trigger failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Soundbox trigger error");
    } finally {
      setIsTestingSoundbox(false);
    }
  };

  const isSaving = updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Top Banner: Sovereign Commercial Bypass Dials */}
      <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-black to-zinc-950/60 p-5 shadow-[0_0_35px_rgba(245,158,11,0.12)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500 text-black font-black uppercase text-xs tracking-wider">
                SILENT BYPASS 10
              </Badge>
              <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-xs">
                GSTIN: 18AFXPH9838M1Z9
              </Badge>
              <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-mono text-xs">
                9 ACTIVE BYPASS CHANNELS
              </Badge>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <SlidersHorizontal className="size-5 text-amber-400" />
              Consolidated Commercial Bypass Master Dials
            </h2>
            <p className="text-xs text-muted max-w-2xl">
              Zero-aggregator sovereign dials: Direct NPCI UPI VPA routing, Section 9(5) CGST statutory dialects,
              multi-brand kitchen virtualization, dynamic OTA convenience fee ceilings (₹499/₹1,299), rail Tatkal arbitrage,
              telecom carrier failovers, proximity dispatch perimeters, fleet garage RSA markers, and viral bounty credits.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void qc.invalidateQueries({ queryKey: ["commercial-bypass-dials"] })}
              className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white text-xs h-9"
            >
              <RefreshCw className="size-3.5 mr-1.5" />
              Reload Dials
            </Button>
          </div>
        </div>
      </div>

      {/* 9 Master Dial Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* ================================================================= */}
        {/* DIAL 1: Direct UPI VPA Switcher & Soundbox Triggers */}
        {/* ================================================================= */}
        <div className="rounded-xl border border-amber-500/30 bg-zinc-950/80 p-4 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Radio className="size-4" />
                </div>
                <h3 className="font-bold text-sm text-white">1. Direct UPI & Soundbox</h3>
              </div>
              <Badge className="bg-emerald-950 border-emerald-500 text-emerald-300 text-[10px] font-mono">
                NPCI 0% MDR
              </Badge>
            </div>
            <p className="text-xs text-muted">
              Primary NPCI UPI VPA endpoint & multi-dialect voice audio alerts.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                  Active Direct VPA Endpoint:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setPrimaryVpa("orderking@ybl");
                      updateMutation.mutate({ primaryVpa: "orderking@ybl" });
                    }}
                    className={cn(
                      "text-[11px] font-mono p-2 rounded-lg border text-left transition-all",
                      primaryVpa === "orderking@ybl"
                        ? "border-amber-400 bg-amber-500/20 text-amber-300 font-bold"
                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                    )}
                  >
                    orderking@ybl
                  </button>
                  <button
                    onClick={() => {
                      setPrimaryVpa("9395065587@ybl");
                      updateMutation.mutate({ primaryVpa: "9395065587@ybl" });
                    }}
                    className={cn(
                      "text-[11px] font-mono p-2 rounded-lg border text-left transition-all",
                      primaryVpa === "9395065587@ybl"
                        ? "border-amber-400 bg-amber-500/20 text-amber-300 font-bold"
                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                    )}
                  >
                    9395065587@ybl
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800">
                <span className="text-zinc-300">Merchant Direct Settlement:</span>
                <button
                  onClick={() => {
                    const nextVal = !merchantDirectSettlement;
                    setMerchantDirectSettlement(nextVal);
                    updateMutation.mutate({ merchantDirectSettlement: nextVal });
                  }}
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border font-mono",
                    merchantDirectSettlement
                      ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                      : "bg-zinc-900 border-zinc-700 text-zinc-400"
                  )}
                >
                  {merchantDirectSettlement ? "DIRECT VPA" : "ESCROW POOL"}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">Soundbox Voice Language:</span>
                <select
                  value={soundboxLanguage}
                  onChange={(e) => {
                    const nextLang = e.target.value as any;
                    setSoundboxLanguage(nextLang);
                    updateMutation.mutate({ soundboxLanguage: nextLang });
                  }}
                  className="bg-zinc-900 border border-zinc-700 text-amber-300 text-xs rounded px-2 py-1"
                >
                  <option value="BENGALI_SYLHETI">Sylheti / Bengali</option>
                  <option value="HINDI">Hindi (National)</option>
                  <option value="ENGLISH">English</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Soundbox Volume:</span>
                  <span className="text-amber-400 font-mono font-bold">{soundboxVolume}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={soundboxVolume}
                  onChange={(e) => setSoundboxVolume(Number(e.target.value))}
                  onMouseUp={() => updateMutation.mutate({ soundboxVolume })}
                  className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          <Button
            size="sm"
            disabled={isTestingSoundbox}
            onClick={handleSoundboxTest}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs h-8 shadow-md"
          >
            <Volume2 className="size-3.5 mr-1.5" />
            1-Tap Soundbox Test Alert (₹500)
          </Button>
        </div>

        {/* ================================================================= */}
        {/* DIAL 2: Section 9(5) Tax Dialect Toggles */}
        {/* ================================================================= */}
        <div className="rounded-xl border border-emerald-500/30 bg-zinc-950/80 p-4 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Scale className="size-4" />
                </div>
                <h3 className="font-bold text-sm text-white">2. Section 9(5) Tax Engine</h3>
              </div>
              <Badge className="bg-emerald-950 border-emerald-500 text-emerald-300 text-[10px] font-mono">
                CGST ACT 2017
              </Badge>
            </div>
            <p className="text-xs text-muted">
              Statutory 5% GST without ITC on restaurant deliveries & 1% TCS/TDS withholding.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-black/40 border border-zinc-800">
                <span className="text-zinc-300">CGST Section 9(5) Platform Liability:</span>
                <button
                  onClick={() => {
                    const nextVal = !cgstSection9Enforced;
                    setCgstSection9Enforced(nextVal);
                    updateMutation.mutate({ cgstSection9Enforced: nextVal });
                  }}
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border font-mono",
                    cgstSection9Enforced
                      ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                      : "bg-rose-950 border-rose-500 text-rose-300"
                  )}
                >
                  {cgstSection9Enforced ? "5% NO-ITC ACTIVE" : "STANDARD GST"}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-black/40 border border-zinc-800">
                <span className="text-zinc-300">Interstate Supply IGST Dialect:</span>
                <button
                  onClick={() => {
                    const nextVal = !interstateSupplyIgstMode;
                    setInterstateSupplyIgstMode(nextVal);
                    updateMutation.mutate({ interstateSupplyIgstMode: nextVal });
                  }}
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border font-mono",
                    interstateSupplyIgstMode
                      ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                      : "bg-zinc-900 border-zinc-700 text-zinc-400"
                  )}
                >
                  {interstateSupplyIgstMode ? "5% IGST SPLIT" : "INTRA-STATE"}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-black/40 border border-zinc-800">
                <span className="text-zinc-300">Section 52 TCS (1%) & TDS (1%):</span>
                <button
                  onClick={() => {
                    const nextVal = !section52TcsWithholdingActive;
                    setSection52TcsWithholdingActive(nextVal);
                    setSection194OTdsWithholdingActive(nextVal);
                    updateMutation.mutate({
                      section52TcsWithholdingActive: nextVal,
                      section194OTdsWithholdingActive: nextVal,
                    });
                  }}
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border font-mono",
                    section52TcsWithholdingActive
                      ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                      : "bg-zinc-900 border-zinc-700 text-zinc-400"
                  )}
                >
                  {section52TcsWithholdingActive ? "2% TOTAL WITHHELD" : "EXEMPT"}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex justify-between">
            <span>Platform GSTIN:</span>
            <span className="text-amber-400 font-bold">18AFXPH9838M1Z9</span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* DIAL 3: Multi-Brand Virtual Kitchen Controls */}
        {/* ================================================================= */}
        <div className="rounded-xl border border-purple-500/30 bg-zinc-950/80 p-4 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <Building2 className="size-4" />
                </div>
                <h3 className="font-bold text-sm text-white">3. Multi-Brand Kitchens</h3>
              </div>
              <Badge className="bg-purple-950 border-purple-500 text-purple-300 text-[10px] font-mono">
                CLOUD KITCHEN
              </Badge>
            </div>
            <p className="text-xs text-muted">
              Virtual storefront clustering, unified inventory sync, and kitchen delay throttles.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">Brand Clustering Engine:</span>
                <button
                  onClick={() => {
                    const nextVal = !virtualBrandClusteringEnabled;
                    setVirtualBrandClusteringEnabled(nextVal);
                    updateMutation.mutate({ virtualBrandClusteringEnabled: nextVal });
                  }}
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border font-mono",
                    virtualBrandClusteringEnabled
                      ? "bg-purple-950 border-purple-500 text-purple-300"
                      : "bg-zinc-900 border-zinc-700 text-zinc-400"
                  )}
                >
                  {virtualBrandClusteringEnabled ? "ENABLED" : "DISABLED"}
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Max Virtual Brands per Kitchen:</span>
                  <span className="text-purple-400 font-mono font-bold">{maxVirtualBrandsPerKitchen} Brands</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={maxVirtualBrandsPerKitchen}
                  onChange={(e) => setMaxVirtualBrandsPerKitchen(Number(e.target.value))}
                  onMouseUp={() => updateMutation.mutate({ maxVirtualBrandsPerKitchen })}
                  className="w-full accent-purple-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Kitchen Prep Delay Multiplier:</span>
                  <span className="text-purple-400 font-mono font-bold">{kitchenPrepDelayMultiplier.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.0"
                  step="0.1"
                  value={kitchenPrepDelayMultiplier}
                  onChange={(e) => setKitchenPrepDelayMultiplier(Number(e.target.value))}
                  onMouseUp={() => updateMutation.mutate({ kitchenPrepDelayMultiplier })}
                  className="w-full accent-purple-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-zinc-300">Shared Inventory Auto-Sync:</span>
                <span className="text-emerald-400 font-mono text-[11px] font-bold">✓ ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 font-mono">
            Throttling: Cross-brand concurrency lock active
          </div>
        </div>

        {/* ================================================================= */}
        {/* DIAL 4: Flight Convenience Fee Sliders (₹499 / ₹1,299) */}
        {/* ================================================================= */}
        <div className="rounded-xl border border-sky-500/30 bg-zinc-950/80 p-4 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                  <Plane className="size-4" />
                </div>
                <h3 className="font-bold text-sm text-white">4. Flight Convenience Dials</h3>
              </div>
              <Badge className="bg-sky-950 border-sky-500 text-sky-300 text-[10px] font-mono">
                OTA MARGIN
              </Badge>
            </div>
            <p className="text-xs text-muted">
              Dynamic flight convenience fees: Domestic baseline ₹499 & International/Umrah ₹1,299.
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Domestic Flights Convenience Fee:</span>
                  <span className="text-sky-400 font-mono font-bold">₹{flightConvenienceFeeDomesticInr}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1500"
                  step="25"
                  value={flightConvenienceFeeDomesticInr}
                  onChange={(e) => setFlightConvenienceFeeDomesticInr(Number(e.target.value))}
                  onMouseUp={() => updateMutation.mutate({ flightConvenienceFeeDomesticInr })}
                  className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">International & Pilgrimage Flights:</span>
                  <span className="text-sky-400 font-mono font-bold">₹{flightConvenienceFeeInternationalInr}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3500"
                  step="50"
                  value={flightConvenienceFeeInternationalInr}
                  onChange={(e) => setFlightConvenienceFeeInternationalInr(Number(e.target.value))}
                  onMouseUp={() => updateMutation.mutate({ flightConvenienceFeeInternationalInr })}
                  className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800">
                <span className="text-zinc-300">KingPay 0% Gateway Surcharge:</span>
                <span className="text-emerald-400 font-mono text-[11px] font-bold">✓ 0% SURCHARGE</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex justify-between">
            <span>Mandate Alignment:</span>
            <span className="text-sky-300 font-bold">₹499 Dom / ₹1,299 Int</span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* DIAL 5: Rail Quota Arbitrage Thresholds */}
        {/* ================================================================= */}
        <div className="rounded-xl border border-rose-500/30 bg-zinc-950/80 p-4 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                  <Train className="size-4" />
                </div>
                <h3 className="font-bold text-sm text-white">5. Rail Quota Arbitrage</h3>
              </div>
              <Badge className="bg-rose-950 border-rose-500 text-rose-300 text-[10px] font-mono">
                IRCTC TATKAL
              </Badge>
            </div>
            <p className="text-xs text-muted">
              Tatkal / Premium Tatkal booking margin threshold and confirmation cut-offs.
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Tatkal Platform Service Fee:</span>
                  <span className="text-rose-400 font-mono font-bold">₹{tatkalServiceFeeInr}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  step="5"
                  value={tatkalServiceFeeInr}
                  onChange={(e) => setTatkalServiceFeeInr(Number(e.target.value))}
                  onMouseUp={() => updateMutation.mutate({ tatkalServiceFeeInr })}
                  className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Confirmation Cut-off Threshold:</span>
                  <span className="text-rose-400 font-mono font-bold">{confirmationProbabilityThresholdPct}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={confirmationProbabilityThresholdPct}
                  onChange={(e) => setConfirmationProbabilityThresholdPct(Number(e.target.value))}
                  onMouseUp={() => updateMutation.mutate({ confirmationProbabilityThresholdPct })}
                  className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800">
                <span className="text-zinc-300">Split-Ticketing Quota Search:</span>
                <button
                  onClick={() => {
                    const nextVal = !splitTicketingArbitrageEnabled;
                    setSplitTicketingArbitrageEnabled(nextVal);
                    updateMutation.mutate({ splitTicketingArbitrageEnabled: nextVal });
                  }}
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border font-mono",
                    splitTicketingArbitrageEnabled
                      ? "bg-rose-950 border-rose-500 text-rose-300"
                      : "bg-zinc-900 border-zinc-700 text-zinc-400"
                  )}
                >
                  {splitTicketingArbitrageEnabled ? "AUTO-ARBITRAGE" : "DIRECT ONLY"}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400">
            Tatkal cut-off: 85% probability trigger enabled
          </div>
        </div>

        {/* ================================================================= */}
        {/* DIAL 6: Telecom Fallback Priority Switches */}
        {/* ================================================================= */}
        <div className="rounded-xl border border-blue-500/30 bg-zinc-950/80 p-4 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <PhoneCall className="size-4" />
                </div>
                <h3 className="font-bold text-sm text-white">6. Telecom Priority Switches</h3>
              </div>
              <Badge className="bg-blue-950 border-blue-500 text-blue-300 text-[10px] font-mono">
                TELECOM ROUTING
              </Badge>
            </div>
            <p className="text-xs text-muted">
              Fast2SMS vs WhatsApp OTP carrier fallback & automated latency failovers.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">Primary SMS Gateway:</span>
                <select
                  value={primaryTelecomProvider}
                  onChange={(e) => {
                    const nextP = e.target.value as any;
                    setPrimaryTelecomProvider(nextP);
                    updateMutation.mutate({ primaryTelecomProvider: nextP });
                  }}
                  className="bg-zinc-900 border border-zinc-700 text-blue-300 text-xs rounded px-2 py-1 font-mono"
                >
                  <option value="FAST2SMS">Fast2SMS (Direct DLT)</option>
                  <option value="WHATSAPP">WhatsApp Business</option>
                  <option value="TWILIO">Twilio Global</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Failover Latency Cut-off:</span>
                  <span className="text-blue-400 font-mono font-bold">
                    {(autoFailoverLatencyThresholdMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="30000"
                  step="1000"
                  value={autoFailoverLatencyThresholdMs}
                  onChange={(e) => setAutoFailoverLatencyThresholdMs(Number(e.target.value))}
                  onMouseUp={() => updateMutation.mutate({ autoFailoverLatencyThresholdMs })}
                  className="w-full accent-blue-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800">
                <span className="text-zinc-300">WhatsApp 1-Tap OTP Fallback:</span>
                <button
                  onClick={() => {
                    const nextVal = !whatsappOtpFallbackActive;
                    setWhatsappOtpFallbackActive(nextVal);
                    updateMutation.mutate({ whatsappOtpFallbackActive: nextVal });
                  }}
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border font-mono",
                    whatsappOtpFallbackActive
                      ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                      : "bg-zinc-900 border-zinc-700 text-zinc-400"
                  )}
                >
                  {whatsappOtpFallbackActive ? "AUTOMATIC FAILOVER" : "MANUAL ONLY"}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400">
            Regional Circle: Assam / NE Telecom Circle Priority
          </div>
        </div>

        {/* ================================================================= */}
        {/* DIAL 7: Proximity Dispatch Radius Controls */}
        {/* ================================================================= */}
        <div className="rounded-xl border border-yellow-500/30 bg-zinc-950/80 p-4 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-400">
                  <Navigation className="size-4" />
                </div>
                <h3 className="font-bold text-sm text-white">7. Proximity Dispatch Radius</h3>
              </div>
              <Badge className="bg-yellow-950 border-yellow-500 text-yellow-300 text-[10px] font-mono">
                HAVERSINE AI
              </Badge>
            </div>
            <p className="text-xs text-muted">
              Shift-based dispatch radius boundaries (Day 12km, Evening 7.5km, Night 3.5km).
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Day Shift Radius (06:00-18:00):</span>
                  <span className="text-yellow-400 font-mono font-bold">{dayShiftRadiusKm.toFixed(1)} km</span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="20.0"
                  step="0.5"
                  value={dayShiftRadiusKm}
                  onChange={(e) => setDayShiftRadiusKm(Number(e.target.value))}
                  onMouseUp={() => updateMutation.mutate({ dayShiftRadiusKm })}
                  className="w-full accent-yellow-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Evening Shift Radius (18:00-23:00):</span>
                  <span className="text-yellow-400 font-mono font-bold">{eveningShiftRadiusKm.toFixed(1)} km</span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="15.0"
                  step="0.5"
                  value={eveningShiftRadiusKm}
                  onChange={(e) => setEveningShiftRadiusKm(Number(e.target.value))}
                  onMouseUp={() => updateMutation.mutate({ eveningShiftRadiusKm })}
                  className="w-full accent-yellow-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Late-Night Shift Radius (23:00-06:00):</span>
                  <span className="text-yellow-400 font-mono font-bold">{lateNightShiftRadiusKm.toFixed(1)} km</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={lateNightShiftRadiusKm}
                  onChange={(e) => setLateNightShiftRadiusKm(Number(e.target.value))}
                  onMouseUp={() => updateMutation.mutate({ lateNightShiftRadiusKm })}
                  className="w-full accent-yellow-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex justify-between">
            <span>Max Batch per Rider:</span>
            <span className="text-yellow-300 font-bold">{maxBatchCapacityPerRider} orders max</span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* DIAL 8: Garage Insurance Affiliate Markers */}
        {/* ================================================================= */}
        <div className="rounded-xl border border-emerald-500/30 bg-zinc-950/80 p-4 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Wrench className="size-4" />
                </div>
                <h3 className="font-bold text-sm text-white">8. Garage Insurance Markers</h3>
              </div>
              <Badge className="bg-emerald-950 border-emerald-500 text-emerald-300 text-[10px] font-mono">
                FLEET AFFILIATE
              </Badge>
            </div>
            <p className="text-xs text-muted">
              Rider 2-wheeler insurance affiliate tracking & 24/7 Roadside Assistance (RSA).
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">Underwriting Partner:</span>
                <select
                  value={rsaPartnerId}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setRsaPartnerId(nextVal);
                    updateMutation.mutate({ rsaPartnerId: nextVal });
                  }}
                  className="bg-zinc-900 border border-zinc-700 text-emerald-300 text-xs rounded px-2 py-1 font-mono"
                >
                  <option value="ACKO_FLEET_DIRECT">Acko Fleet Direct</option>
                  <option value="DIGIT_COMMERCIAL">Digit Commercial</option>
                  <option value="ICICI_LOMBARD">ICICI Lombard RSA</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Affiliate Commission Share:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {(insuranceAffiliateCommissionBps / 100).toFixed(1)}% ({insuranceAffiliateCommissionBps} bps)
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="100"
                  value={insuranceAffiliateCommissionBps}
                  onChange={(e) => setInsuranceAffiliateCommissionBps(Number(e.target.value))}
                  onMouseUp={() => updateMutation.mutate({ insuranceAffiliateCommissionBps })}
                  className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800">
                <span className="text-zinc-300">Code on Social Security 2020:</span>
                <span className="text-emerald-400 font-mono text-[11px] font-bold">✓ MANDATORY</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex justify-between">
            <span>24/7 Roadside Assistance:</span>
            <span className="text-emerald-400 font-bold">ACTIVE</span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* DIAL 9: WhatsApp Viral Bounty Credit Dials */}
        {/* ================================================================= */}
        <div className="rounded-xl border border-teal-500/30 bg-zinc-950/80 p-4 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
                  <Share2 className="size-4" />
                </div>
                <h3 className="font-bold text-sm text-white">9. WhatsApp Viral Bounty</h3>
              </div>
              <Badge className="bg-teal-950 border-teal-500 text-teal-300 text-[10px] font-mono">
                VIRAL LOOP
              </Badge>
            </div>
            <p className="text-xs text-muted">
              P2P referral bounty credit dials & WhatsApp 1-tap invitation campaigns.
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Referrer Reward Credit:</span>
                  <span className="text-teal-400 font-mono font-bold">₹{customerReferralBountyInr}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={customerReferralBountyInr}
                  onChange={(e) => setCustomerReferralBountyInr(Number(e.target.value))}
                  onMouseUp={() => updateMutation.mutate({ customerReferralBountyInr })}
                  className="w-full accent-teal-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Referee First-Order Discount:</span>
                  <span className="text-teal-400 font-mono font-bold">₹{refereeFirstOrderDiscountInr}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={refereeFirstOrderDiscountInr}
                  onChange={(e) => setRefereeFirstOrderDiscountInr(Number(e.target.value))}
                  onMouseUp={() => updateMutation.mutate({ refereeFirstOrderDiscountInr })}
                  className="w-full accent-teal-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">5-Friends Milestone Bonus:</span>
                  <span className="text-teal-400 font-mono font-bold">₹{milestoneFiveFriendsBonusInr}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={milestoneFiveFriendsBonusInr}
                  onChange={(e) => setMilestoneFiveFriendsBonusInr(Number(e.target.value))}
                  onMouseUp={() => updateMutation.mutate({ milestoneFiveFriendsBonusInr })}
                  className="w-full accent-teal-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex justify-between">
            <span>Viral Campaign Status:</span>
            <span className="text-teal-300 font-bold">1-TAP SHARE ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
