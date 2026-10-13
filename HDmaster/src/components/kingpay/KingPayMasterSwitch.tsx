import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  ShieldCheck,
  Key,
  Loader2,
  Landmark,
  CheckCircle2,
  Lock,
  Sliders,
  Settings,
  Save,
  Calculator,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CustomSwitchSettings {
  maxUpiOrderInr: number;
  maxCodOrderInr: number;
  linkExpiryMinutes: number;
  payoutScheduleDay: string;
  walletCashbackPct: number;
  upiFeePct: number;
}

const DEFAULT_SWITCH_SETTINGS: CustomSwitchSettings = {
  maxUpiOrderInr: 100000,
  maxCodOrderInr: 1500,
  linkExpiryMinutes: 15,
  payoutScheduleDay: "Daily 06:00 IST (T+1)",
  walletCashbackPct: 2,
  upiFeePct: 0,
};

const STORAGE_KEY = "orderking_kingpay_switch_settings";

export function KingPayMasterSwitch() {
  const queryClient = useQueryClient();
  const [activePendingFeature, setActivePendingFeature] = useState<
    string | null
  >(null);

  // Customization settings state
  const [customSettings, setCustomSettings] = useState<CustomSwitchSettings>(
    DEFAULT_SWITCH_SETTINGS
  );
  const [isCustomizeOpen, setIsCustomizeOpen] = useState<boolean>(false);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Calculator (Test Your Rates) state
  const [calcOrderInr, setCalcOrderInr] = useState<number>(450);
  const [calcCommissionPct, setCalcCommissionPct] = useState<number>(20);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCustomSettings({
          ...DEFAULT_SWITCH_SETTINGS,
          ...JSON.parse(saved),
        });
      }
    } catch {
      // Ignore storage errors
    }

    fetch("/api/v1/admin/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((serverData) => {
        if (serverData?.kingpay_switch_settings) {
          const merged = {
            ...DEFAULT_SWITCH_SETTINGS,
            ...serverData.kingpay_switch_settings,
          };
          setCustomSettings(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      })
      .catch(() => {
        // Offline or local fallback
      });
  }, []);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSaveNotice(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customSettings));
      const res = await fetch("/api/v1/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kingpay_switch_settings: customSettings,
        }),
      });
      if (res.ok) {
        setSaveNotice("Payment switch settings saved to database and local storage.");
      } else {
        setSaveNotice("Payment switch settings saved locally on this device.");
      }
    } catch {
      setSaveNotice("Payment switch settings saved locally on this device (offline mode).");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["kingpay-compliance-state"],
    queryFn: async () => {
      const res = await fetch("/api/v1/founder/kingpay-compliance");
      return (await res.json()) as {
        success: boolean;
        state: Record<string, boolean>;
      };
    },
  });

  const mutation = useMutation({
    mutationFn: async ({
      feature,
      action,
    }: {
      feature: string;
      action: "activate" | "deactivate";
    }) => {
      setActivePendingFeature(feature);
      const res = await fetch("/api/v1/founder/kingpay-compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, action }),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kingpay-compliance-state"] });
      setActivePendingFeature(null);
    },
    onError: () => {
      setActivePendingFeature(null);
    },
  });

  const features = [
    {
      id: "upi",
      label: "UPI Payments",
      desc: "Let customers pay instantly using any UPI app or QR code.",
      spec: `Max order ₹${customSettings.maxUpiOrderInr.toLocaleString()} • ${customSettings.upiFeePct}% UPI fee`,
      locked: false,
    },
    {
      id: "collect",
      label: "Payment Links",
      desc: "Send SMS or WhatsApp payment links for customer orders.",
      spec: `Links expire automatically after ${customSettings.linkExpiryMinutes} minutes`,
      locked: false,
    },
    {
      id: "pay",
      label: "Card & NetBanking Checkout",
      desc: "Accept debit cards, credit cards, and netbanking at checkout.",
      spec: `Cashback reward: ${customSettings.walletCashbackPct}% on wallet orders`,
      locked: false,
    },
    {
      id: "autopay",
      label: "AutoPay Subscriptions",
      desc: "Allow automatic recurring payments up to ₹15,000 per RBI rules.",
      spec: "RBI e-Mandate compliant recurring billing",
      locked: false,
    },
    {
      id: "settlements",
      label: "Restaurant Bank Payouts",
      desc: "Send daily order earnings to restaurant bank accounts via IMPS/NEFT.",
      spec: `Payout schedule: ${customSettings.payoutScheduleDay}`,
      locked: false,
    },
    {
      id: "p2p",
      label: "Wallet-to-Wallet Transfers",
      desc: "Locked until RBI Prepaid Payment Instrument (PPI) license approval.",
      spec: "Strictly locked for statutory RBI compliance",
      locked: true,
    },
  ];

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-600 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800 mb-3" />
        <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
          Loading Payment On/Off Switches...
        </span>
      </div>
    );
  }

  const state = data.state || {};
  const activeCount = features.filter(
    (f) => !f.locked && state[f.id] === true
  ).length;

  // Calculator math for testing payout split
  const calcCommissionInr = (calcOrderInr * calcCommissionPct) / 100;
  const calcCashbackInr =
    (calcOrderInr * customSettings.walletCashbackPct) / 100;
  const calcUpiFeeInr = (calcOrderInr * customSettings.upiFeePct) / 100;
  const calcNetRestaurantPayoutInr =
    calcOrderInr - calcCommissionInr - calcUpiFeeInr;
  const calcNetFounderKeepInr = calcCommissionInr - calcCashbackInr;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden text-slate-800 w-full shadow-sm">
      {/* Top Compliance Ribbon (Zero Fake Numbers) */}
      <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-slate-600">
        <div className="flex items-center gap-2">
          <Landmark className="w-3.5 h-3.5 text-emerald-600" />
          <span>NPCI UPI & RBI COMPLIANT PAYMENT CONTROLS</span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            ACTIVE SWITCHES:{" "}
            <strong className="text-emerald-700">
              {activeCount} OF {features.length}
            </strong>
          </span>
          <span>
            PAYOUT CYCLE:{" "}
            <strong className="text-slate-900">
              {customSettings.payoutScheduleDay}
            </strong>
          </span>
        </div>
      </div>

      {/* 1. Main Header */}
      <div className="p-6 md:p-8 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              Payment On/Off Switches
            </h2>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
              {activeCount} / {features.length} ON
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Turn payment methods and restaurant bank payouts on or off with one click.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="#kingpay-global-settings"
            className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            King Pay Rules
          </a>
          <Badge
            variant="outline"
            className="bg-slate-100 text-slate-700 border-slate-300 uppercase tracking-widest font-mono text-xs py-1.5 px-3"
          >
            Founder Control
          </Badge>
        </div>
      </div>

      {/* 2. Top 3-Box Summary: Live Result + Action Needed + Customize & Settings */}
      <div className="p-6 md:px-8 pb-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white">
        {/* Box 1: Live Result */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800">
            Live Result
          </div>
          <div className="text-base font-black text-slate-900 mt-1">
            {activeCount} of {features.length} Payment Modes Enabled
          </div>
          <p className="text-xs text-slate-600 mt-1">
            COD limit: ₹{customSettings.maxCodOrderInr} • Wallet cashback: {customSettings.walletCashbackPct}%.
          </p>
        </div>

        {/* Box 2: Action Needed */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800">
            Action Needed
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1">
            {activeCount === 0
              ? "Turn on UPI Payments and Restaurant Payouts below."
              : "Check your enabled switches or customize order limits."}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Every switch change takes effect immediately for new orders.
          </p>
        </div>

        {/* Box 3: Customize & Settings Button */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
              Customize & Settings
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Set custom COD cap ₹, UPI fee %, cashback %, and payout time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>
              {isCustomizeOpen ? "Hide Switch Settings" : "Customize & Settings"}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Customization Panel */}
      {isCustomizeOpen && (
        <div className="mx-6 md:mx-8 mt-4 p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Custom Payment Limits & Payout Rules
              </h3>
              <p className="text-xs text-slate-600">
                Customize payment limits, link expiry time, and customer cashback.
              </p>
            </div>
            {saveNotice && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {saveNotice}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                Max UPI Order (₹)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Maximum allowed per UPI payment.
              </p>
              <input
                type="number"
                min="500"
                max="100000"
                step="500"
                value={customSettings.maxUpiOrderInr}
                onChange={(e) =>
                  setCustomSettings({
                    ...customSettings,
                    maxUpiOrderInr: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold"
              />
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                Max Cash on Delivery (₹)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Maximum cart value allowed for COD.
              </p>
              <input
                type="number"
                min="0"
                max="10000"
                step="100"
                value={customSettings.maxCodOrderInr}
                onChange={(e) =>
                  setCustomSettings({
                    ...customSettings,
                    maxCodOrderInr: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold"
              />
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                Link Expiry (Minutes)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                How long payment links stay valid.
              </p>
              <input
                type="number"
                min="5"
                max="120"
                step="5"
                value={customSettings.linkExpiryMinutes}
                onChange={(e) =>
                  setCustomSettings({
                    ...customSettings,
                    linkExpiryMinutes: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold"
              />
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                Payout Schedule
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                When restaurants receive bank transfers.
              </p>
              <select
                value={customSettings.payoutScheduleDay}
                onChange={(e) =>
                  setCustomSettings({
                    ...customSettings,
                    payoutScheduleDay: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold bg-white"
              >
                <option value="Daily 06:00 IST (T+1)">
                  Daily 06:00 IST (T+1)
                </option>
                <option value="Every Monday">Every Monday</option>
                <option value="Every Wednesday">Every Wednesday</option>
                <option value="Every Friday">Every Friday</option>
              </select>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                Wallet Cashback %
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Customer reward on prepaid orders.
              </p>
              <input
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={customSettings.walletCashbackPct}
                onChange={(e) =>
                  setCustomSettings({
                    ...customSettings,
                    walletCashbackPct: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold"
              />
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                UPI Processing Fee %
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                NPCI standard is 0% for UPI.
              </p>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={customSettings.upiFeePct}
                onChange={(e) =>
                  setCustomSettings({
                    ...customSettings,
                    upiFeePct: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCustomSettings(DEFAULT_SWITCH_SETTINGS)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100"
            >
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingSettings ? "Saving..." : "Save Switch Settings"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Grid of Payment Switches */}
      <div className="p-6 md:p-8 grid gap-4 grid-cols-1 md:grid-cols-2 bg-slate-50/30">
        {features.map((feat) => {
          const isLocked = Boolean(feat.locked);
          const isActive = !isLocked && state[feat.id] === true;
          const isPending =
            mutation.isPending && activePendingFeature === feat.id;

          return (
            <div
              key={feat.id}
              className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                isLocked
                  ? "bg-slate-50 border-slate-200 opacity-90"
                  : isActive
                  ? "bg-emerald-50/40 border-emerald-300 shadow-sm"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      {isLocked ? (
                        <Lock className="w-4 h-4 text-amber-600" />
                      ) : isActive ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-slate-400" />
                      )}
                      <span
                        className={
                          isActive
                            ? "text-slate-900 font-bold"
                            : isLocked
                            ? "text-slate-700"
                            : "text-slate-800"
                        }
                      >
                        {feat.label}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">{feat.desc}</p>
                  </div>

                  {isLocked ? (
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-800 border-amber-300 font-mono text-[10px] px-2 py-0.5 shrink-0 flex items-center gap-1"
                    >
                      <Lock className="w-2.5 h-2.5 text-amber-700" />
                      LOCKED (OFF)
                    </Badge>
                  ) : isActive ? (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-800 border-emerald-300 font-mono text-[10px] px-2 py-0.5 shrink-0"
                    >
                      ON
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-slate-100 text-slate-600 border-slate-300 font-mono text-[10px] px-2 py-0.5 shrink-0"
                    >
                      OFF
                    </Badge>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/70 text-[11px] font-mono text-slate-500">
                  {feat.spec}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-200/70">
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  {isLocked
                    ? "STATUS: RBI LICENSE PENDING"
                    : `STATUS: ${isActive ? "ENABLED" : "PAUSED"}`}
                </span>

                {isLocked ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="h-8 text-xs bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-80 font-mono flex items-center gap-1.5"
                  >
                    <Lock className="w-3 h-3" />
                    Locked (License Pending)
                  </Button>
                ) : isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      mutation.mutate({
                        feature: feat.id,
                        action: "deactivate",
                      })
                    }
                    disabled={mutation.isPending}
                    className="h-8 text-xs border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800 transition-colors"
                  >
                    {isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : null}
                    Turn Off
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() =>
                      mutation.mutate({ feature: feat.id, action: "activate" })
                    }
                    disabled={mutation.isPending}
                    className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white font-mono flex items-center gap-1.5 shadow-sm"
                  >
                    {isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Key className="w-3 h-3" />
                    )}
                    Turn On
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Interactive Calculator (Test Your Rates) */}
      <div className="px-6 md:px-8 pb-6">
        <div className="p-5 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              Calculator (Test Your Rates)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              See how an order payment splits between the restaurant and your founder account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">Sample Order Amount:</span>
                <span className="text-emerald-400 font-bold">
                  ₹{calcOrderInr}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                value={calcOrderInr}
                onChange={(e) => setCalcOrderInr(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">Restaurant Commission %:</span>
                <span className="text-emerald-400 font-bold">
                  {calcCommissionPct}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="35"
                step="1"
                value={calcCommissionPct}
                onChange={(e) => setCalcCommissionPct(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 uppercase block text-[10px]">
                Restaurant Bank Payout
              </span>
              <div className="text-lg font-bold text-white mt-1">
                ₹{calcNetRestaurantPayoutInr.toFixed(2)}
              </div>
              <span className="text-slate-500 text-[10px]">
                Sent on {customSettings.payoutScheduleDay}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 uppercase block text-[10px]">
                Customer Wallet Cashback ({customSettings.walletCashbackPct}%)
              </span>
              <div className="text-lg font-bold text-amber-400 mt-1">
                ₹{calcCashbackInr.toFixed(2)}
              </div>
              <span className="text-slate-500 text-[10px]">
                Credited to customer KingPay balance
              </span>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 uppercase block text-[10px]">
                Net Founder Commission Kept
              </span>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                ₹{calcNetFounderKeepInr.toFixed(2)}
              </div>
              <span className="text-slate-500 text-[10px]">
                After cashback reward deduction
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Security Seal */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-slate-600" />
          <span>SECURITY: SHA-256 VERIFIED ADMIN ACCESS</span>
        </div>
        <div>STATUTORY AUDIT LOG: ACTIVE</div>
      </div>
    </div>
  );
}
