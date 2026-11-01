import React from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ShieldCheck, Zap, ExternalLink, ArrowRight, CheckCircle2, Car, Train, CreditCard } from 'lucide-react';

export default function KingPayTransit() {
  const metroPortals = [
    { name: "Delhi Metro (DMRC)", url: "https://www.dmrcsmartcard.com", city: "Delhi NCR" },
    { name: "Mumbai Metro (OneCard)", url: "https://www.reliancemumbaimetro.com/instacharge.aspx", city: "Mumbai" },
    { name: "Chennai Metro (CMRL)", url: "https://chennaimetrorail.org", city: "Chennai" },
    { name: "Namma Metro (BMRCL)", url: "https://english.bmrc.co.in", city: "Bengaluru" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link
            to="/kingpay"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="size-4" />
            <span>Back to KingPay Hub</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="size-3.5" />
            <span>NPCI NETC &amp; Bharat BillPay Active</span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#141414] to-[#1E1E1E] p-6 sm:p-8 shadow-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Car className="size-4" /> Transit &amp; National Mobility
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            FASTag &amp; Metro Transit Hub
          </h1>
          <p className="text-sm text-gray-300 leading-relaxed max-w-xl">
            Recharge any issuer NETC FASTag instantly via Bharat BillPay (BBPS) or top-up your RuPay National Common Mobility Card (NCMC) for seamless metro travel across India.
          </p>
        </div>

        {/* Primary FASTag Card */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white">NETC FASTag Instant Recharge</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">BBPS Active</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed max-w-lg">
              Supports all 38+ FASTag issuer banks including SBI, ICICI, HDFC, Axis, IDFC FIRST, Kotak, and Bank of Baroda. Instant toll balance credit.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-300 pt-1">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-400" /> Instant toll plaza sync</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-400" /> Zero convenience fee</span>
            </div>
          </div>
          <Link
            to="/kingpay-bbps"
            search={{ category: "fastag" }}
            className="px-6 py-3.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shrink-0 no-underline"
          >
            <span>Recharge FASTag Now</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Metro Transit Portals */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <Train className="size-4 text-amber-400" />
            <span>Official Metro Smart Card &amp; NCMC Portals</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metroPortals.map((m) => (
              <div
                key={m.name}
                className="rounded-2xl border border-white/10 bg-[#141414] p-5 flex items-center justify-between hover:border-emerald-500/50 transition cursor-pointer"
                onClick={() => window.open(m.url, '_blank')}
              >
                <div>
                  <div className="font-bold text-white text-sm">{m.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{m.city} · Official Card Recharge</div>
                </div>
                <div className="text-emerald-400 bg-emerald-500/10 p-2 rounded-xl">
                  <ExternalLink className="size-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NCMC Regulatory Disclosure */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-2 text-xs text-gray-400 leading-relaxed">
          <div className="flex items-center gap-2 text-gray-300 font-bold">
            <CreditCard className="size-4 text-emerald-400" />
            <span>National Electronic Toll &amp; Mobility Compliance</span>
          </div>
          <p>
            FASTag recharges are processed through Bharat Bill Payment System (BBPS) certified transaction clearing. RuPay NCMC offline smart card balances require NFC chip validation at official transit authority terminal tap points in accordance with Ministry of Housing and Urban Affairs (MoHUA) mobility specifications.
          </p>
        </div>

      </div>
    </div>
  );
}
