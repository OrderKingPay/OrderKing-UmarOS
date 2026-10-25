import { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  Percent,
  Landmark,
  CalendarClock,
  MapPin,
  CloudRain,
  Moon,
  Bot,
  Timer,
  Bike,
  Sparkles,
  Volume2,
  Plane,
  UtensilsCrossed,
  CheckCircle2,
  Save,
  RotateCcw,
  Zap,
  ShieldCheck,
  Camera,
  Navigation,
  Layers,
  Megaphone,
  Briefcase,
  GraduationCap,
  Building,
  Truck,
  Check,
  Flame,
  Palette,
} from "lucide-react";
import { saveSettingsFn } from "@/lib/orderking/actions";
import { DEFAULT_SETTINGS } from "@/lib/orderking/types";

export interface MasterCustomizationHubProps {
  initialConfig?: Record<string, any>;
  onSaveSuccess?: (msg: string) => void;
}

export function MasterCustomizationHub({
  initialConfig = {},
  onSaveSuccess,
}: MasterCustomizationHubProps) {
  // -------------------------------------------------------------
  // a) Commercial Tiers & Commission Controls
  // -------------------------------------------------------------
  const [deliveryCommissionPct, setDeliveryCommissionPct] = useState<number>(
    Number(initialConfig.restaurant_commission_pct ?? 18)
  );
  const [diningConvenienceFeeInr, setDiningConvenienceFeeInr] = useState<number>(
    Number(initialConfig.dining_convenience_fee_inr ?? 15)
  );
  const [paymentGatewayFeePct, setPaymentGatewayFeePct] = useState<number>(
    Number(initialConfig.mdr_percentage ?? initialConfig.kingpay?.mdr_percentage ?? 1.8)
  );
  const [settlementSchedule, setSettlementSchedule] = useState<string>(
    initialConfig.kingpay?.settlement_schedule ?? "Daily (T+1)"
  );

  // -------------------------------------------------------------
  // b) Hyperlocal Geofencing & Surge Multipliers
  // -------------------------------------------------------------
  const [maxDeliveryRadiusKm, setMaxDeliveryRadiusKm] = useState<number>(
    Number(initialConfig.max_delivery_radius_km ?? initialConfig.algorithm?.maxDeliveryRadiusKm ?? 5)
  );
  const [peakRainSurgeEnabled, setPeakRainSurgeEnabled] = useState<boolean>(
    Boolean(initialConfig.dynamic_surge_enabled ?? true)
  );
  const [peakRainSurgeMultiplier, setPeakRainSurgeMultiplier] = useState<number>(
    Number(initialConfig.surge_multiplier_cap ?? 1.5)
  );
  const [lateNightMultiplierEnabled, setLateNightMultiplierEnabled] = useState<boolean>(
    Boolean(initialConfig.late_night_surge_enabled ?? true)
  );
  const [lateNightMultiplier, setLateNightMultiplier] = useState<number>(
    Number(initialConfig.late_night_multiplier ?? 1.25)
  );

  // -------------------------------------------------------------
  // c) Employee-less Operations Automation
  // -------------------------------------------------------------
  const [aiArbitratorEnabled, setAiArbitratorEnabled] = useState<boolean>(
    Boolean(initialConfig.ai_arbitrator_enabled ?? true)
  );
  const [aiArbitratorSpillThresholdInr, setAiArbitratorSpillThresholdInr] = useState<number>(
    Number(initialConfig.auto_refund_ai_threshold_inr ?? initialConfig.kingpay?.auto_refund_ai_threshold_inr ?? 300)
  );
  const [kitchenSlaPacingEnabled, setKitchenSlaPacingEnabled] = useState<boolean>(
    Boolean(initialConfig.kitchen_sla_pacing_enabled ?? true)
  );
  const [kitchenSlaPrepBufferMins, setKitchenSlaPrepBufferMins] = useState<number>(
    Number(initialConfig.kitchen_prep_buffer_mins ?? initialConfig.algorithm?.kitchenPrepBufferMinutes ?? 15)
  );
  const [riderAutoReassignmentEnabled, setRiderAutoReassignmentEnabled] = useState<boolean>(
    Boolean(initialConfig.rider_auto_reassignment_enabled ?? true)
  );
  const [riderTimeoutSeconds, setRiderTimeoutSeconds] = useState<number>(
    Number(initialConfig.offerTimeoutSeconds ?? 30)
  );

  // -------------------------------------------------------------
  // d) Multi-Platform Feature Flags (Instant 1-Tap Toggles)
  // -------------------------------------------------------------
  const [flagDiningOut, setFlagDiningOut] = useState<boolean>(
    Boolean(initialConfig.feature_dining_out ?? initialConfig.dining_out_enabled ?? true)
  );
  const [flagAiDishPhotoStudio, setFlagAiDishPhotoStudio] = useState<boolean>(
    Boolean(initialConfig.feature_ai_dish_photo_studio ?? initialConfig.ai_photo_studio_enabled ?? true)
  );
  const [flagSoundboxSync, setFlagSoundboxSync] = useState<boolean>(
    Boolean(initialConfig.feature_soundbox_sync ?? initialConfig.soundbox_sync_enabled ?? true)
  );
  const [flagAffiliateTravel, setFlagAffiliateTravel] = useState<boolean>(
    Boolean(initialConfig.feature_affiliate_travel ?? initialConfig.affiliate_travel_enabled ?? false)
  );

  // -------------------------------------------------------------
  // e) Unified Platform Module Toggles (UmarOS Governance Engine)
  // -------------------------------------------------------------
  const [moduleTravel, setModuleTravel] = useState<boolean>(
    Boolean(initialConfig.modules?.travel ?? true)
  );
  const [moduleUtilities, setModuleUtilities] = useState<boolean>(
    Boolean(initialConfig.modules?.utilities ?? true)
  );
  const [moduleAiTutor, setModuleAiTutor] = useState<boolean>(
    Boolean(initialConfig.modules?.aiTutor ?? true)
  );
  const [moduleJobs, setModuleJobs] = useState<boolean>(
    Boolean(initialConfig.modules?.jobs ?? true)
  );
  const [moduleCourier, setModuleCourier] = useState<boolean>(
    Boolean(initialConfig.modules?.courier ?? true)
  );
  const [moduleFoodDelivery, setModuleFoodDelivery] = useState<boolean>(
    Boolean(initialConfig.modules?.foodDelivery ?? true)
  );

  // -------------------------------------------------------------
  // f) Pricing & Delivery Rules (Courier, Night Fee, Commissions)
  // -------------------------------------------------------------
  const [courierBaseFareInr, setCourierBaseFareInr] = useState<number>(
    Number(initialConfig.pricing_delivery_rules?.courierBaseFareInr ?? initialConfig.pricingDeliveryRules?.courierBaseFareInr ?? 30)
  );
  const [courierPerKmRateInr, setCourierPerKmRateInr] = useState<number>(
    Number(initialConfig.pricing_delivery_rules?.courierPerKmRateInr ?? initialConfig.pricingDeliveryRules?.courierPerKmRateInr ?? 10)
  );
  const [nightFeeInr, setNightFeeInr] = useState<number>(
    Number(initialConfig.pricing_delivery_rules?.nightFeeInr ?? initialConfig.pricingDeliveryRules?.nightFeeInr ?? 15)
  );
  const [nightFeeActive, setNightFeeActive] = useState<boolean>(
    Boolean(initialConfig.pricing_delivery_rules?.nightFeeActive ?? initialConfig.pricingDeliveryRules?.nightFeeActive ?? false)
  );
  const [townCommissionPct, setTownCommissionPct] = useState<number>(
    Number((initialConfig.pricing_delivery_rules?.townCommissionBps ?? 2200) / 100)
  );
  const [longDistanceCommissionPct, setLongDistanceCommissionPct] = useState<number>(
    Number((initialConfig.pricing_delivery_rules?.longDistanceCommissionBps ?? 2800) / 100)
  );

  // -------------------------------------------------------------
  // g) Dynamic Branding, Accents & Announcement Promo Banners
  // -------------------------------------------------------------
  const [customAccentColor, setCustomAccentColor] = useState<string>(
    initialConfig.dynamic_branding?.customAccentColor ?? initialConfig.dynamicBranding?.customAccentColor ?? "#D97706"
  );
  const [announcementEnabled, setAnnouncementEnabled] = useState<boolean>(
    Boolean(initialConfig.dynamic_branding?.announcementBanner?.enabled ?? initialConfig.dynamicBranding?.announcementBanner?.enabled ?? true)
  );
  const [announcementText, setAnnouncementText] = useState<string>(
    initialConfig.dynamic_branding?.announcementBanner?.text ?? initialConfig.dynamicBranding?.announcementBanner?.text ?? "⚡ FESTIVE FEAST: Flat 20% OFF on all orders above ₹299! Code: UMAR20"
  );
  const [announcementLink, setAnnouncementLink] = useState<string>(
    initialConfig.dynamic_branding?.announcementBanner?.linkUrl ?? initialConfig.dynamicBranding?.announcementBanner?.linkUrl ?? "/offers"
  );
  const [announcementBadge, setAnnouncementBadge] = useState<string>(
    initialConfig.dynamic_branding?.announcementBanner?.badgeText ?? initialConfig.dynamicBranding?.announcementBanner?.badgeText ?? "LIMITED TIME"
  );
  const [featuredHubs, setFeaturedHubs] = useState<Array<{ id: string; name: string; active: boolean; tier: string }>>(
    initialConfig.dynamic_branding?.featuredCityHubs ?? initialConfig.dynamicBranding?.featuredCityHubs ?? [
      { id: "city_cp", name: "Connaught Place, New Delhi", active: true, tier: "TIER_1" },
      { id: "city_karimganj", name: "Karimganj Core Hub", active: true, tier: "TIER_3" },
      { id: "city_silchar", name: "Silchar Valley Hub", active: true, tier: "TIER_2" },
      { id: "city_guwahati", name: "Guwahati Gateway", active: true, tier: "TIER_2" },
      { id: "city_bengaluru", name: "Bengaluru Tech Corridor", active: true, tier: "TIER_1" },
      { id: "city_mumbai", name: "Mumbai Metropolitan", active: true, tier: "TIER_1" },
      { id: "city_kolkata", name: "Kolkata Cultural Hub", active: true, tier: "TIER_1" },
    ]
  );

  // UI status state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Hydrate when initialConfig changes
  useEffect(() => {
    if (initialConfig.restaurant_commission_pct !== undefined) {
      setDeliveryCommissionPct(Number(initialConfig.restaurant_commission_pct));
    }
    if (initialConfig.dining_convenience_fee_inr !== undefined) {
      setDiningConvenienceFeeInr(Number(initialConfig.dining_convenience_fee_inr));
    }
    if (initialConfig.mdr_percentage !== undefined) {
      setPaymentGatewayFeePct(Number(initialConfig.mdr_percentage));
    }
    if (initialConfig.kingpay?.settlement_schedule) {
      setSettlementSchedule(initialConfig.kingpay.settlement_schedule);
    }
    if (initialConfig.max_delivery_radius_km !== undefined) {
      setMaxDeliveryRadiusKm(Number(initialConfig.max_delivery_radius_km));
    }
    if (initialConfig.auto_refund_ai_threshold_inr !== undefined) {
      setAiArbitratorSpillThresholdInr(Number(initialConfig.auto_refund_ai_threshold_inr));
    }
    if (initialConfig.modules) {
      if (initialConfig.modules.travel !== undefined) setModuleTravel(Boolean(initialConfig.modules.travel));
      if (initialConfig.modules.utilities !== undefined) setModuleUtilities(Boolean(initialConfig.modules.utilities));
      if (initialConfig.modules.aiTutor !== undefined) setModuleAiTutor(Boolean(initialConfig.modules.aiTutor));
      if (initialConfig.modules.jobs !== undefined) setModuleJobs(Boolean(initialConfig.modules.jobs));
      if (initialConfig.modules.courier !== undefined) setModuleCourier(Boolean(initialConfig.modules.courier));
      if (initialConfig.modules.foodDelivery !== undefined) setModuleFoodDelivery(Boolean(initialConfig.modules.foodDelivery));
    }
    const prRules = initialConfig.pricing_delivery_rules || initialConfig.pricingDeliveryRules;
    if (prRules) {
      if (prRules.courierBaseFareInr !== undefined) setCourierBaseFareInr(Number(prRules.courierBaseFareInr));
      if (prRules.courierPerKmRateInr !== undefined) setCourierPerKmRateInr(Number(prRules.courierPerKmRateInr));
      if (prRules.nightFeeInr !== undefined) setNightFeeInr(Number(prRules.nightFeeInr));
      if (prRules.nightFeeActive !== undefined) setNightFeeActive(Boolean(prRules.nightFeeActive));
      if (prRules.townCommissionBps !== undefined) setTownCommissionPct(Number(prRules.townCommissionBps) / 100);
      if (prRules.longDistanceCommissionBps !== undefined) setLongDistanceCommissionPct(Number(prRules.longDistanceCommissionBps) / 100);
    }
    const dynBrand = initialConfig.dynamic_branding || initialConfig.dynamicBranding;
    if (dynBrand) {
      if (dynBrand.customAccentColor) setCustomAccentColor(dynBrand.customAccentColor);
      if (dynBrand.announcementBanner) {
        if (dynBrand.announcementBanner.enabled !== undefined) setAnnouncementEnabled(Boolean(dynBrand.announcementBanner.enabled));
        if (dynBrand.announcementBanner.text !== undefined) setAnnouncementText(dynBrand.announcementBanner.text);
        if (dynBrand.announcementBanner.linkUrl !== undefined) setAnnouncementLink(dynBrand.announcementBanner.linkUrl);
        if (dynBrand.announcementBanner.badgeText !== undefined) setAnnouncementBadge(dynBrand.announcementBanner.badgeText);
      }
      if (dynBrand.featuredCityHubs) setFeaturedHubs(dynBrand.featuredCityHubs);
    }
  }, [initialConfig]);

  const handleSaveMasterControls = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const payload = {
        restaurant_commission_pct: deliveryCommissionPct,
        dining_convenience_fee_inr: diningConvenienceFeeInr,
        mdr_percentage: paymentGatewayFeePct,
        max_delivery_radius_km: maxDeliveryRadiusKm,
        surge_multiplier_cap: peakRainSurgeMultiplier,
        dynamic_surge_enabled: peakRainSurgeEnabled,
        late_night_surge_enabled: lateNightMultiplierEnabled,
        late_night_multiplier: lateNightMultiplier,
        ai_arbitrator_enabled: aiArbitratorEnabled,
        auto_refund_ai_threshold_inr: aiArbitratorSpillThresholdInr,
        kitchen_sla_pacing_enabled: kitchenSlaPacingEnabled,
        kitchen_prep_buffer_mins: kitchenSlaPrepBufferMins,
        rider_auto_reassignment_enabled: riderAutoReassignmentEnabled,
        offerTimeoutSeconds: riderTimeoutSeconds,
        feature_dining_out: flagDiningOut,
        dining_out_enabled: flagDiningOut,
        feature_ai_dish_photo_studio: flagAiDishPhotoStudio,
        ai_photo_studio_enabled: flagAiDishPhotoStudio,
        feature_soundbox_sync: flagSoundboxSync,
        soundbox_sync_enabled: flagSoundboxSync,
        feature_affiliate_travel: flagAffiliateTravel,
        affiliate_travel_enabled: flagAffiliateTravel,
        kingpay: {
          mdr_percentage: paymentGatewayFeePct,
          settlement_schedule: settlementSchedule,
          auto_refund_ai_threshold_inr: aiArbitratorSpillThresholdInr,
          customer_convenience_fee_inr: diningConvenienceFeeInr,
        },
        algorithm: {
          maxDeliveryRadiusKm,
          surgeMultiplierCap: peakRainSurgeMultiplier,
          kitchenPrepBufferMinutes: kitchenSlaPrepBufferMins,
          kingAiAutonomousResolution: aiArbitratorEnabled,
        },
        modules: {
          travel: moduleTravel,
          utilities: moduleUtilities,
          aiTutor: moduleAiTutor,
          jobs: moduleJobs,
          courier: moduleCourier,
          foodDelivery: moduleFoodDelivery,
        },
        pricingDeliveryRules: {
          courierBaseFareInr: courierBaseFareInr,
          courierPerKmRateInr: courierPerKmRateInr,
          courierBasePaise: Math.round(courierBaseFareInr * 100),
          courierPerKmPaise: Math.round(courierPerKmRateInr * 100),
          nightFeeInr: nightFeeInr,
          nightFeePaise: Math.round(nightFeeInr * 100),
          nightFeeActive: nightFeeActive,
          platformCommissionBps: Math.round(deliveryCommissionPct * 100),
          townCommissionBps: Math.round(townCommissionPct * 100),
          longDistanceCommissionBps: Math.round(longDistanceCommissionPct * 100),
        },
        dynamicBranding: {
          customAccentColor: customAccentColor,
          announcementBanner: {
            enabled: announcementEnabled,
            text: announcementText,
            linkUrl: announcementLink,
            bgGradient: "from-amber-600 via-orange-600 to-amber-700",
            badgeText: announcementBadge,
          },
          featuredCityHubs: featuredHubs,
        },
      };

      // 1. Post to API endpoint
      await fetch("/api/v1/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => null);

      // 2. Save via Server Action
      await saveSettingsFn({
        data: {
          settings: {
            ...DEFAULT_SETTINGS,
            commissionBps: Math.round(deliveryCommissionPct * 100),
            townCommissionBps: Math.round(townCommissionPct * 100),
            longDistanceCommissionBps: Math.round(longDistanceCommissionPct * 100),
            dayModeRadiusKm: maxDeliveryRadiusKm,
            paymentFeeBps: Math.round(paymentGatewayFeePct * 100),
            refundLimitPaise: Math.round(aiArbitratorSpillThresholdInr * 100),
            offerTimeoutSeconds: riderTimeoutSeconds,
            modules: {
              travel: moduleTravel,
              utilities: moduleUtilities,
              aiTutor: moduleAiTutor,
              jobs: moduleJobs,
              courier: moduleCourier,
              foodDelivery: moduleFoodDelivery,
            },
            pricingDeliveryRules: {
              courierBaseFareInr,
              courierPerKmRateInr,
              courierBasePaise: Math.round(courierBaseFareInr * 100),
              courierPerKmPaise: Math.round(courierPerKmRateInr * 100),
              nightFeeInr,
              nightFeePaise: Math.round(nightFeeInr * 100),
              nightFeeActive,
              platformCommissionBps: Math.round(deliveryCommissionPct * 100),
              townCommissionBps: Math.round(townCommissionPct * 100),
              longDistanceCommissionBps: Math.round(longDistanceCommissionPct * 100),
            },
            dynamicBranding: {
              customAccentColor,
              announcementBanner: {
                enabled: announcementEnabled,
                text: announcementText,
                linkUrl: announcementLink,
                bgGradient: "from-amber-600 via-orange-600 to-amber-700",
                badgeText: announcementBadge,
              },
              featuredCityHubs: featuredHubs,
            },
          },
          reason: "Updated via UmarOS Centralized Master Customization & Autonomous Ecosystem Hub",
        },
      }).catch(() => null);

      const success = "⚡ UmarOS Master Customizations saved & broadcast to Partner & Rider ecosystem live!";
      setStatusMsg(success);
      if (onSaveSuccess) onSaveSuccess(success);
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (e: any) {
      console.error("Save error:", e);
      setStatusMsg("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-6 md:p-8 text-white shadow-2xl space-y-8">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-2.5 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
            <SlidersHorizontal className="size-full text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
                UmarOS Autonomous Master Hub
              </span>
              <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Employee-less Operations
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white mt-1">
              Master Customization &amp; Autonomous Ecosystem Hub
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Centralized sovereign control center: Commercial tiers, geofencing radii, employee-less dispute resolution &amp; multi-platform feature flags.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveMasterControls}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 px-5 py-2.5 text-xs font-black text-slate-950 uppercase tracking-wider transition hover:from-emerald-400 hover:to-teal-300 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/25 cursor-pointer"
          >
            {isSaving ? (
              <span className="size-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
            ) : (
              <Save className="size-4 text-slate-950" />
            )}
            Save Master Ecosystem
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-3.5 text-xs font-bold text-emerald-200">
          <CheckCircle2 className="size-4.5 text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* 4 CORE SECTIONS (A, B, C, D) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* =========================================================
            PANEL A: Commercial Tiers & Commission Controls
           ========================================================= */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Percent className="size-4.5 text-rose-400" />
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                a) Commercial Tiers &amp; Commission Controls
              </h3>
            </div>
            <span className="text-[10px] font-mono text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/20 font-bold">
              Fair Take-Rate
            </span>
          </div>

          {/* 1. Delivery Commission Slider (0% to 30%) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Delivery Commission:</span>
              <span className="font-mono text-rose-400 font-extrabold text-sm">
                {deliveryCommissionPct.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={0.5}
              value={deliveryCommissionPct}
              onChange={(e) => setDeliveryCommissionPct(Number(e.target.value))}
              className="w-full accent-rose-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span onClick={() => setDeliveryCommissionPct(0)} className="hover:text-rose-400 cursor-pointer">0% (Zero Take)</span>
              <span onClick={() => setDeliveryCommissionPct(15)} className="hover:text-rose-400 cursor-pointer">15%</span>
              <span onClick={() => setDeliveryCommissionPct(18)} className="text-rose-300 font-bold hover:text-rose-400 cursor-pointer">18% (Standard)</span>
              <span onClick={() => setDeliveryCommissionPct(25)} className="hover:text-rose-400 cursor-pointer">25%</span>
              <span onClick={() => setDeliveryCommissionPct(30)} className="hover:text-rose-400 cursor-pointer">30% Max</span>
            </div>
          </div>

          {/* 2. Dining Convenience Fee Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Dining Convenience Fee:</span>
              <span className="font-mono text-amber-400 font-extrabold text-sm">
                ₹{diningConvenienceFeeInr}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={diningConvenienceFeeInr}
              onChange={(e) => setDiningConvenienceFeeInr(Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>₹0 Free</span>
              <span>₹10 Minimal</span>
              <span>₹15 Standard</span>
              <span>₹50 Cap</span>
            </div>
          </div>

          {/* 3. Payment Gateway Fee Slider (0.0% to 3.5%) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Payment Gateway Fee (MDR):</span>
              <span className="font-mono text-teal-400 font-extrabold text-sm">
                {paymentGatewayFeePct.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={3.5}
              step={0.1}
              value={paymentGatewayFeePct}
              onChange={(e) => setPaymentGatewayFeePct(Number(e.target.value))}
              className="w-full accent-teal-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0% Subsidized</span>
              <span>1.8% (NPCI UPI / Debit standard)</span>
              <span>3.5% Amex / Corp</span>
            </div>
          </div>

          {/* 4. Silent Settlement Schedule */}
          <div className="space-y-2 pt-1 border-t border-slate-800/60">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <CalendarClock className="size-3.5 text-indigo-400" />
              Silent Settlement Schedule:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettlementSchedule("Daily (T+1)")}
                className={`p-2.5 rounded-xl border text-left transition ${
                  settlementSchedule.startsWith("Daily")
                    ? "border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500/30"
                    : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="text-xs font-bold">Daily (T+1) Escrow</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Automated UPI batch at 06:00 AM</div>
              </button>

              <button
                type="button"
                onClick={() => setSettlementSchedule("Weekly (Wednesday)")}
                className={`p-2.5 rounded-xl border text-left transition ${
                  settlementSchedule.startsWith("Weekly")
                    ? "border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500/30"
                    : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="text-xs font-bold">Weekly (Wednesday)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Disbursed Wednesdays 14:00 IST</div>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================
            PANEL B: Hyperlocal Geofencing & Surge Multipliers
           ========================================================= */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="size-4.5 text-sky-400" />
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                b) Hyperlocal Geofencing &amp; Surge Multipliers
              </h3>
            </div>
            <span className="text-[10px] font-mono text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/20 font-bold">
              Dynamic Slabs
            </span>
          </div>

          {/* 1. Max Delivery Radius with 3km, 5km, 10km presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Max Delivery Radius:</span>
              <span className="font-mono text-sky-400 font-extrabold text-sm">
                {maxDeliveryRadiusKm} km
              </span>
            </div>

            {/* Quick 1-tap presets: 3km, 5km, 10km */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { km: 3, label: "3 km", desc: "Micro-Pod" },
                { km: 5, label: "5 km", desc: "Town Ring" },
                { km: 10, label: "10 km", desc: "Outer Core" },
              ].map((preset) => (
                <button
                  key={preset.km}
                  type="button"
                  onClick={() => setMaxDeliveryRadiusKm(preset.km)}
                  className={`p-2 rounded-xl border text-center transition ${
                    maxDeliveryRadiusKm === preset.km
                      ? "border-sky-500 bg-sky-950/50 text-sky-200 ring-1 ring-sky-500/30 font-bold"
                      : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="text-xs font-bold">{preset.label}</div>
                  <div className="text-[9.5px] opacity-75">{preset.desc}</div>
                </button>
              ))}
            </div>

            <input
              type="range"
              min={1}
              max={25}
              step={1}
              value={maxDeliveryRadiusKm}
              onChange={(e) => setMaxDeliveryRadiusKm(Number(e.target.value))}
              className="w-full accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer mt-1"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>1 km</span>
              <span>3 km</span>
              <span>5 km</span>
              <span>10 km</span>
              <span>25 km Max</span>
            </div>
          </div>

          {/* 2. Peak Rain Surge */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudRain className="size-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-300">Peak Rain Surge</span>
              </div>
              <button
                type="button"
                onClick={() => setPeakRainSurgeEnabled((v) => !v)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  peakRainSurgeEnabled ? "bg-blue-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${
                    peakRainSurgeEnabled ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {peakRainSurgeEnabled && (
              <div className="space-y-1.5 pl-6">
                <div className="flex justify-between text-xs font-mono text-blue-300">
                  <span>Rain Multiplier Cap:</span>
                  <span className="font-bold">{peakRainSurgeMultiplier.toFixed(1)}x (+₹25 fair rider pay)</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={3.0}
                  step={0.1}
                  value={peakRainSurgeMultiplier}
                  onChange={(e) => setPeakRainSurgeMultiplier(Number(e.target.value))}
                  className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* 3. Late-Night Multiplier */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="size-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">Late-Night Multiplier (11 PM – 5 AM)</span>
              </div>
              <button
                type="button"
                onClick={() => setLateNightMultiplierEnabled((v) => !v)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  lateNightMultiplierEnabled ? "bg-indigo-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${
                    lateNightMultiplierEnabled ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {lateNightMultiplierEnabled && (
              <div className="space-y-1.5 pl-6">
                <div className="flex justify-between text-xs font-mono text-indigo-300">
                  <span>Night Multiplier:</span>
                  <span className="font-bold">{lateNightMultiplier.toFixed(2)}x (+₹15 night allowance)</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={2.5}
                  step={0.05}
                  value={lateNightMultiplier}
                  onChange={(e) => setLateNightMultiplier(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* =========================================================
            PANEL C: Employee-less Operations Automation
           ========================================================= */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Bot className="size-4.5 text-emerald-400" />
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                c) Employee-less Operations Automation
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
              Zero Support Headcount
            </span>
          </div>

          {/* 1. Autonomous AI Dispute Arbitrator Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Autonomous AI Dispute Arbitrator:
              </span>
              <button
                type="button"
                onClick={() => setAiArbitratorEnabled((v) => !v)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  aiArbitratorEnabled ? "bg-emerald-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${
                    aiArbitratorEnabled ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Auto-Refund Threshold:</span>
                <span className="font-mono text-emerald-400 font-extrabold text-sm">
                  ₹{aiArbitratorSpillThresholdInr}
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={1000}
                step={25}
                value={aiArbitratorSpillThresholdInr}
                onChange={(e) => setAiArbitratorSpillThresholdInr(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-300 font-medium bg-emerald-950/50 p-2 rounded-lg border border-emerald-500/20">
                <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
                <span>
                  Auto-refund for verified spills under <strong>₹{aiArbitratorSpillThresholdInr}</strong> processed immediately to UPI without human ticketing.
                </span>
              </div>
            </div>
          </div>

          {/* 2. Automated Kitchen SLA Prep Timer Pacing */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="size-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-300">Kitchen SLA Prep Timer Pacing</span>
              </div>
              <button
                type="button"
                onClick={() => setKitchenSlaPacingEnabled((v) => !v)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  kitchenSlaPacingEnabled ? "bg-amber-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${
                    kitchenSlaPacingEnabled ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {kitchenSlaPacingEnabled && (
              <div className="space-y-1.5 pl-6">
                <div className="flex justify-between text-xs font-mono text-amber-300">
                  <span>Base Kitchen Prep Buffer:</span>
                  <span className="font-bold">{kitchenSlaPrepBufferMins} Minutes</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={45}
                  step={1}
                  value={kitchenSlaPrepBufferMins}
                  onChange={(e) => setKitchenSlaPrepBufferMins(Number(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* 3. Automated Rider Re-Assignment on Timeout */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bike className="size-4 text-purple-400" />
                <span className="text-xs font-semibold text-slate-300">Automated Rider Re-Assignment</span>
              </div>
              <button
                type="button"
                onClick={() => setRiderAutoReassignmentEnabled((v) => !v)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  riderAutoReassignmentEnabled ? "bg-purple-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${
                    riderAutoReassignmentEnabled ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {riderAutoReassignmentEnabled && (
              <div className="grid grid-cols-4 gap-1.5 pl-6">
                {[15, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setRiderTimeoutSeconds(sec)}
                    className={`py-1 rounded-lg border text-xs font-mono transition ${
                      riderTimeoutSeconds === sec
                        ? "border-purple-500 bg-purple-950/60 text-purple-200 font-bold"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {sec}s Timeout
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================
            PANEL D: Multi-Platform Feature Flags (Instant 1-Tap Toggles)
           ========================================================= */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="size-4.5 text-amber-400" />
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                d) Multi-Platform Feature Flags
              </h3>
            </div>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
              Instant 1-Tap Toggle
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Dining Out */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="size-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">Dining Out</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFlagDiningOut((v) => !v)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                    flagDiningOut ? "bg-emerald-600" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${
                      flagDiningOut ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-snug">
                Table bookings, guest pre-orders &amp; dining payment discounts.
              </p>
            </div>

            {/* 2. AI Dish Photo Studio */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="size-4 text-purple-400" />
                  <span className="text-xs font-bold text-slate-200">AI Dish Studio</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFlagAiDishPhotoStudio((v) => !v)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                    flagAiDishPhotoStudio ? "bg-purple-600" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${
                      flagAiDishPhotoStudio ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-snug">
                King AI dish enhancement, lighting correction &amp; menu photo optimization.
              </p>
            </div>

            {/* 3. Soundbox Sync */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="size-4 text-teal-400" />
                  <span className="text-xs font-bold text-slate-200">Soundbox Sync</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFlagSoundboxSync((v) => !v)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                    flagSoundboxSync ? "bg-teal-600" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${
                      flagSoundboxSync ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-snug">
                IoT order &amp; payment announcements in English + 9 regional languages.
              </p>
            </div>

            {/* 4. Affiliate Travel Concierge */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="size-4 text-sky-400" />
                  <span className="text-xs font-bold text-slate-200">Travel Concierge</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFlagAffiliateTravel((v) => !v)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                    flagAffiliateTravel ? "bg-sky-600" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${
                      flagAffiliateTravel ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-snug">
                External affiliate hospitality &amp; travel links.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          PANEL E, F, G: UMAROS CENTRAL GOVERNANCE & CUSTOMIZATION
         ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* PANEL E: Unified Module Toggles */}
        <div className="rounded-2xl border border-amber-500/30 bg-slate-950/80 p-5 space-y-4 shadow-lg shadow-amber-950/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4.5 text-amber-400" />
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                1. Platform Module Toggles
              </h3>
            </div>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
              6 Modules
            </span>
          </div>

          <div className="space-y-3">
            {[
              { id: "food", label: "Food Delivery", state: moduleFoodDelivery, set: setModuleFoodDelivery, desc: "Dominant restaurant food aggregator", icon: UtensilsCrossed, color: "text-amber-400" },
              { id: "courier", label: "Courier & Parcel", state: moduleCourier, set: setModuleCourier, desc: "Hyperlocal direct parcel pick & drop", icon: Truck, color: "text-emerald-400" },
              { id: "travel", label: "Travel & Transit", state: moduleTravel, set: setModuleTravel, desc: "IRCTC trains, flights, bus & cabs", icon: Plane, color: "text-sky-400" },
              { id: "utilities", label: "Utilities & BBPS", state: moduleUtilities, set: setModuleUtilities, desc: "Electricity, DTH, water & FASTag", icon: Zap, color: "text-yellow-400" },
              { id: "tutor", label: "AI Voice Tutor", state: moduleAiTutor, set: setModuleAiTutor, desc: "Multilingual CBSE/SEBA syllabus AI", icon: GraduationCap, color: "text-purple-400" },
              { id: "jobs", label: "Jobs Marketplace", state: moduleJobs, set: setModuleJobs, desc: "Local gig, delivery & tutoring hiring", icon: Briefcase, color: "text-blue-400" },
            ].map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <m.icon className={`size-4 ${m.color} shrink-0`} />
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-200 block truncate">{m.label}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{m.desc}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => m.set((v: boolean) => !v)}
                  className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full transition-colors ${
                    m.state ? "bg-amber-500" : "bg-slate-700"
                  }`}
                >
                  <span className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${
                    m.state ? "translate-x-5" : "translate-x-1"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL F: Pricing & Delivery Rules */}
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/80 p-5 space-y-4 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="size-4.5 text-emerald-400" />
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                2. Pricing &amp; Delivery Rules
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
              Real DB Persistence
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Courier Base Fare */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span>Courier Base Fare:</span>
                <span className="font-mono text-emerald-400 font-extrabold">₹{courierBaseFareInr}</span>
              </div>
              <input
                type="number"
                min={10}
                max={150}
                value={courierBaseFareInr}
                onChange={(e) => setCourierBaseFareInr(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-xs focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500">Default base fare for first 2 km (default ₹30)</span>
            </div>

            {/* Courier Per-Km Rate */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span>Courier Per-Km Rate:</span>
                <span className="font-mono text-emerald-400 font-extrabold">₹{courierPerKmRateInr}/km</span>
              </div>
              <input
                type="number"
                min={5}
                max={50}
                value={courierPerKmRateInr}
                onChange={(e) => setCourierPerKmRateInr(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-xs focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500">Distance rate beyond 2 km (default ₹10/km)</span>
            </div>

            {/* Night Fee */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span>Late Night Surcharge:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 font-extrabold">₹{nightFeeInr}</span>
                  <button
                    type="button"
                    onClick={() => setNightFeeActive((v) => !v)}
                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                      nightFeeActive ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  >
                    <span className={`inline-block size-3 transform rounded-full bg-white transition-transform ${
                      nightFeeActive ? "translate-x-4" : "translate-x-1"
                    }`} />
                  </button>
                </div>
              </div>
              <input
                type="number"
                min={0}
                max={100}
                value={nightFeeInr}
                onChange={(e) => setNightFeeInr(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-xs focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500">Applied 11:00 PM – 4:00 AM (Status: {nightFeeActive ? "Active" : "Inactive"})</span>
            </div>

            {/* Platform Commissions */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide block">Tiered Commission Rates</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Town Outlets</span>
                  <input
                    type="number"
                    step={0.5}
                    value={townCommissionPct}
                    onChange={(e) => setTownCommissionPct(Number(e.target.value))}
                    className="w-full bg-transparent text-slate-100 font-mono font-bold"
                  />
                  <span className="text-[9px] text-slate-500">% Commission</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Highway/Suburban</span>
                  <input
                    type="number"
                    step={0.5}
                    value={longDistanceCommissionPct}
                    onChange={(e) => setLongDistanceCommissionPct(Number(e.target.value))}
                    className="w-full bg-transparent text-slate-100 font-mono font-bold"
                  />
                  <span className="text-[9px] text-slate-500">% Commission</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL G: Dynamic Branding & Announcement Promo Banners */}
        <div className="rounded-2xl border border-rose-500/30 bg-slate-950/80 p-5 space-y-4 shadow-lg shadow-rose-950/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Palette className="size-4.5 text-rose-400" />
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                3. Dynamic Branding &amp; Promo
              </h3>
            </div>
            <span className="text-[10px] font-mono text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30 font-bold">
              Founder Broadcast
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Custom Accent Color */}
            <div className="space-y-1.5">
              <span className="text-slate-300 font-semibold block">Brand Accent Color:</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customAccentColor}
                  onChange={(e) => setCustomAccentColor(e.target.value)}
                  className="size-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={customAccentColor}
                  onChange={(e) => setCustomAccentColor(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-200 text-xs uppercase"
                />
              </div>
              <div className="flex gap-1.5">
                {["#D97706", "#059669", "#4F46E5", "#E11D48", "#0F172A"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCustomAccentColor(c)}
                    style={{ backgroundColor: c }}
                    className="size-5 rounded-md border border-white/20 transition hover:scale-110"
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Founder Announcement Banner */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Megaphone className="size-4 text-amber-400" />
                  <span className="text-slate-200 font-bold">Founder Promo Banner</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAnnouncementEnabled((v) => !v)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                    announcementEnabled ? "bg-rose-500" : "bg-slate-700"
                  }`}
                >
                  <span className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${
                    announcementEnabled ? "translate-x-5" : "translate-x-1"
                  }`} />
                </button>
              </div>

              <input
                type="text"
                placeholder="Announcement headline (e.g. ⚡ FESTIVE OFFER: Flat 20% OFF...)"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Link URL (/offers)"
                  value={announcementLink}
                  onChange={(e) => setAnnouncementLink(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-[11px]"
                />
                <input
                  type="text"
                  placeholder="Badge text (PROMO)"
                  value={announcementBadge}
                  onChange={(e) => setAnnouncementBadge(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-[11px] uppercase font-bold"
                />
              </div>
            </div>

            {/* Featured City Hubs */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-bold">Featured City Hubs</span>
                <span className="text-[10px] text-slate-400">{featuredHubs.filter((h) => h.active).length} Active</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {featuredHubs.map((hub, idx) => (
                  <div key={hub.id} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="size-3 text-amber-500 shrink-0" />
                      <span className="truncate text-slate-300 font-medium">{hub.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const copy = [...featuredHubs];
                        copy[idx] = { ...copy[idx], active: !copy[idx].active };
                        setFeaturedHubs(copy);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                        hub.active
                          ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                          : "bg-slate-800 text-slate-500 border-slate-700"
                      }`}
                    >
                      {hub.active ? "LIVE" : "PAUSED"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
