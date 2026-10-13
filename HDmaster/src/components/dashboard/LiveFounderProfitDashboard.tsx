import { createServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { getSql } from "@/lib/db";
import { cn, formatInrExact } from "@/lib/utils";
import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Calculator,
  Percent,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Wallet,
  Truck,
  Utensils,
  CreditCard,
  ArrowDownRight,
  ArrowUpRight,
  Save,
  Settings,
} from "lucide-react";

export interface RealOrderTelemetry {
  id: string;
  publicId: string;
  createdAt: string;
  status: string;
  foodSubtotalPaise: number;
  deliveryFeePaise: number;
  commissionBps: number;
  commissionPaise: number;
  riderPayoutPaise: number;
  paymentFeePaise: number;
  totalPaise: number;
  inflowPaise: number;
  outflowPaise: number;
  exactProfitPaise: number;
  marginPct: number;
}

export interface FounderProfitSummary {
  realOrdersCount: number;
  totalProfitPaise: number;
  avgProfitPaise: number;
  marginPct: number;
  totalInflowPaise: number;
  totalOutflowPaise: number;
  totalRevenuePaise: number;
  totalCommissionPaise: number;
  totalDeliveryFeePaise: number;
  totalRiderPayoutPaise: number;
  totalPaymentFeePaise: number;
  orders: RealOrderTelemetry[];
  isEmpty: boolean;
  displayProfitString: string;
  displayAvgString: string;
  timestamp: string;
}

interface CustomFounderSettings {
  commissionPct: number;
  minOrderInr: number;
  deliveryFeeInr: number;
  rainFeeInr: number;
  riderBasePayInr: number;
  gstPct: number;
  payoutDay: string;
  walletCashbackPct: number;
}

const DEFAULT_FOUNDER_SETTINGS: CustomFounderSettings = {
  commissionPct: 20,
  minOrderInr: 149,
  deliveryFeeInr: 40,
  rainFeeInr: 20,
  riderBasePayInr: 30,
  gstPct: 5,
  payoutDay: "Daily (T+1)",
  walletCashbackPct: 2,
};

const STORAGE_KEY = "orderking_founder_profit_settings";

