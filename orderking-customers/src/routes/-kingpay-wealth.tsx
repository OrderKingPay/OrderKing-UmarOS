import React from 'react';
import { Link } from '@tanstack/react-router';

const KingPayWealth = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 sm:p-10 font-sans flex items-center justify-center">
      <div className="max-w-2xl w-full bg-[#141414] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">KingPay Wealth &amp; Treasury</h1>
            <p className="text-xs text-gray-400 mt-1">
              SEBI Investment Adviser / Mutual Fund Distributor Regulatory Disclosure
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Authorization Required
          </span>
        </header>

        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 space-y-2">
          <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
            Requires Regulated SEBI / Bullion Partner Authorization
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            Distribution of mutual fund schemes and execution of investment products in India require registration with the Securities and Exchange Board of India (SEBI) as a Registered Investment Adviser (INA) or AMFI-registered Mutual Fund Distributor (ARN), alongside a certified bullion Assaying &amp; Hallmarking partner for digital gold.
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            No live bullion pricing, vaulting, or mutual fund NAV execution is active on this workspace. No historical or projected fund returns are represented.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link
            to="/king-pay"
            className="px-5 py-2.5 rounded-xl bg-yellow-500 text-black font-bold text-xs hover:bg-yellow-400 transition-colors"
          >
            Return to Canonical /king-pay
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-white/10 text-gray-200 font-semibold text-xs hover:bg-white/15 transition-colors"
          >
            Back to OrderKing Food App
          </Link>
        </div>
      </div>
    </div>
  );
};

export default KingPayWealth;
