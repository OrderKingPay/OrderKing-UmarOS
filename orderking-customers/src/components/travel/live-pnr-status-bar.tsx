import React, { useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface PnrPassenger {
  seatNumber: string;
  bookingStatus: string;
  currentStatus: string;
  confirmationProbabilityPct?: number;
}

export interface PnrLookupResponse {
  pnrNumber: string;
  mode: 'TRAIN' | 'FLIGHT';
  carrierName: string;
  carrierNumber: string;
  originCode: string;
  originName: string;
  destinationCode: string;
  destinationName: string;
  departureTimeIso: string;
  arrivalTimeIso: string;
  chartPrepared: boolean;
  platformOrGate?: string;
  coachPosition?: string;
  passengers: PnrPassenger[];
}

export interface LivePnrStatusBarProps {
  supabaseClient?: SupabaseClient;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  userId?: string;
  defaultConvenienceFeeInr?: number;
  defaultCashbackInr?: number;
  onCheckoutSuccess?: (orderId: string, pnr: string) => void;
  className?: string;
}

const TRAIN_PNR_REGEX = /^\d{10}$/;
const FLIGHT_PNR_REGEX = /^[A-Z0-9]{6}$/;

export const LivePnrStatusBar: React.FC<LivePnrStatusBarProps> = ({
  supabaseClient,
  supabaseUrl,
  supabaseAnonKey,
  userId,
  defaultConvenienceFeeInr = 29,
  defaultCashbackInr = 5,
  onCheckoutSuccess,
  className = "",
}) => {
  const [pnrInput, setPnrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pnrData, setPnrData] = useState<PnrLookupResponse | null>(null);
  const [convenienceFeeInr, setConvenienceFeeInr] = useState<number>(defaultConvenienceFeeInr);
  const [cashbackInr, setCashbackInr] = useState<number>(defaultCashbackInr);
  const [paymentRail, setPaymentRail] = useState<'UPI_FAST' | 'KINGPAY_WALLET'>('UPI_FAST');
  const [paidOrderId, setPaidOrderId] = useState<string | null>(null);

  const getSupabase = (): SupabaseClient | null => {
    if (supabaseClient) return supabaseClient;
    const url = supabaseUrl || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL);
    const key = supabaseAnonKey || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY);
    if (url && key && String(url).startsWith('https://') && !String(url).includes('unconfigured')) {
      try {
        return createClient(url, key);
      } catch {
        return null;
      }
    }
    return null;
  };

  // Sync live founder convenience fee & cashback from umar_os_config
  useEffect(() => {
    const sb = getSupabase();
    if (!sb || typeof sb.from !== 'function') return;

    let active = true;
    sb.from('umar_os_config')
      .select('value')
      .eq('key', 'founder_fees')
      .single()
      .then(({ data }) => {
        if (!active || !data?.value) return;
        const fees = data.value as Record<string, number>;
        if (typeof fees.travel_pnr_convenience_fee_inr === 'number') {
          setConvenienceFeeInr(fees.travel_pnr_convenience_fee_inr);
        }
        if (typeof fees.wallet_cashback_reward_inr === 'number') {
          setCashbackInr(fees.wallet_cashback_reward_inr);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const sanitizePnr = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

  const detectMode = (cleanPnr: string): 'TRAIN' | 'FLIGHT' | null => {
    if (TRAIN_PNR_REGEX.test(cleanPnr)) return 'TRAIN';
    if (FLIGHT_PNR_REGEX.test(cleanPnr)) return 'FLIGHT';
    return null;
  };

  const handlePnrLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPaidOrderId(null);

    const cleanPnr = sanitizePnr(pnrInput);
    const mode = detectMode(cleanPnr);

    if (!mode) {
      setErrorMsg('Enter a valid 10-digit Train PNR or 6-character Flight PNR.');
      return;
    }

    setLoading(true);
    try {
      const sb = getSupabase();
      if (!sb) {
        throw new Error('Supabase client is not configured. Check VITE_SUPABASE_URL.');
      }

      // 1. Try Edge Function live carrier gateway first
      const { data: fnData, error: fnError } = await sb.functions.invoke<PnrLookupResponse>('travel-pnr-status', {
        body: { pnrNumber: cleanPnr, mode },
      });

      if (!fnError && fnData && fnData.pnrNumber) {
        setPnrData(fnData);
        setLoading(false);
        return;
      }

      // 2. Fallback to cached/synced pnr_live_cache table in Supabase
      const { data: row, error: dbErr } = await sb
        .from('pnr_live_cache')
        .select('*')
        .eq('pnr_number', cleanPnr)
        .single();

      if (dbErr || !row) {
        throw new Error('Live PNR not found or carrier gateway timed out. Verify your PNR number.');
      }

      setPnrData({
        pnrNumber: row.pnr_number,
        mode: row.mode,
        carrierName: row.carrier_name,
        carrierNumber: row.carrier_number,
        originCode: row.origin_code,
        originName: row.origin_name,
        destinationCode: row.destination_code,
        destinationName: row.destination_name,
        departureTimeIso: row.departure_time_iso,
        arrivalTimeIso: row.arrival_time_iso,
        chartPrepared: Boolean(row.chart_prepared),
        platformOrGate: row.platform_or_gate ?? undefined,
        coachPosition: row.coach_position ?? undefined,
        passengers: Array.isArray(row.passengers) ? row.passengers : [],
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to fetch PNR status.');
      setPnrData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConvenienceFeeCheckout = async () => {
    if (!pnrData) return;
    setCheckoutLoading(true);
    setErrorMsg(null);

    try {
      const sb = getSupabase();
      if (!sb) throw new Error('Database connection unavailable.');

      const payload = {
        user_id: userId ?? null,
        pnr_number: pnrData.pnrNumber,
        travel_mode: pnrData.mode,
        carrier_number: pnrData.carrierNumber,
        route_summary: `${pnrData.originCode} → ${pnrData.destinationCode}`,
        convenience_fee_inr: convenienceFeeInr,
        cashback_credited_inr: cashbackInr,
        payment_rail: paymentRail,
        status: 'ACTIVE_MONITORING',
        passenger_snapshot: pnrData.passengers,
      };

      const { data, error } = await sb
        .from('travel_pnr_checkouts')
        .insert(payload)
        .select('id')
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Payment ledger write failed.');
      }

      setPaidOrderId(data.id);
      if (onCheckoutSuccess) {
        onCheckoutSuccess(data.id, pnrData.pnrNumber);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Checkout failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className={`w-full rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-xs ${className}`}>
      <div className="w-full space-y-2.5">
        {/* Compact Executive PNR Strip */}
        <form onSubmit={handlePnrLookup} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex size-8 items-center justify-center rounded-xl bg-sky-100 text-sky-800 text-sm">
              🎫
            </span>
            <div>
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                Live PNR Status
              </span>
              <span className="text-[10px] text-slate-500 font-medium hidden sm:block">
                IRCTC Rail (10 Digits) &amp; Airline (6 Chars)
              </span>
            </div>
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              value={pnrInput}
              onChange={(e) => setPnrInput(sanitizePnr(e.target.value))}
              placeholder="Enter 10-digit Train PNR or 6-char Airline PNR (e.g. 2458910342 or AB12CD)"
              aria-label="PNR Number"
              className="w-full h-10 pl-3 pr-20 text-xs font-mono font-bold tracking-wider text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-sky-500 transition"
            />
            {pnrInput.length > 0 && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                {detectMode(pnrInput) ?? `${pnrInput.length}/10`}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-10 px-4 bg-slate-900 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-black rounded-xl whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            {loading ? "Checking..." : "Check Live PNR ➔"}
          </button>
        </form>

        {/* Inline Error Feedback */}
        {errorMsg && (
          <div className="text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 rounded px-2.5 py-1">
            {errorMsg}
          </div>
        )}

        {/* Live PNR Result & Convenience Fee Checkout Drawer */}
        {pnrData && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <div>
                <span className="font-extrabold text-slate-900">
                  {pnrData.carrierNumber} • {pnrData.carrierName}
                </span>
                <span className="ml-2 text-[11px] font-semibold text-slate-600">
                  {pnrData.originCode} → {pnrData.destinationCode}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  pnrData.chartPrepared ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {pnrData.chartPrepared ? 'CHART PREPARED' : 'LIVE TRACKING'}
              </span>
            </div>

            {/* Passenger Status Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {pnrData.passengers.map((p, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded px-2 py-1 flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Pax {idx + 1}: {p.currentStatus}</span>
                  {typeof p.confirmationProbabilityPct === 'number' && (
                    <span className="text-[10px] font-bold text-emerald-700">{p.confirmationProbabilityPct}% CNF</span>
                  )}
                </div>
              ))}
              {pnrData.platformOrGate && (
                <div className="bg-white border border-slate-200 rounded px-2 py-1 font-bold text-slate-800">
                  {pnrData.mode === 'TRAIN' ? 'Platform' : 'Gate'}: {pnrData.platformOrGate}
                </div>
              )}
              {pnrData.coachPosition && (
                <div className="bg-white border border-slate-200 rounded px-2 py-1 font-bold text-slate-800">
                  Coach Pos: {pnrData.coachPosition}
                </div>
              )}
            </div>

            {/* Monetized Convenience Fee Checkout Strip */}
            {paidOrderId ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded px-2.5 py-1.5 text-emerald-900 font-bold">
                <span>
                  ✓ Live SMS/WhatsApp PNR Alerts & Coach/Gate Sync Active (Saved to My Trips)
                </span>
                <span className="text-[11px] bg-emerald-700 text-white px-2 py-0.5 rounded">
                  +₹{cashbackInr} KingPay Cashback Added
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 text-white rounded-md p-2">
                <div className="space-y-0.5">
                  <div className="font-bold text-xs text-amber-400">
                    Activate Instant WhatsApp/SMS PNR Alerts, Coach Position & WL Auto-Sync
                  </div>
                  <div className="text-[10px] text-slate-300">
                    Service & Convenience Fee: ₹{convenienceFeeInr} • Get ₹{cashbackInr} instant KingPay Wallet cashback
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={paymentRail}
                    onChange={(e) => setPaymentRail(e.target.value as 'UPI_FAST' | 'KINGPAY_WALLET')}
                    className="h-8 bg-slate-800 border border-slate-700 text-white text-[11px] font-semibold rounded px-2"
                  >
                    <option value="UPI_FAST">Fast UPI</option>
                    <option value="KINGPAY_WALLET">KingPay Wallet</option>
                  </select>
                  <button
                    type="button"
                    disabled={checkoutLoading}
                    onClick={handleConvenienceFeeCheckout}
                    className="h-8 px-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded whitespace-nowrap"
                  >
                    {checkoutLoading ? 'Processing...' : `Pay ₹${convenienceFeeInr} & Sync to My Trips`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const PnrLiveStatusBar = LivePnrStatusBar;
export default LivePnrStatusBar;
