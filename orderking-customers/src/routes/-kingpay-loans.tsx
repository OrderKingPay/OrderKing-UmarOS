import React from 'react';
import { Link } from '@tanstack/react-router';

export default function KingPayLoans() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 sm:p-10 font-sans flex items-center justify-center">
      <div className="max-w-xl w-full bg-[#141414] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">KingPay Credit &amp; Lending</h1>
            <p className="text-xs text-gray-400 mt-1">Digital Lending Regulatory Disclosure</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Partner Pending
          </span>
        </div>

        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 space-y-2">
          <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
            Requires Regulated NBFC / RBI Partner Authorization
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            In compliance with the Reserve Bank of India (RBI) Digital Lending Guidelines, credit origination, Key Fact Statements (KFS), and loan disbursals must be executed directly by an RBI-registered Commercial Bank or Non-Banking Financial Company (NBFC).
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            OrderKing does not currently have an active Lending Service Provider (LSP) or regulated NBFC co-lending integration enabled on this workspace. No credit applications, KYC records, or loan quotes are generated here.
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
}
