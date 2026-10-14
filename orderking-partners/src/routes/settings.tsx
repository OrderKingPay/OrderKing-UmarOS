import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { useClientState } from "@/lib/client-state";
import {
  addStaff,
  listStaff,
  getKingAiNotificationConfig,
  updateKingAiNotificationConfig,
  sendKingAiTestNotification,
  type KingAiNotificationSettings,
} from "@/lib/server/api-more";
import { getRestaurant, updateRestaurantProfile } from "@/lib/server/api-bootstrap";
import { quickThrottleKitchen } from "@/lib/server/api-orders";
import { can } from "@/lib/rbac";
import {
  formatINR,
  rupeesToPaise,
  computeRestaurantPayable,
  DELIVERY_COMMISSION_TIER_LIST,
  DELIVERY_COMMISSION_TIERS,
} from "@/lib/money";
import { platformConfig } from "@/lib/platform-config";
import { INDIAN_LANGUAGE_CATALOG } from "@/lib/i18n";
import { UniversalPosHardwareManager } from "@/components/universal-pos-hardware";
import { KitchenKdsOperationsPanel } from "@/components/settings/kitchen-kds-operations-panel";
import { CatalogueStockControlsPanel } from "@/components/settings/catalogue-stock-controls-panel";
import { ThermalPrinterHardwarePanel } from "@/components/settings/thermal-printer-hardware-panel";
import { KingpaySoundboxSettingsPanel } from "@/components/settings/kingpay-soundbox-settings-panel";
import {
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  FileText,
  Globe,
  Mail,
  MessageSquare,
  Percent,
  RefreshCw,
  Scale,
  Send,
  ShieldCheck,
  Sliders,
  Store,
  TrendingUp,
  Users,
  Volume2,
  VolumeX,
  Wrench,
} from "lucide-react";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

export const ALL_INDIAN_LANGUAGES = INDIAN_LANGUAGE_CATALOG;

const LEGAL_SECTIONS = [
  {
    id: "commercial-terms",
    title: "1. Restaurant Partner Terms & Commercial Agreement",
    badge: "Indian Contract Act, 1872",
    body: [
      "Electronic Execution & Intermediary Role: OrderKing operates as an electronic marketplace intermediary under Section 79 of the Information Technology Act, 2000. The Restaurant Partner remains the principal seller and manufacturer/packer of all food and beverage items listed on its digital storefront.",
      "Order Acceptance & Preparation SLA: Upon receiving a customer order, the Restaurant Partner agrees to acknowledge acceptance within the configured SLA window and prepare items within the published preparation time (Standard 20m or Rush 35m).",
      "Menu Pricing Parity & Packaging Charges: Menu prices and item-level packaging fees are configured directly by the Restaurant Partner in integer paise. Unexplained surcharges or off-ledger fees are strictly prohibited.",
      "Refund Attribution: Customer refunds triggered by missing items, spilled packaging due to faulty sealing, or foreign objects in food are attributed to the Restaurant Partner ledger with an explicit audit reason code. Rider transit delays or delivery mishaps are borne by the logistics network.",
    ],
  },
  {
    id: "privacy-dpdp",
    title: "2. Merchant Privacy Policy & Data Protection Notice (DPDP Act 2023)",
    badge: "DPDP Act, 2023",
    body: [
      "Lawful Purpose Limitation: In accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act), OrderKing collects merchant KYC records (PAN, GSTIN, FSSAI license, bank account & IFSC, authorized signatory contact details) strictly for statutory tax reporting, food safety verification, and NEFT/IMPS settlement disbursement.",
      "Customer Personal Data Protection: Customer names, delivery instructions, and masked contact numbers shared on Kitchen Order Tickets (KOT) are provided solely for order preparation and statutory invoice generation. Retaining customer phone numbers for external promotional SMS/WhatsApp campaigns is a material breach of the DPDP Act, 2023.",
      "Security & Audit Retention: Financial ledgers, settlement batches, and tax invoices are retained for 8 financial years as mandated under the Income Tax Act, 1961 and CGST Act, 2017.",
    ],
  },
  {
    id: "fssai-undertaking",
    title: "3. FSSAI Hygiene, Allergen & Food Safety Undertaking",
    badge: "FSSAI Act, 2006",
    body: [
      "Mandatory 14-Digit FoSCoS Licensing: The Restaurant Partner warrants that it holds a valid, unexpired 14-digit FSSAI License or Registration Certificate displayed prominently on its storefront and printed on customer KOT receipts.",
      "Vegetarian & Non-Vegetarian Segregation: Kitchens must maintain strict physical separation of vegetarian and non-vegetarian utensils, prep surfaces, and storage, and accurately tag every dish with the statutory Green (Veg) or Brown/Red (Non-Veg) symbol.",
      "Tamper-Evident Food-Grade Packaging: All delivery orders must be sealed in food-grade, tamper-evident containers prior to handover to the delivery partner, displaying preparation timestamps and allergen advisories (nuts, dairy, gluten, soy, shellfish).",
    ],
  },
  {
    id: "tax-settlement-policy",
    title: "4. Statutory Tax & Settlement Policy (CGST Sec 9(5), TCS Sec 52, TDS Sec 194-O)",
    badge: "CGST & IT Act",
    body: [
      "Integer-Paise Settlement Formula: Net Restaurant Payable = (Food Value + Packaging Charges − Restaurant Discount) − Platform Commission + Platform-Funded Promo − Refund Adjustments.",
      "GST on Restaurant Services (Section 9(5) CGST Act, 2017): For notified restaurant services supplied through an e-commerce operator, 5% GST is collected from the customer and remitted directly to the Government by the platform under Section 9(5).",
      "Tax Collected at Source (Section 52 CGST Act): Where applicable on net taxable supplies, 1% TCS (0.5% CGST + 0.5% SGST or 1% IGST) is deposited and reflected in your GSTR-8 credit ledger.",
      "Tax Deducted at Source (Section 194-O Income Tax Act, 1961): Statutory TDS of 1% is deducted on gross sales facilitated through the digital platform and deposited against your registered PAN, with quarterly Form 16A certificates issued.",
    ],
  },
  {
    id: "grievance-redressal",
    title: "5. Grievance Redressal Officer & Partner Support Escalation",
    badge: "IT Rules, 2021",
    body: [
      `Nodal Merchant Grievance Officer: Designated pursuant to the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.`,
      `Official Escalation Email: ${platformConfig.support.email} (Include your Restaurant ID, Order Number, or Settlement Batch ID for priority tracking).`,
      "Resolution SLA: All commercial, settlement, or menu compliance grievances are acknowledged within 24 hours and resolved within 15 calendar days of receipt.",
    ],
  },
] as const;