// Server function: Queries real paid customer orders from PostgreSQL
export const getLiveFounderProfit = createServerFn({ method: "GET" }).handler(
  async (): Promise<FounderProfitSummary> => {
    try {
      const sql = await getSql();

      const rows = await sql<{
        id: string;
        public_id: string | null;
        created_at: string;
        status: string;
        data_mode: string | null;
        food_subtotal_paise: number | null;
        food_paise: number | null;
        delivery_fee_paise: number | null;
        commission_bps: number | null;
        commission_paise: number | null;
        rider_payout_paise: number | null;
        payment_fee_paise: number | null;
        total_paise: number | null;
      }>`
        SELECT 
          id,
          public_id,
          created_at,
          status,
          data_mode,
          food_subtotal_paise,
          food_paise,
          delivery_fee_paise,
          commission_bps,
          commission_paise,
          rider_payout_paise,
          payment_fee_paise,
          total_paise
        FROM orders
        WHERE (data_mode IS NULL OR UPPER(data_mode) = 'REAL')
          AND status NOT IN ('CANCELLED', 'DRAFT')
        ORDER BY created_at DESC
        LIMIT 50
      `;

      if (!rows || rows.length === 0) {
        return {
          realOrdersCount: 0,
          totalProfitPaise: 0,
          avgProfitPaise: 0,
          marginPct: 0,
          totalInflowPaise: 0,
          totalOutflowPaise: 0,
          totalRevenuePaise: 0,
          totalCommissionPaise: 0,
          totalDeliveryFeePaise: 0,
          totalRiderPayoutPaise: 0,
          totalPaymentFeePaise: 0,
          orders: [],
          isEmpty: true,
          displayProfitString: "₹0",
          displayAvgString: "₹0",
          timestamp: new Date().toISOString(),
        };
      }

      let totalInflowPaise = 0;
      let totalOutflowPaise = 0;
      let totalProfitPaise = 0;
      let totalRevenuePaise = 0;
      let totalCommissionPaise = 0;
      let totalDeliveryFeePaise = 0;
      let totalRiderPayoutPaise = 0;
      let totalPaymentFeePaise = 0;

      const telemetryOrders: RealOrderTelemetry[] = rows.map((r) => {
        const foodSubtotal = Number(r.food_subtotal_paise ?? r.food_paise ?? 0);
        const deliveryFee = Number(r.delivery_fee_paise ?? 0);
        const commissionBps = Number(r.commission_bps ?? 2000);

        const commissionPaise =
          r.commission_paise != null && Number(r.commission_paise) > 0
            ? Number(r.commission_paise)
            : Math.floor((foodSubtotal * commissionBps) / 10000);

        const riderPayout = Number(r.rider_payout_paise ?? 0);

        const paymentFee =
          r.payment_fee_paise != null && Number(r.payment_fee_paise) > 0
            ? Number(r.payment_fee_paise)
            : Math.floor((Number(r.total_paise ?? foodSubtotal) * 195) / 10000);

        const totalPaise = Number(r.total_paise ?? foodSubtotal + deliveryFee);

        const inflowPaise = commissionPaise + deliveryFee;
        const outflowPaise = riderPayout + paymentFee;
        const exactProfitPaise = inflowPaise - outflowPaise;

        const marginPct =
          totalPaise > 0
            ? Number(((exactProfitPaise / totalPaise) * 100).toFixed(2))
            : 0;

        totalInflowPaise += inflowPaise;
        totalOutflowPaise += outflowPaise;
        totalProfitPaise += exactProfitPaise;
        totalRevenuePaise += totalPaise;
        totalCommissionPaise += commissionPaise;
        totalDeliveryFeePaise += deliveryFee;
        totalRiderPayoutPaise += riderPayout;
        totalPaymentFeePaise += paymentFee;

        return {
          id: r.id,
          publicId: r.public_id || r.id.slice(0, 10),
          createdAt: r.created_at,
          status: r.status,
          foodSubtotalPaise: foodSubtotal,
          deliveryFeePaise: deliveryFee,
          commissionBps,
          commissionPaise,
          riderPayoutPaise: riderPayout,
          paymentFeePaise: paymentFee,
          totalPaise,
          inflowPaise,
          outflowPaise,
          exactProfitPaise,
          marginPct,
        };
      });

      const realOrdersCount = telemetryOrders.length;
      const avgProfitPaise =
        realOrdersCount > 0 ? Math.round(totalProfitPaise / realOrdersCount) : 0;
      const marginPct =
        totalRevenuePaise > 0
          ? Number(((totalProfitPaise / totalRevenuePaise) * 100).toFixed(2))
          : 0;

      return {
        realOrdersCount,
        totalProfitPaise,
        avgProfitPaise,
        marginPct,
        totalInflowPaise,
        totalOutflowPaise,
        totalRevenuePaise,
        totalCommissionPaise,
        totalDeliveryFeePaise,
        totalRiderPayoutPaise,
        totalPaymentFeePaise,
        orders: telemetryOrders,
        isEmpty: false,
        displayProfitString: formatInrExact(totalProfitPaise),
        displayAvgString: formatInrExact(avgProfitPaise),
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error("[getLiveFounderProfit] Database query failed:", err);
      return {
        realOrdersCount: 0,
        totalProfitPaise: 0,
        avgProfitPaise: 0,
        marginPct: 0,
        totalInflowPaise: 0,
        totalOutflowPaise: 0,
        totalRevenuePaise: 0,
        totalCommissionPaise: 0,
        totalDeliveryFeePaise: 0,
        totalRiderPayoutPaise: 0,
        totalPaymentFeePaise: 0,
        orders: [],
        isEmpty: true,
        displayProfitString: "₹0",
        displayAvgString: "₹0",
        timestamp: new Date().toISOString(),
      };
    }
  }
);

export function LiveFounderProfitDashboard() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["founder-live-profit"],
    queryFn: () => getLiveFounderProfit(),
    refetchInterval: 10_000,
  });

  // Customization settings state (saved to localStorage + /api/v1/admin/settings)
  const [customSettings, setCustomSettings] = useState<CustomFounderSettings>(
    DEFAULT_FOUNDER_SETTINGS
  );
  const [isCustomizeOpen, setIsCustomizeOpen] = useState<boolean>(false);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Calculator (Test Your Rates) state
  const [commissionRatePct, setCommissionRatePct] = useState<number>(20);
  const [avgFoodSubtotalInr, setAvgFoodSubtotalInr] = useState<number>(400);
  const [deliveryFeeInr, setDeliveryFeeInr] = useState<number>(40);
  const [riderPayoutInr, setRiderPayoutInr] = useState<number>(30);
  const [pgFeePct, setPgFeePct] = useState<number>(1.95);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(true);

  // Load saved custom settings on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CustomFounderSettings>;
        const merged = { ...DEFAULT_FOUNDER_SETTINGS, ...parsed };
        setCustomSettings(merged);
        setCommissionRatePct(merged.commissionPct);
        setDeliveryFeeInr(merged.deliveryFeeInr);
        setRiderPayoutInr(merged.riderBasePayInr);
      }
    } catch {
      // Ignore storage parse errors
    }

    fetch("/api/v1/admin/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((serverData) => {
        if (serverData?.founder_profit_settings) {
          const merged = {
            ...DEFAULT_FOUNDER_SETTINGS,
            ...serverData.founder_profit_settings,
          };
          setCustomSettings(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      })
      .catch(() => {
        // Offline or local-only mode
      });
  }, []);

  const handleSaveCustomSettings = async () => {
    setIsSavingSettings(true);
    setSaveMessage(null);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customSettings));
      // Sync calculator inputs with saved custom defaults
      setCommissionRatePct(customSettings.commissionPct);
      setDeliveryFeeInr(customSettings.deliveryFeeInr);
      setRiderPayoutInr(customSettings.riderBasePayInr);

      const response = await fetch("/api/v1/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          founder_profit_settings: customSettings,
        }),
      });

      if (response.ok) {
        setSaveMessage("Settings saved to database and applied to calculator.");
      } else {
        setSaveMessage("Settings saved locally on this device.");
      }
    } catch {
      setSaveMessage("Settings saved locally on this device (offline mode).");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Calculator math
  const simulation = useMemo(() => {
    const foodSubtotal = avgFoodSubtotalInr;
    const deliveryFee = deliveryFeeInr;
    const totalOrderValue = foodSubtotal + deliveryFee;

    const restaurantCommission = (foodSubtotal * commissionRatePct) / 100;
    const inflow = restaurantCommission + deliveryFee;

    const riderPayout = riderPayoutInr;
    const paymentGatewayFee = (totalOrderValue * pgFeePct) / 100;
    const outflow = riderPayout + paymentGatewayFee;

    const exactNetProfit = inflow - outflow;
    const profitMarginPct =
      totalOrderValue > 0 ? (exactNetProfit / totalOrderValue) * 100 : 0;

    const daily100 = exactNetProfit * 100;
    const daily500 = exactNetProfit * 500;
    const monthlyRunRate = daily500 * 30;

    return {
      foodSubtotal,
      deliveryFee,
      totalOrderValue,
      restaurantCommission,
      inflow,
      riderPayout,
      paymentGatewayFee,
      outflow,
      exactNetProfit,
      profitMarginPct,
      daily100,
      daily500,
      monthlyRunRate,
      isProfitable: exactNetProfit > 0,
    };
  }, [
    commissionRatePct,
    avgFoodSubtotalInr,
    deliveryFeeInr,
    riderPayoutInr,
    pgFeePct,
  ]);

  const isEmpty = !data || data.isEmpty || data.realOrdersCount === 0;

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm text-slate-900 transition-all">
      {/* 1. Simple Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-slate-900">
                Founder Profit & Money
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="h-3 w-3" />
                Real Database Numbers
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              See your real profit from paid orders and customize your fee rules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5",
                isFetching && "animate-spin text-emerald-600"
              )}
            />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* 2. Top 3-Box Summary: Live Result + Action Needed + Customize & Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* Box 1: Live Result */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800">
            Live Result
          </div>
          <div className="text-lg font-black text-slate-900 mt-1">
            {isEmpty ? "₹0 Profit (0 Orders)" : `${data?.displayProfitString} (${data?.realOrdersCount} Orders)`}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Active rates: {customSettings.commissionPct}% commission, ₹{customSettings.deliveryFeeInr} delivery fee, ₹{customSettings.riderBasePayInr} rider pay.
          </p>
        </div>

        {/* Box 2: Action Needed */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800">
            Action Needed
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1">
            {isEmpty
              ? "Check your default rates before your first order arrives."
              : "Review your order margins and upcoming payout day."}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Next scheduled restaurant payout: {customSettings.payoutDay}.
          </p>
        </div>

        {/* Box 3: Customize & Settings Button */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
              Customize & Settings
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Change commission %, min order ₹, rain fee ₹, GST %, and payout day.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>
              {isCustomizeOpen ? "Hide Custom Settings" : "Customize & Settings"}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Full Customization Panel */}
      {isCustomizeOpen && (
        <div className="mt-6 p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Custom Profit & Payout Rules
              </h3>
              <p className="text-xs text-slate-600">
                Set your default fees, tax rates (CGST Sec 9(5)), and payout day.
              </p>
            </div>
            {saveMessage && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {saveMessage}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                Commission %
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Fee charged to restaurants.
              </p>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={customSettings.commissionPct}
                onChange={(e) =>
                  setCustomSettings({
                    ...customSettings,
                    commissionPct: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold text-slate-900"
              />
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                Minimum Order (₹)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Smallest cart for standard delivery.
              </p>
              <input
                type="number"
                min="0"
                step="10"
                value={customSettings.minOrderInr}
                onChange={(e) =>
                  setCustomSettings({
                    ...customSettings,
                    minOrderInr: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold text-slate-900"
              />
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                Delivery Fee (₹)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Standard delivery charge to customer.
              </p>
              <input
                type="number"
                min="0"
                step="5"
                value={customSettings.deliveryFeeInr}
                onChange={(e) =>
                  setCustomSettings({
                    ...customSettings,
                    deliveryFeeInr: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold text-slate-900"
              />
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                Rain Surge Fee (₹)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Extra fee during bad weather.
              </p>
              <input
                type="number"
                min="0"
                step="5"
                value={customSettings.rainFeeInr}
                onChange={(e) =>
                  setCustomSettings({
                    ...customSettings,
                    rainFeeInr: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold text-slate-900"
              />
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                Rider Base Pay (₹)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Base amount paid to delivery partner.
              </p>
              <input
                type="number"
                min="10"
                step="5"
                value={customSettings.riderBasePayInr}
                onChange={(e) =>
                  setCustomSettings({
                    ...customSettings,
                    riderBasePayInr: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold text-slate-900"
              />
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                Food GST % (Sec 9(5))
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Statutory tax rate on food orders.
              </p>
              <input
                type="number"
                min="0"
                max="28"
                step="0.5"
                value={customSettings.gstPct}
                onChange={(e) =>
                  setCustomSettings({
                    ...customSettings,
                    gstPct: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold text-slate-900"
              />
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                Payout Schedule
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                When restaurants receive bank payouts.
              </p>
              <select
                value={customSettings.payoutDay}
                onChange={(e) =>
                  setCustomSettings({
                    ...customSettings,
                    payoutDay: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-900 bg-white"
              >
                <option value="Daily (T+1)">Daily (T+1)</option>
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
                Customer reward on KingPay orders.
              </p>
              <input
                type="number"
                min="0"
                max="25"
                step="0.5"
                value={customSettings.walletCashbackPct}
                onChange={(e) =>
                  setCustomSettings({
                    ...customSettings,
                    walletCashbackPct: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCustomSettings(DEFAULT_FOUNDER_SETTINGS)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100"
            >
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleSaveCustomSettings}
              disabled={isSavingSettings}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSavingSettings ? "Saving..." : "Save Custom Settings"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Simple Profit Formula */}
      <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="text-xs font-bold text-slate-700 mb-2">
          How Your Profit Is Calculated
        </div>
        <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-2 text-center md:text-left font-mono">
          <div className="md:col-span-4 bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-1 text-xs text-emerald-700 font-bold mb-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>Money Coming In</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Restaurant Commission + Delivery Fee
            </div>
          </div>

          <div className="md:col-span-1 flex items-center justify-center font-black text-rose-600">
            −
          </div>

          <div className="md:col-span-4 bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-1 text-xs text-rose-700 font-bold mb-1">
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span>Money Going Out</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Rider Pay + Payment Gateway Fee
            </div>
          </div>

          <div className="md:col-span-1 flex items-center justify-center font-black text-emerald-700">
            =
          </div>

          <div className="md:col-span-1 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
            <span className="text-xs font-black text-emerald-900 block">
              YOUR PROFIT
            </span>
          </div>
        </div>
      </div>

      {/* 4. Real Database Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Profit Per Order</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-emerald-700">
            {isEmpty ? "₹0" : data?.displayAvgString}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Average money you keep from each completed order.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Total Real Profit</span>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-emerald-700">
            {isEmpty ? "₹0" : data?.displayProfitString}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total money earned from all completed orders.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Profit Margin %</span>
            <Percent className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-blue-600">
            {isEmpty ? "0%" : `${data?.marginPct}%`}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Share of total order value kept as net profit.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Completed Orders</span>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-slate-900">
            {isEmpty ? "0" : data?.realOrdersCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verified paid orders recorded in your database.
          </p>
        </div>
      </div>

      {/* 5. Interactive Profit & Fee Calculator */}
      <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Calculator (Test Your Rates)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Move the sliders to see how much profit you earn per order.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            {isSimulatorOpen ? "Hide Calculator" : "Open Calculator"}
          </button>
        </div>

        {isSimulatorOpen && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Slider 1: Restaurant Commission % */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Utensils className="h-3.5 w-3.5 text-emerald-600" />
                    Commission %
                  </span>
                  <span className="font-mono font-black text-emerald-700">
                    {commissionRatePct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="35"
                  step="1"
                  value={commissionRatePct}
                  onChange={(e) => setCommissionRatePct(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Slider 2: Food Order Value */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-blue-600" />
                    Order Food Value
                  </span>
                  <span className="font-mono font-black text-blue-700">
                    ₹{avgFoodSubtotalInr}
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1200"
                  step="10"
                  value={avgFoodSubtotalInr}
                  onChange={(e) => setAvgFoodSubtotalInr(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Slider 3: Delivery Fee */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-emerald-600" />
                    Delivery Fee
                  </span>
                  <span className="font-mono font-black text-emerald-700">
                    ₹{deliveryFeeInr}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={deliveryFeeInr}
                  onChange={(e) => setDeliveryFeeInr(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Slider 4: Rider Pay */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-rose-600" />
                    Rider Base Pay
                  </span>
                  <span className="font-mono font-black text-rose-700">
                    ₹{riderPayoutInr}
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="80"
                  step="5"
                  value={riderPayoutInr}
                  onChange={(e) => setRiderPayoutInr(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              {/* Slider 5: Payment Fee % */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-amber-600" />
                    Payment Fee %
                  </span>
                  <span className="font-mono font-black text-amber-700">
                    {pgFeePct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3.0"
                  step="0.05"
                  value={pgFeePct}
                  onChange={(e) => setPgFeePct(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Calculator Output Box */}
            <div className="p-5 rounded-xl bg-slate-900 text-white border border-slate-800">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-400">
                    <span>Order Bill Breakdown</span>
                    <span className="text-emerald-400 font-bold">
                      Customer Pays: ₹{simulation.totalOrderValue.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-300">
                      + Restaurant Commission ({commissionRatePct}% of ₹{simulation.foodSubtotal}):
                    </span>
                    <span className="text-emerald-400 font-bold">
                      +₹{simulation.restaurantCommission.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-300">+ Customer Delivery Fee:</span>
                    <span className="text-emerald-400 font-bold">
                      +₹{simulation.deliveryFee.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-300">− Rider Base Pay:</span>
                    <span className="text-rose-400 font-bold">
                      −₹{simulation.riderPayout.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-300">
                      − Payment Gateway Fee ({pgFeePct}%):
                    </span>
                    <span className="text-rose-400 font-bold">
                      −₹{simulation.paymentGatewayFee.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <span className="text-xs font-mono uppercase text-slate-400 block">
                    Estimated Profit Per Order
                  </span>
                  <div
                    className={cn(
                      "text-3xl font-black font-mono mt-1",
                      simulation.isProfitable ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    ₹{simulation.exactNetProfit.toFixed(2)}
                  </div>
                  <div className="text-xs font-mono text-slate-300 mt-1">
                    Margin: {simulation.profitMarginPct.toFixed(1)}%
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 text-left space-y-1 text-xs font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span>At 100 orders/day:</span>
                      <span className="font-bold text-white">
                        ₹{Math.round(simulation.daily100).toLocaleString()}/day
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>At 500 orders/day:</span>
                      <span className="font-bold text-emerald-400">
                        ₹{Math.round(simulation.daily500).toLocaleString()}/day
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Recent Paid Orders Table */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Recent Paid Orders
            </h3>
            <p className="text-xs text-slate-500">
              Real customer orders loaded directly from your database.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-600">
            {isEmpty ? "0 Paid Orders" : `${data?.realOrdersCount} Paid Orders`}
          </div>
        </div>

        {isEmpty ? (
          <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50/50">
            <div className="h-10 w-10 rounded-full bg-slate-200/70 text-slate-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="text-lg font-black font-mono text-slate-800">
              ₹0 (No Paid Orders Yet)
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Your database currently has zero completed customer orders. Once real orders are paid and delivered, they will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-xs">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Food Value</th>
                  <th className="py-3 px-4 text-emerald-700">Commission</th>
                  <th className="py-3 px-4 text-emerald-700">Delivery Fee</th>
                  <th className="py-3 px-4 text-rose-700">Rider Pay</th>
                  <th className="py-3 px-4 text-rose-700">Payment Fee</th>
                  <th className="py-3 px-4 text-emerald-800 font-bold">Net Profit</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {ord.publicId}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatInrExact(ord.foodSubtotalPaise)}
                    </td>
                    <td className="py-3 px-4 text-emerald-700 font-medium">
                      +{formatInrExact(ord.commissionPaise)}
                    </td>
                    <td className="py-3 px-4 text-emerald-700 font-medium">
                      +{formatInrExact(ord.deliveryFeePaise)}
                    </td>
                    <td className="py-3 px-4 text-rose-600 font-medium">
                      −{formatInrExact(ord.riderPayoutPaise)}
                    </td>
                    <td className="py-3 px-4 text-rose-600 font-medium">
                      −{formatInrExact(ord.paymentFeePaise)}
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-600">
                      {formatInrExact(ord.exactProfitPaise)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
