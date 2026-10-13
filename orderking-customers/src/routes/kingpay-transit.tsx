import React from 'react';
import { Link } from '@tanstack/react-router';

export default function KingPayTransit() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 sm:p-10 font-sans flex items-center justify-center">
      <div className="max-w-2xl w-full bg-[#141414] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              KingPay Transit (NETC FASTag &amp; NCMC)
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              National Electronic Toll Collection &amp; National Common Mobility Card Disclosure
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Integration Pending
          </span>
        </header>

        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 space-y-2">
          <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
            Requires Regulated Transit Partner Authorization
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            Live NETC FASTag vehicle tag recharges and RuPay NCMC (National Common Mobility Card) offline balance top-ups require certified NPCI NETC acquirer/issuer bank connectivity and transit authority clearing integration.
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            No vehicle registration numbers or NCMC card numbers are accepted or processed on this route. Please use your issuing bank portal or canonical KingPay for food order checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-2xl bg-[#1A1A1A] border border-white/5 p-4 space-y-1">
            <span className="font-bold text-gray-200 block">NPCI NETC FASTag</span>
            <span className="text-amber-400 font-medium block">Status: Issuer Bank API Pending</span>
            <p className="text-gray-400">Requires live Bharat BillPay / NETC tag validation endpoint.</p>
          </div>
          <div className="rounded-2xl bg-[#1A1A1A] border border-white/5 p-4 space-y-1">
            <span className="font-bold text-gray-200 block">RuPay NCMC Metro Card</span>
            <span className="text-amber-400 font-medium block">Status: AFC Transit Host Pending</span>
            <p className="text-gray-400">Requires certified Automated Fare Collection (AFC) top-up gateway.</p>
          </div>
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