function SettingsPage() {
  const t = useT();
  const vendor = useVendor();
  const qc = useQueryClient();
  const lang = useClientState((s) => s.lang);
  const setLang = useClientState((s) => s.setLang);
  const soundOn = useClientState((s) => s.soundOn);
  const setSoundOn = useClientState((s) => s.setSoundOn);

  const restQ = useQuery({
    queryKey: ["restaurant", vendor.restaurantId],
    queryFn: () => getRestaurant({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const staffQ = useQuery({
    queryKey: ["staff", vendor.restaurantId],
    queryFn: () => listStaff({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId) && Boolean(vendor.role && can(vendor.role, "settings.staff")),
  });

  const setRestaurantId = useClientState((s) => s.setRestaurantId);
  const memberships = vendor.memberships;

  const notifQ = useQuery({
    queryKey: ["kingai-notif-config", vendor.restaurantId],
    queryFn: () => getKingAiNotificationConfig({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STAFF");
  const [msg, setMsg] = useState<string | null>(null);
  const [openPolicyId, setOpenPolicyId] = useState<string | null>("commercial-terms");

  const [diagMsg, setDiagMsg] = useState<string | null>(null);

  // King AI Communications Engine State
  const [waEnabled, setWaEnabled] = useState<boolean | null>(null);
  const [waConsent, setWaConsent] = useState<boolean | null>(null);
  const [waPhone, setWaPhone] = useState<string | null>(null);

  const [smsEnabled, setSmsEnabled] = useState<boolean | null>(null);
  const [smsConsent, setSmsConsent] = useState<boolean | null>(null);
  const [smsPhone, setSmsPhone] = useState<string | null>(null);

  const [emailEnabled, setEmailEnabled] = useState<boolean | null>(null);
  const [emailConsent, setEmailConsent] = useState<boolean | null>(null);
  const [emailAddress, setEmailAddress] = useState<string | null>(null);

  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState<string | null>(null);
  const [testDispatchMsg, setTestDispatchMsg] = useState<{ channel: string; text: string } | null>(null);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [outletSwitchMsg, setOutletSwitchMsg] = useState<string | null>(null);
  const r = restQ.data?.restaurant;

  // Commercial Commission Schedule & Negotiation State
  const contractedBps = r?.commission_bps ?? vendor.selected?.commissionBps ?? platformConfig.commission.targetBps;
  const [negotiatedBps, setNegotiatedBps] = useState<number | null>(null);
  const [previewBasketInr, setPreviewBasketInr] = useState<number>(500);
  const [commissionSaving, setCommissionSaving] = useState(false);
  const [commissionMsg, setCommissionMsg] = useState<string | null>(null);

  const effectiveBps = negotiatedBps !== null ? negotiatedBps : contractedBps;
  const isAuthorizedToNegotiate =
    vendor.role === "OWNER" ||
    vendor.role === "MANAGER" ||
    vendor.role === "MULTI_OUTLET_MANAGER" ||
    Boolean(vendor.role && can(vendor.role, "settings.financial"));

  async function handleSaveNegotiatedCommission() {
    if (!vendor.restaurantId) return;
    setCommissionSaving(true);
    setCommissionMsg(null);
    try {
      await updateRestaurantProfile({
        data: {
          restaurantId: vendor.restaurantId,
          commissionBps: effectiveBps,
        },
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["restaurant"] }),
        qc.invalidateQueries({ queryKey: ["vendor"] }),
      ]);
      setCommissionMsg(`Commercial delivery commission negotiated at ${(effectiveBps / 100).toFixed(1)}% (${effectiveBps} bps) successfully saved.`);
    } catch (err) {
      setCommissionMsg(err instanceof Error ? err.message : "Failed to update commission rate");
    } finally {
      setCommissionSaving(false);
    }
  }

  // Live itemized integer-paise calculation preview
  const previewGrossFoodPaise = rupeesToPaise(Math.max(1, previewBasketInr));
  const previewBreakdown = computeRestaurantPayable({
    foodValuePaise: previewGrossFoodPaise,
    packingPaise: 0,
    restaurantDiscountPaise: 0,
    platformFundedDiscountPaise: 0,
    commissionBps: effectiveBps,
  });

  const cfg = notifQ.data?.config;
  const currentWaEnabled = waEnabled ?? cfg?.whatsappShiftReport.enabled ?? true;
  const currentWaConsent = waConsent ?? cfg?.whatsappShiftReport.consent ?? true;
  const currentWaPhone = waPhone !== null ? waPhone : (cfg?.whatsappShiftReport.destinationPhone || r?.phone || "");

  const currentSmsEnabled = smsEnabled ?? cfg?.smsKitchenEmergency.enabled ?? true;
  const currentSmsConsent = smsConsent ?? cfg?.smsKitchenEmergency.consent ?? true;
  const currentSmsPhone = smsPhone !== null ? smsPhone : (cfg?.smsKitchenEmergency.destinationPhone || r?.phone || "");

  const currentEmailEnabled = emailEnabled ?? cfg?.emailTaxDocuments.enabled ?? true;
  const currentEmailConsent = emailConsent ?? cfg?.emailTaxDocuments.consent ?? true;
  const currentEmailAddress = emailAddress !== null ? emailAddress : (cfg?.emailTaxDocuments.destinationEmail || r?.email || "");

  async function handleSaveKingAiNotifications() {
    if (!vendor.restaurantId) return;
    setNotifSaving(true);
    setNotifMsg(null);
    try {
      const payload: KingAiNotificationSettings = {
        whatsappShiftReport: {
          enabled: currentWaEnabled,
          consent: currentWaConsent,
          destinationPhone: currentWaPhone.trim(),
          dailyPl: true,
          gst95Remitted: true,
          netPayout: true,
          orderCount: true,
        },
        smsKitchenEmergency: {
          enabled: currentSmsEnabled,
          consent: currentSmsConsent,
          destinationPhone: currentSmsPhone.trim(),
          throttleAlert: true,
          criticalStockout: true,
        },
        emailTaxDocuments: {
          enabled: currentEmailEnabled,
          consent: currentEmailConsent,
          destinationEmail: currentEmailAddress.trim(),
          taxInvoices: true,
          form16AStatements: true,
        },
      };

      await updateKingAiNotificationConfig({
        data: {
          restaurantId: vendor.restaurantId,
          config: payload,
        },
      });
      await qc.invalidateQueries({ queryKey: ["kingai-notif-config", vendor.restaurantId] });
      setNotifMsg("King AI notification channels and statutory consent preferences saved successfully.");
    } catch (err) {
      setNotifMsg(err instanceof Error ? err.message : "Failed to save notification preferences");
    } finally {
      setNotifSaving(false);
    }
  }

  async function handleTestNotification(channel: "whatsapp" | "sms" | "email") {
    if (!vendor.restaurantId) return;
    setTestingChannel(channel);
    setTestDispatchMsg(null);
    try {
      const dest =
        channel === "whatsapp"
          ? currentWaPhone
          : channel === "sms"
            ? currentSmsPhone
            : currentEmailAddress;
      if (!dest.trim()) {
        throw new Error(`Please provide a destination ${channel === "email" ? "email" : "phone number"} first.`);
      }
      const res = await sendKingAiTestNotification({
        data: {
          restaurantId: vendor.restaurantId,
          channel,
          destination: dest.trim(),
        },
      });
      setTestDispatchMsg({
        channel,
        text: res.message,
      });
      await qc.invalidateQueries({ queryKey: ["ntf"] });
    } catch (err) {
      setTestDispatchMsg({
        channel,
        text: err instanceof Error ? err.message : `Failed to dispatch ${channel} test alert`,
      });
    } finally {
      setTestingChannel(null);
    }
  }

  function handleSwitchOutlet(targetRestaurantId: string, name: string) {
    if (targetRestaurantId === vendor.restaurantId) return;
    setRestaurantId(targetRestaurantId);
    void qc.invalidateQueries();
    setOutletSwitchMsg(`Active branch profile instantly switched to: ${name} (${targetRestaurantId}).`);
  }


  async function handleSelfHealOutlet() {
    if (!vendor.restaurantId) return;
    setDiagMsg(null);
    try {
      await quickThrottleKitchen({ data: { restaurantId: vendor.restaurantId, mode: "RESUME" } });
      await quickThrottleKitchen({ data: { restaurantId: vendor.restaurantId, mode: "NORMAL" } });
      setSoundOn(true);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["restaurant"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      setDiagMsg(
        "Self-healing complete: Emergency closure cleared, prep SLA normalized to 20m, and kitchen audio siren enabled.",
      );
    } catch (err) {
      setDiagMsg(err instanceof Error ? err.message : "Self-service recovery failed");
    }
  }

  const fssaiReady = Boolean(r?.fssai_number && String(r.fssai_number).length === 14);
  const bankReady = Boolean(r?.bank_account && r?.bank_ifsc);
  const panReady = Boolean(r?.pan && String(r.pan).length === 10);

  return (
    <VendorShell
      title={t("nav.settings")}
      dataLabel={vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="space-y-4">
        {/* Thermal POS Printer & Hardware Customization Panel */}
        <ThermalPrinterHardwarePanel
          restaurantId={vendor.restaurantId}
          restaurantName={vendor.selected?.restaurantName}
        />

        {/* Universal POS & Thermal Printer Hardware Manager */}
        <UniversalPosHardwareManager
          restaurantId={vendor.restaurantId}
          restaurantName={vendor.selected?.restaurantName}
        />

        {/* King AI Multi-Outlet Profile Router & Instant Branch Switcher */}
        <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Building2 className="size-5 text-emerald-400" />
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  King AI Multi-Outlet Profile Router &amp; Instant Branch Switcher
                </h2>
                <p className="text-xs text-slate-400">
                  Instant profile routing between authorized restaurant locations across India without re-authenticating.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded">
                {memberships.length} AUTHORIZED {memberships.length === 1 ? "BRANCH" : "BRANCHES"}
              </span>
            </div>
          </div>

          {outletSwitchMsg ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              <span>{outletSwitchMsg}</span>
            </div>
          ) : null}

          {/* Quick Select Router Bar */}
          {memberships.length > 1 ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2">
                <Store className="size-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">Quick Profile Switcher:</span>
              </div>
              <select
                className="h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-emerald-300 outline-none focus:border-emerald-500"
                value={vendor.restaurantId ?? ""}
                onChange={(e) => {
                  const m = memberships.find((x) => x.restaurantId === e.target.value);
                  if (m) handleSwitchOutlet(m.restaurantId, m.restaurantName);
                }}
              >
                {memberships.map((m) => (
                  <option key={m.restaurantId} value={m.restaurantId}>
                    {m.restaurantName} ({m.role}) — {m.restaurantId}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Detailed Branch Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {memberships.map((m) => {
              const isActive = m.restaurantId === vendor.restaurantId;
              return (
                <div
                  key={m.restaurantId}
                  className={`rounded-xl border p-4 space-y-3 transition ${
                    isActive
                      ? "border-emerald-500/50 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <Store className="size-4 text-slate-400" />
                        <span>{m.restaurantName}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        ID: {m.restaurantId}
                        {m.outletId ? ` · Outlet: ${m.outletId}` : ""}
                      </div>
                    </div>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        <CheckCircle2 className="size-3" /> ACTIVE
                      </span>
                    ) : (
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                        {m.role}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-800/80 pt-2">
                    <div>
                      <span className="text-slate-400">Role: </span>
                      <span className="font-mono text-slate-200">{m.role}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Status: </span>
                      <span className="font-mono text-emerald-400">{m.verificationStatus}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Fee Rate: </span>
                      <span className="font-mono text-slate-200">{m.commissionBps / 100}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Ledger: </span>
                      <span className="font-mono text-emerald-400">{m.dataLabel}</span>
                    </div>
                  </div>

                  {!isActive ? (
                    <Button
                      size="sm"
                      onClick={() => handleSwitchOutlet(m.restaurantId, m.restaurantName)}
                      className="w-full h-8 text-xs bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 transition"
                    >
                      <ArrowRightLeft className="mr-1.5 size-3.5" />
                      Switch to This Branch
                    </Button>
                  ) : (
                    <div className="text-[11px] text-center font-medium text-emerald-400 py-1 bg-emerald-500/10 rounded-lg">
                      Currently Operating This Branch
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* OMR OS Autonomous Ecosystem & Self-Healing Diagnostics */}
        {vendor.restaurantId ? (
          <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Cpu className="size-5 text-emerald-400" />
                <div>
                  <h2 className="font-display text-base font-bold text-white">
                    OMR OS Autonomous Partner Diagnostics &amp; Self-Healing Control
                  </h2>
                  <p className="text-xs text-slate-400">
                    Zero-ticket self-service diagnostics for order ingestion, payout readiness, and kitchen SLA recovery.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => void handleSelfHealOutlet()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs shrink-0"
              >
                <Wrench className="mr-1.5 size-3.5" />
                1-Tap Restore Online &amp; Reset SLA
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <div className="text-[10px] font-mono text-slate-400">14-DIGIT FSSAI</div>
                <div className={`font-bold mt-1 ${fssaiReady ? "text-emerald-400" : "text-amber-400"}`}>
                  {fssaiReady ? `Verified (${r?.fssai_number})` : "Action Needed in KYC"}
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <div className="text-[10px] font-mono text-slate-400">PAYOUT BANK &amp; IFSC</div>
                <div className={`font-bold mt-1 ${bankReady ? "text-emerald-400" : "text-amber-400"}`}>
                  {bankReady ? `Ready (${r?.bank_ifsc})` : "Action Needed in KYC"}
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <div className="text-[10px] font-mono text-slate-400">TAX PAN (§194-O)</div>
                <div className={`font-bold mt-1 ${panReady ? "text-emerald-400" : "text-amber-400"}`}>
                  {panReady ? `Linked (${r?.pan})` : "Action Needed in KYC"}
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <div className="text-[10px] font-mono text-slate-400">EMERGENCY CLOSURE</div>
                <div className={`font-bold mt-1 ${r?.emergency_closed ? "text-rose-400" : "text-emerald-400"}`}>
                  {r?.emergency_closed ? "Paused (Tap Restore)" : "Clear — Normal Dispatch"}
                </div>
              </div>
            </div>

            {diagMsg ? (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-4" />
                <span>{diagMsg}</span>
              </div>
            ) : null}
          </Card>
        ) : null}

        {/* Kitchen & KDS Operations Customization Panel */}
        {vendor.restaurantId ? (
          <KitchenKdsOperationsPanel
            restaurantId={vendor.restaurantId}
            initialPrepMinutes={r?.prep_minutes}
            initialPeakPrepMinutes={r?.peak_prep_minutes}
            initialPackingPaise={r?.packing_paise}
            initialMinOrderPaise={r?.min_order_paise}
          />
        ) : null}

        {/* Catalogue & King AI Autonomous Stock Controls */}
        {vendor.restaurantId ? (
          <CatalogueStockControlsPanel
            restaurantId={vendor.restaurantId}
          />
        ) : null}

        {/* KingPay Soundbox Audio Announcement Engine */}
        {vendor.restaurantId ? (
          <KingpaySoundboxSettingsPanel
            restaurantId={vendor.restaurantId}
          />
        ) : null}

        {/* King AI Communications Engine: Automated Multi-Channel Dispatch */}
        {vendor.restaurantId ? (
          <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="size-5 text-emerald-400" />
                <div>
                  <h2 className="font-display text-base font-bold text-white">
                    King AI Communications Engine &amp; Automated Multi-Channel Dispatch
                  </h2>
                  <p className="text-xs text-slate-400">
                    Configure real-time WhatsApp shift reports, SMS kitchen emergency alerts, and statutory email tax invoices with DPDP Act compliant consent.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded self-start sm:self-center">
                KING AI COMM-ENGINE v2.5
              </span>
            </div>

            {/* Test Dispatch Feedback */}
            {testDispatchMsg ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                <div>
                  <div className="font-bold uppercase tracking-wider text-[10px] text-emerald-400">
                    {testDispatchMsg.channel} Test Dispatch Result
                  </div>
                  <div className="mt-0.5">{testDispatchMsg.text}</div>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Channel 1: WhatsApp Shift Report */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="size-4 text-emerald-400" />
                      <span className="font-bold text-sm text-white">WhatsApp Shift Recon</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      DAILY 23:00 IST
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Daily shift closing reconciliation directly to WhatsApp: Daily P&amp;L, statutory CGST Sec 9(5) remitted (5%), zero platform fees saved, Delivered Order Count, and Accrued Net Payout.
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs text-slate-300">Destination WhatsApp Phone</Label>
                    <Input
                      type="tel"
                      value={currentWaPhone}
                      onChange={(e) => setWaPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-9 text-xs bg-slate-900 border-slate-800 font-mono"
                    />
                  </div>

                  {/* Statutory Consent Checkbox */}
                  <label className="flex items-start gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentWaConsent}
                      onChange={(e) => setWaConsent(e.target.checked)}
                      className="mt-1 size-3.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] text-slate-300 leading-tight">
                      I consent to receive automated operational shift reports via OrderKing WhatsApp Business API pursuant to the DPDP Act 2023.
                    </span>
                  </label>

                  {/* Shift Report Inclusions */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                    <div className="text-emerald-400">✓ Daily P&amp;L Breakdown</div>
                    <div className="text-emerald-400">✓ 9(5) GST Remitted</div>
                    <div className="text-emerald-400">✓ Accrued Net Payout</div>
                    <div className="text-emerald-400">✓ Delivered Order Count</div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  disabled={testingChannel === "whatsapp"}
                  onClick={() => void handleTestNotification("whatsapp")}
                  className="w-full text-xs border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-950/40"
                >
                  <Send className="mr-1.5 size-3.5 text-emerald-400" />
                  {testingChannel === "whatsapp" ? "Dispatching WhatsApp..." : "Send Test WhatsApp Report"}
                </Button>
              </div>

              {/* Channel 2: SMS Kitchen Emergency Alerts */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-amber-400" />
                      <span className="font-bold text-sm text-white">SMS Kitchen Emergency</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      PRIORITY DLT
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    High-priority transactional SMS alerts for critical kitchen events: Kitchen Throttle alert (SLA surge buffer / emergency pause), and critical stockout (86 dish item stockout).
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs text-slate-300">Destination SMS Mobile Number</Label>
                    <Input
                      type="tel"
                      value={currentSmsPhone}
                      onChange={(e) => setSmsPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-9 text-xs bg-slate-900 border-slate-800 font-mono"
                    />
                  </div>

                  {/* Statutory Consent Checkbox */}
                  <label className="flex items-start gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentSmsConsent}
                      onChange={(e) => setSmsConsent(e.target.checked)}
                      className="mt-1 size-3.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[11px] text-slate-300 leading-tight">
                      I consent to receive high-priority transactional SMS emergency alerts for kitchen throttles and critical dish stockouts.
                    </span>
                  </label>

                  {/* SMS Inclusions */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                    <div className="text-amber-400">✓ Kitchen Throttle Alert</div>
                    <div className="text-amber-400">✓ Critical 86 Stockout</div>
                    <div className="text-amber-400">✓ Surge SLA Extension</div>
                    <div className="text-amber-400">✓ Emergency Closure</div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  disabled={testingChannel === "sms"}
                  onClick={() => void handleTestNotification("sms")}
                  className="w-full text-xs border-slate-700 hover:border-amber-500/50 hover:bg-amber-950/40"
                >
                  <Send className="mr-1.5 size-3.5 text-amber-400" />
                  {testingChannel === "sms" ? "Dispatching SMS..." : "Send Test SMS Emergency Alert"}
                </Button>
              </div>

              {/* Channel 3: Email Tax Invoices & Form 16A */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-sky-400" />
                      <span className="font-bold text-sm text-white">Email Tax &amp; Invoices</span>
                    </div>
                    <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                      STATUTORY TAX
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Automated monthly email dispatch of statutory CGST Sec 9(5) tax invoices, monthly settlement reconciliation ledgers, and quarterly Form 16A TDS certificates.
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs text-slate-300">Destination Accounts / CA Email</Label>
                    <Input
                      type="email"
                      value={currentEmailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="accounts@restaurant.in"
                      className="h-9 text-xs bg-slate-900 border-slate-800 font-mono"
                    />
                  </div>

                  {/* Statutory Consent Checkbox */}
                  <label className="flex items-start gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentEmailConsent}
                      onChange={(e) => setEmailConsent(e.target.checked)}
                      className="mt-1 size-3.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
                    />
                    <span className="text-[11px] text-slate-300 leading-tight">
                      I consent to receive official monthly tax invoices, GSTR-8 statements, and Form 16A certificates via email.
                    </span>
                  </label>

                  {/* Email Inclusions */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                    <div className="text-sky-400">✓ Monthly Tax Invoices</div>
                    <div className="text-sky-400">✓ Form 16A (TDS §194-O)</div>
                    <div className="text-sky-400">✓ GSTR-8 Credit Ledgers</div>
                    <div className="text-sky-400">✓ Sec 9(5) GST Filing</div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  disabled={testingChannel === "email"}
                  onClick={() => void handleTestNotification("email")}
                  className="w-full text-xs border-slate-700 hover:border-sky-500/50 hover:bg-sky-950/40"
                >
                  <Send className="mr-1.5 size-3.5 text-sky-400" />
                  {testingChannel === "email" ? "Dispatching Email..." : "Send Test Tax Statement Email"}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="text-xs text-emerald-400 font-medium">
                {notifMsg ?? ""}
              </div>
              <Button
                size="sm"
                disabled={notifSaving}
                onClick={() => void handleSaveKingAiNotifications()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4"
              >
                {notifSaving ? "Saving Notification Preferences..." : "Save King AI Notification Preferences"}
              </Button>
            </div>
          </Card>
        ) : null}

        {/* Pan-India 23-Language Switcher & Kitchen Audio Ring Alerts */}
        <Card className="space-y-3 border-slate-800 bg-slate-900/70 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-emerald-400" />
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  All 22 Scheduled Languages of India + English ({ALL_INDIAN_LANGUAGES.length} Languages)
                </h2>
                <p className="text-xs text-slate-400">
                  Switch your partner console, KOT voice announcements, and AI assistant into any official Indian language:
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={soundOn ? "primary" : "secondary"}
              onClick={() => setSoundOn(!soundOn)}
              className="text-xs shrink-0"
            >
              {soundOn ? (
                <>
                  <Volume2 className="mr-1.5 size-4" /> Kitchen Siren Active
                </>
              ) : (
                <>
                  <VolumeX className="mr-1.5 size-4" /> Kitchen Siren Muted
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-1">
            {ALL_INDIAN_LANGUAGES.map((item) => {
              const active = lang === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLang(item.code)}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    active
                      ? "border-emerald-500 bg-emerald-500/15 text-white"
                      : "border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{item.native}</span>
                    <span className="text-[10px] font-mono uppercase text-emerald-400">{item.code}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.label} · {item.region}</div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Commercial Commission Schedule & Outlet Take-Rate Negotiation */}
        <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Scale className="size-5 text-emerald-400" />
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  Commercial Commission Schedule &amp; Outlet Take-Rate Negotiation
                </h2>
                <p className="text-xs text-slate-400">
                  Customizable per-outlet commercial commission. Standard industry delivery is 28% to sustainably fund rider delivery payouts. Dine-in remains 0% sovereign take-rate.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded">
                CONTRACTED: {(contractedBps / 100).toFixed(1)}% ({contractedBps} BPS)
              </span>
            </div>
          </div>

          {/* Key Rates Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Contracted Rate</div>
              <div className="text-2xl font-bold font-display text-emerald-400">
                {(contractedBps / 100).toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-400">
                Standard delivery settlement tier for this outlet
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">Active Negotiated Rate</div>
              <div className="text-2xl font-bold font-display text-white flex items-baseline gap-1.5">
                <span>{(effectiveBps / 100).toFixed(1)}%</span>
                <span className="text-xs font-mono text-emerald-400 font-normal">({effectiveBps} bps)</span>
              </div>
              <div className="text-[11px] text-slate-300">
                {effectiveBps === 0
                  ? "0% Sovereign Dine-In"
                  : effectiveBps === 2800
                    ? "28% Full Service Delivery (Default)"
                    : `${(effectiveBps / 100).toFixed(1)}% Negotiated Delivery Tier`}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Dine-In Take-Rate</div>
              <div className="text-2xl font-bold font-display text-emerald-400">
                0.0%
              </div>
              <div className="text-[11px] text-slate-400">
                0% Sovereign Dine-In &amp; Customer Direct Pickup
              </div>
            </div>
          </div>

          {/* Interactive Tier Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-200">
                Select Pre-Configured Commercial Delivery Tier:
              </Label>
              <span className="text-[10px] font-mono text-slate-400">5 PRESET TIERS</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {DELIVERY_COMMISSION_TIER_LIST.map((tier) => {
                const isSelected = effectiveBps === tier.bps;
                return (
                  <button
                    key={tier.key}
                    type="button"
                    disabled={!isAuthorizedToNegotiate}
                    onClick={() => setNegotiatedBps(tier.bps)}
                    className={`rounded-xl border p-3 text-left transition flex flex-col justify-between ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/15 text-white shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                        : "border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700"
                    } ${!isAuthorizedToNegotiate ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs">{tier.percentage}%</span>
                        {isSelected ? (
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-0.5">
                            <Check className="size-3" /> ACTIVE
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500">{tier.bps} bps</span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-100 mt-1">{tier.label}</div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2 leading-relaxed">{tier.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Negotiated Rate Input (Slider & Number) */}
          {isAuthorizedToNegotiate ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sliders className="size-4 text-emerald-400" />
                  <span className="font-bold text-xs text-white">
                    Custom Negotiated Rate (0% to 35%):
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {negotiatedBps !== null && negotiatedBps !== contractedBps ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setNegotiatedBps(null)}
                      className="h-7 text-[10px] text-slate-300 border-slate-700 hover:text-white"
                    >
                      Reset to Contracted ({(contractedBps / 100).toFixed(1)}%)
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    disabled={commissionSaving || !vendor.restaurantId}
                    onClick={() => void handleSaveNegotiatedCommission()}
                    className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3"
                  >
                    {commissionSaving ? "Saving Rate..." : "Save Negotiated Commission Rate"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-4 items-center pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>0% (Dine-In)</span>
                    <span>18% (Enterprise)</span>
                    <span className="text-emerald-400 font-bold">28% (Default)</span>
                    <span>35% (Max)</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={35}
                    step={0.5}
                    value={effectiveBps / 100}
                    onChange={(e) => setNegotiatedBps(Math.round(Number(e.target.value) * 100))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    max={35}
                    step={0.1}
                    value={(effectiveBps / 100).toFixed(1)}
                    onChange={(e) => {
                      const val = Math.min(35, Math.max(0, Number(e.target.value)));
                      setNegotiatedBps(Math.round(val * 100));
                    }}
                    className="h-9 text-xs bg-slate-900 border-slate-800 font-mono text-center text-emerald-400 font-bold"
                  />
                  <span className="text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              {commissionMsg ? (
                <div className="text-xs text-emerald-400 flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{commissionMsg}</span>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
              {t("settings.financialLocked")} Contact your restaurant owner to adjust contracted take-rates.
            </div>
          )}

          {/* Live Itemized Integer-Paise Calculation Preview */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Calculator className="size-4 text-emerald-400" />
                <span className="font-bold text-xs text-white">
                  Live Itemized Integer-Paise Settlement Preview ({(effectiveBps / 100).toFixed(1)}% Commission):
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Test Basket:</span>
                {[250, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPreviewBasketInr(amt)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition ${
                      previewBasketInr === amt
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              {/* Gross Food */}
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-300">Gross Food Value (Customer Order Total)</span>
                <span className="font-mono font-semibold text-white">
                  + {formatINR(previewBreakdown.foodValuePaise)}
                </span>
              </div>

              {/* Commission */}
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300">
                    Platform Delivery Commission ({(effectiveBps / 100).toFixed(1)}%)
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 rounded">
                    {effectiveBps} BPS
                  </span>
                </div>
                <span className="font-mono font-semibold text-rose-400">
                  - {formatINR(previewBreakdown.commissionPaise)}
                </span>
              </div>

              {/* 18% GST on Commission */}
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300">18% GST on Platform Commission (SAC 9985)</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ({formatINR(previewBreakdown.commissionCgstPaise)} CGST + {formatINR(previewBreakdown.commissionSgstPaise)} SGST)
                  </span>
                </div>
                <span className="font-mono font-semibold text-rose-400">
                  - {formatINR(previewBreakdown.commissionGstPaise)}
                </span>
              </div>

              {/* 5% §9(5) Food GST */}
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60 bg-emerald-950/20 px-2 rounded">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-300 font-medium">5% §9(5) Food GST (CGST Act 2017)</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    PLATFORM REMITTED / NON-DEBITED
                  </span>
                </div>
                <span className="font-mono font-semibold text-emerald-400">
                  {formatINR(previewBreakdown.sec9_5GstPaise)}
                </span>
              </div>

              {/* 1% TCS */}
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300">1% TCS under Section 52 of CGST Act 2017</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ({formatINR(previewBreakdown.tcsCgstPaise)} CGST + {formatINR(previewBreakdown.tcsSgstPaise)} SGST)
                  </span>
                </div>
                <span className="font-mono font-semibold text-rose-400">
                  - {formatINR(previewBreakdown.tcsSec52Paise)}
                </span>
              </div>

              {/* 1% TDS */}
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300">1% TDS under Section 194-O Income Tax Act 1961</span>
                  <span className="text-[10px] font-mono text-slate-400">(Deposited to your PAN)</span>
                </div>
                <span className="font-mono font-semibold text-rose-400">
                  - {formatINR(previewBreakdown.tdsSec194OPaise)}
                </span>
              </div>

              {/* Total Deductions */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800 font-semibold text-slate-300">
                <span>Total Debited Deductions (Excl. 9(5) Platform Remittance)</span>
                <span className="font-mono text-rose-400">
                  - {formatINR(previewBreakdown.totalDeductionsPaise)}
                </span>
              </div>

              {/* Net Restaurant Payable */}
              <div className="flex items-center justify-between pt-2.5">
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold text-slate-300">
                    Net Restaurant Payable (NRP)
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    Exact integer-paise formula (zero floating-point drift)
                  </div>
                </div>
                <div className="text-2xl font-bold font-display text-emerald-400 font-mono">
                  {formatINR(previewBreakdown.netRestaurantPayablePaise)}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            {t("settings.snapshotHint")} Snapshot per order. Applied strictly on net taxable food and packaging value in integer paise.
          </p>
        </Card>

        {/* Role-Based Staff Access Management */}
        {vendor.role && can(vendor.role, "settings.staff") ? (
          <Card className="space-y-3 border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-emerald-400" />
                <h2 className="font-display text-base font-bold text-white">{t("settings.staff")}</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">RBAC ACCESS CONTROL</span>
            </div>
            <ul className="text-xs divide-y divide-slate-800">
              {staffQ.data?.staff.map((s) => (
                <li key={s.id} className="flex justify-between py-2.5 text-slate-200">
                  <span>{s.email ?? s.user_id}</span>
                  <span className="font-mono text-emerald-400">{s.role}</span>
                </li>
              ))}
            </ul>
            <div className="grid gap-2.5 md:grid-cols-[1fr_180px_auto] pt-2">
              <div>
                <Label className="text-xs text-slate-300">{t("auth.email")}</Label>
                <Input
                  value={email}
                  placeholder="staff@restaurant.in"
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-xs h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300">{t("settings.role")}</Label>
                <select
                  className="h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-2.5 text-xs text-slate-100"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="STAFF">STAFF</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ACCOUNTANT">ACCOUNTANT</option>
                  <option value="MULTI_OUTLET_MANAGER">MULTI_OUTLET_MANAGER</option>
                </select>
              </div>
              <Button
                className="self-end h-10 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                onClick={() =>
                  void addStaff({
                    data: {
                      restaurantId: vendor.restaurantId,
                      email,
                      role: role as "STAFF",
                    },
                  })
                    .then(() => {
                      setMsg("Staff member role updated.");
                      setEmail("");
                      void qc.invalidateQueries({ queryKey: ["staff"] });
                    })
                    .catch((e) => setMsg(e instanceof Error ? e.message : "Failed"))
                }
              >
                {t("settings.add")}
              </Button>
            </div>
            {msg ? <p className="text-xs text-emerald-400">{msg}</p> : null}
          </Card>
        ) : null}

        {/* Restaurant Partner Legal, Privacy & Compliance Center */}
        <Card id="legal-compliance" className="border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-5 text-emerald-400" />
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  Restaurant Partner Legal, Privacy &amp; Compliance Center
                </h2>
                <p className="text-xs text-slate-400">
                  Statutory agreements, merchant privacy disclosures, FSSAI hygiene undertakings, and grievance escalation.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded self-start sm:self-center">
              STATUTORY CHARTER
            </span>
          </div>

          <div className="space-y-2.5">
            {LEGAL_SECTIONS.map((sec) => {
              const isOpen = openPolicyId === sec.id;
              return (
                <div
                  key={sec.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenPolicyId(isOpen ? null : sec.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-900/60 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="size-4 text-emerald-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                        {sec.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-block rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                        {sec.badge}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="size-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="size-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                  {isOpen ? (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-2 text-xs text-slate-300 leading-relaxed">
                      {sec.body.map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </VendorShell>
  );
}
