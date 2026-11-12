/**
 * Out-of-Coverage Graceful Fallback & KingPay Revenue Hub (out-of-coverage-kingpay-fallback.tsx)
 * Entity: Orderkingpay | GSTIN: 18AFXPH9838M1Z9 (Assam - 788710)
 * Strict Invariant: Displays the exact single-line notice and immediately renders the 5-pillar KingPay revenue grid.
 */

import React, { useState } from 'react';
import {
  MANDATORY_OUT_OF_COVERAGE_NOTICE,
  TOP_CACHED_FLIGHT_CORRIDORS,
  PLACEMENT_EDTECH_OFFERS,
  type DomesticFlightCorridor,
  type EdTechCourseOffer,
} from './out-of-coverage-kingpay-constants.js';

export {
  MANDATORY_OUT_OF_COVERAGE_NOTICE,
  TOP_CACHED_FLIGHT_CORRIDORS,
  PLACEMENT_EDTECH_OFFERS,
  type DomesticFlightCorridor,
  type EdTechCourseOffer,
};

export interface OutOfCoverageProps {
  detectedPincode?: string;
  detectedCity?: string;
  onSelectService?: (serviceCategory: string, payload: Record<string, unknown>) => void;
}

export const OutOfCoverageKingPayFallback: React.FC<OutOfCoverageProps> = ({
  detectedPincode = '788710',
  detectedCity = 'Karimganj, Assam',
  onSelectService,
}) => {
  const [selectedCorridor, setSelectedCorridor] = useState<DomesticFlightCorridor>(TOP_CACHED_FLIGHT_CORRIDORS[0]);
  const [billerNumber, setBillerNumber] = useState<string>('');
  const [billerCategory, setBillerCategory] = useState<'ELECTRICITY' | 'FASTAG' | 'DTH' | 'BROADBAND'>('ELECTRICITY');
  const [vehicleRegNo, setVehicleRegNo] = useState<string>('AS-10-E-4821');

  const formatInrFromPaise = (paise: number): string => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <section
      aria-label="KingPay Instant Services Hub"
      className="w-full max-w-6xl mx-auto p-6 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-xl"
    >
      {/* Strict Single-Line Out-of-Coverage Notice */}
      <div
        data-testid="out-of-coverage-banner"
        className="w-full px-4 py-2.5 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-medium flex items-center justify-between flex-wrap gap-2"
      >
        <span>{MANDATORY_OUT_OF_COVERAGE_NOTICE}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-amber-300/80 whitespace-nowrap">
            {detectedCity} ({detectedPincode})
          </span>
          <button
            type="button"
            onClick={() => onSelectService?.('LOCATION_UPDATE', {})}
            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-semibold border border-amber-500/40 transition-colors"
          >
            Update Location
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Travel & Flight Booking Engine (TBO API + Travelpayouts WL 23797 / Marker 794122) */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                TBO + Travelpayouts WL #23797
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                KV Cache {selectedCorridor.kvCacheLatencyMs}ms
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Instant Flights & IRCTC Rail Hub</h3>
            <p className="text-xs text-slate-400 mb-4">
              Marker ID: 794122 · Transparent convenience fee (₹399 Domestic / ₹1,299 International)
            </p>

            <label className="block text-xs text-slate-300 mb-1">Select Top 50 Cached Corridor</label>
            <select
              aria-label="Flight Corridor"
              value={selectedCorridor.corridorCode}
              onChange={(e) => {
                const found = TOP_CACHED_FLIGHT_CORRIDORS.find((c) => c.corridorCode === e.target.value);
                if (found) setSelectedCorridor(found);
              }}
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white mb-3"
            >
              {TOP_CACHED_FLIGHT_CORRIDORS.map((c) => (
                <option key={c.corridorCode} value={c.corridorCode}>
                  {c.originCity} ({c.originIata}) to {c.destinationCity} ({c.destinationIata})
                </option>
              ))}
            </select>

            <div className="text-xs space-y-1 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Base Airline Tariff:</span>
                <span>{formatInrFromPaise(selectedCorridor.baseFarePaise)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">KingPay Convenience Fee:</span>
                <span>{formatInrFromPaise(selectedCorridor.convenienceFeePaise)}</span>
              </div>
              <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
                <span>Total Payable:</span>
                <span>
                  {formatInrFromPaise(selectedCorridor.baseFarePaise + selectedCorridor.convenienceFeePaise)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onSelectService?.('FLIGHT_BOOKING', {
                corridor: selectedCorridor.corridorCode,
                wlId: '23797',
                markerId: '794122',
                totalPaise: selectedCorridor.baseFarePaise + selectedCorridor.convenienceFeePaise,
              })
            }
            className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition"
          >
            Lock Fare & Issue PNR
          </button>
        </div>

        {/* 2. BBPS Utilities, DTH, Broadband & FASTag Recharge */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block mb-2">
              NPCI Bharat BillPay (BBPS) Live
            </span>
            <h3 className="text-lg font-bold text-white mb-1">Utilities, FASTag & Soundbox</h3>
            <p className="text-xs text-slate-400 mb-4">
              APDCL Electricity, NHAI FASTag, DTH, Broadband & Multilingual KingPay Soundbox Subscription.
            </p>

            <div className="flex gap-1.5 mb-3">
              {(['ELECTRICITY', 'FASTAG', 'DTH', 'BROADBAND'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setBillerCategory(cat)}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${billerCategory === cat ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={billerNumber}
              onChange={(e) => setBillerNumber(e.target.value)}
              placeholder={billerCategory === 'FASTAG' ? 'Enter Vehicle Reg (e.g., AS10E4821)' : 'Consumer / Account No.'}
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white mb-4"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              onSelectService?.('BBPS_UTILITY', {
                category: billerCategory,
                consumerId: billerNumber || 'APDCL-788710',
              })
            }
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition"
          >
            Fetch Exact Bill & Pay via UPI
          </button>
        </div>

        {/* 3. Placement-Linked EdTech Courses */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 block mb-2">
              Career Accelerator | Placement Support
            </span>
            <h3 className="text-lg font-bold text-white mb-1">Skill & Placement Programs</h3>
            <p className="text-xs text-slate-400 mb-4">
              Verified placement-linked cohorts with instant scholarship credit (Affiliate payout ₹2,500–₹7,500).
            </p>

            <div className="space-y-2.5 mb-4">
              {PLACEMENT_EDTECH_OFFERS.map((offer) => (
                <div
                  key={offer.courseId}
                  className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs"
                >
                  <div className="font-semibold text-white">{offer.title}</div>
                  <div className="text-emerald-400 mt-0.5">{offer.placementGuaranteeLabel}</div>
                  <div className="flex justify-between text-slate-400 mt-1">
                    <span>Fee: {formatInrFromPaise(offer.courseFeePaise)}</span>
                    <span>Partner Credit: {formatInrFromPaise(offer.affiliateCommissionPaise)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onSelectService?.('EDTECH_ENROLLMENT', {
                courseId: PLACEMENT_EDTECH_OFFERS[0].courseId,
                affiliateCommissionPaise: PLACEMENT_EDTECH_OFFERS[0].affiliateCommissionPaise,
              })
            }
            className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition"
          >
            Claim Counseling & Placement Slot
          </button>
        </div>

        {/* 4. Hyperlocal Gig Shifts */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-2">
              Instant Daily Payouts · Zero Joining Fee
            </span>
            <h3 className="text-lg font-bold text-white mb-1">Hyperlocal Gig Shifts & Fleet</h3>
            <p className="text-xs text-slate-400 mb-3">
              Book verified 4-hour micro-shifts for parcel drop, merchant onboarding, or Soundbox deployment.
            </p>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Day Shift (06:00–18:00 IST):</span>
                <span className="text-white font-semibold">₹650 Base Payout + Incentives</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Evening Shift (18:00–23:00 IST):</span>
                <span className="text-white font-semibold">₹500 Base Payout + Rain Surge</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectService?.('GIG_SHIFT_BOOKING', { pincode: detectedPincode })}
            className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition"
          >
            Activate Rider / Gig Shift Now
          </button>
        </div>

        {/* 5. 24x7 Roadside Assistance (RSA) & Two-Wheeler Insurance */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between md:col-span-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 block mb-2">
              IRDAI-Compliant Partner Cover & 24x7 Highway RSA
            </span>
            <h3 className="text-lg font-bold text-white mb-1">
              24x7 Roadside Assistance & Instant Two-Wheeler / Commercial Insurance
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Emergency flat-tyre, battery jumpstart, fuel delivery & zero-depreciation bike/commercial policy issuance in 90 seconds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <input
                type="text"
                value={vehicleRegNo}
                onChange={(e) => setVehicleRegNo(e.target.value)}
                placeholder="Vehicle Registration No. (e.g., AS-10-E-4821)"
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
              />
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-400">Annual RSA + Personal Accident Cover:</span>
                <span className="text-emerald-400 font-bold">₹499.00 / yr</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onSelectService?.('RSA_INSURANCE_DISPATCH', {
                vehicleRegNo,
                planPaise: 49900,
              })
            }
            className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition"
          >
            Dispatch 24x7 RSA Patrol / Issue Instant Policy
          </button>
        </div>
      </div>
    </section>
  );
};

export default OutOfCoverageKingPayFallback;
