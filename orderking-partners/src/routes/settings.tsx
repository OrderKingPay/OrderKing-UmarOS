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
import { addStaff, listStaff } from "@/lib/server/api-more";
import { getRestaurant, updateRestaurantProfile } from "@/lib/server/api-bootstrap";
import { quickThrottleKitchen } from "@/lib/server/api-orders";
import { can } from "@/lib/rbac";
import { formatINR, rupeesToPaise } from "@/lib/money";
import { platformConfig } from "@/lib/platform-config";
import { INDIAN_LANGUAGE_CATALOG } from "@/lib/i18n";
import { UniversalPosHardwareManager } from "@/components/universal-pos-hardware";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  FileText,
  Globe,
  Scale,
  ShieldCheck,
  Sliders,
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

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STAFF");
  const [msg, setMsg] = useState<string | null>(null);
  const [openPolicyId, setOpenPolicyId] = useState<string | null>("commercial-terms");

  const [packingInr, setPackingInr] = useState("");
  const [minOrderInr, setMinOrderInr] = useState("");
  const [prepMins, setPrepMins] = useState("");
  const [peakPrepMins, setPeakPrepMins] = useState("");
  const [opsSaving, setOpsSaving] = useState(false);
  const [opsMsg, setOpsMsg] = useState<string | null>(null);
  const [diagMsg, setDiagMsg] = useState<string | null>(null);

  const r = restQ.data?.restaurant;

  async function handleSaveOutletOps() {
    if (!vendor.restaurantId) return;
    setOpsSaving(true);
    setOpsMsg(null);
    try {
      const nextPackingPaise =
        packingInr.trim() !== ""
          ? rupeesToPaise(Math.max(0, Number(packingInr)))
          : (r?.packing_paise ?? 0);
      const nextMinOrderPaise =
        minOrderInr.trim() !== ""
          ? rupeesToPaise(Math.max(0, Number(minOrderInr)))
          : (r?.min_order_paise ?? 0);
      const nextPrep =
        prepMins.trim() !== "" ? Math.max(5, Math.round(Number(prepMins))) : (r?.prep_minutes ?? 20);
      const nextPeak =
        peakPrepMins.trim() !== ""
          ? Math.max(10, Math.round(Number(peakPrepMins)))
          : (r?.peak_prep_minutes ?? 35);

      await updateRestaurantProfile({
        data: {
          restaurantId: vendor.restaurantId,
          packingPaise: nextPackingPaise,
          minOrderPaise: nextMinOrderPaise,
          prepMinutes: nextPrep,
          peakPrepMinutes: nextPeak,
        },
      });
      await qc.invalidateQueries({ queryKey: ["restaurant"] });
      setOpsMsg("Outlet packaging charges, minimum order value, and preparation SLAs saved.");
    } catch (err) {
      setOpsMsg(err instanceof Error ? err.message : "Could not save outlet parameters");
    } finally {
      setOpsSaving(false);
    }
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
        {/* Universal POS & Thermal Printer Hardware Manager */}
        <UniversalPosHardwareManager
          restaurantId={vendor.restaurantId}
          restaurantName={vendor.selected?.restaurantName}
        />

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

        {/* Self-Service Outlet Operational & Commercial Parameters */}
        {vendor.restaurantId ? (
          <Card className="border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="size-4 text-emerald-400" />
                <div>
                  <h2 className="font-display text-base font-bold text-white">
                    Self-Service Outlet Packaging, Minimum Order &amp; Prep SLA
                  </h2>
                  <p className="text-xs text-slate-400">
                    Configure your default packaging fee, minimum basket value, and standard vs. rush preparation times directly.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">SELF-SERVICE</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs text-slate-300">
                  Default Packaging Fee (₹) — Current: {formatINR(r?.packing_paise ?? 0)}
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={packingInr}
                  onChange={(e) => setPackingInr(e.target.value)}
                  placeholder={String(Math.round((r?.packing_paise ?? 0) / 100))}
                  className="mt-1 h-9 text-xs bg-slate-950 border-slate-800"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300">
                  Minimum Order Value (₹) — Current: {formatINR(r?.min_order_paise ?? 0)}
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="10"
                  value={minOrderInr}
                  onChange={(e) => setMinOrderInr(e.target.value)}
                  placeholder={String(Math.round((r?.min_order_paise ?? 0) / 100))}
                  className="mt-1 h-9 text-xs bg-slate-950 border-slate-800"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300">
                  Standard Prep SLA (Mins) — Current: {r?.prep_minutes ?? 20}m
                </Label>
                <Input
                  type="number"
                  min={5}
                  max={90}
                  value={prepMins}
                  onChange={(e) => setPrepMins(e.target.value)}
                  placeholder={String(r?.prep_minutes ?? 20)}
                  className="mt-1 h-9 text-xs bg-slate-950 border-slate-800"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300">
                  Peak Rush SLA (Mins) — Current: {r?.peak_prep_minutes ?? 35}m
                </Label>
                <Input
                  type="number"
                  min={10}
                  max={120}
                  value={peakPrepMins}
                  onChange={(e) => setPeakPrepMins(e.target.value)}
                  placeholder={String(r?.peak_prep_minutes ?? 35)}
                  className="mt-1 h-9 text-xs bg-slate-950 border-slate-800"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="text-xs text-emerald-400">{opsMsg ?? ""}</div>
              <Button
                size="sm"
                disabled={opsSaving}
                onClick={() => void handleSaveOutletOps()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
              >
                {opsSaving ? "Saving Outlet Settings..." : "Save Outlet Parameters"}
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

        {/* Commercial Commission Schedule */}
        <Card className="space-y-2 border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="size-4 text-emerald-400" />
              <h2 className="font-display text-base font-bold text-white">{t("settings.commission")}</h2>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">CONTRACTED RATE</span>
          </div>
          {vendor.role && can(vendor.role, "settings.financial") ? (
            <p className="tabular font-display text-2xl font-bold text-emerald-400">
              {(vendor.selected?.commissionBps ?? platformConfig.commission.targetBps) / 100}%
            </p>
          ) : (
            <p className="text-sm text-muted">{t("settings.financialLocked")}</p>
          )}
          <p className="text-xs text-slate-400">
            {t("settings.snapshotHint")} {platformConfig.commission.targetBps / 100}%. Applied strictly on net taxable food and packaging value in integer paise.
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
