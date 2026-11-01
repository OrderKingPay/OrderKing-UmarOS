import React from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ShieldCheck, Zap, ExternalLink, ArrowRight, CheckCircle2, TrendingUp, Gem, Landmark, Sparkles } from 'lucide-react';

export default function KingPayWealth() {
  const handleAugmont = () => window.open('https://www.augmont.com', '_blank');
  const handleMmtc = () => window.open('https://www.mmtcpamp.com', '_blank');
  const handleGroww = () => window.open('https://groww.in/mutual-funds', '_blank');
  const handleZerodha = () => window.open('https://coin.zerodha.com', '_blank');
  const handleRbi = () => window.open('https://rbiretaildirect.org.in', '_blank');

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
            <span>Certified Bullion &amp; SEBI Regulated Partners</span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#141414] to-[#1E1E1E] p-6 sm:p-8 shadow-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Gem className="size-4" /> Digital Gold &amp; Wealth Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            24K Digital Gold &amp; Direct Mutual Funds
          </h1>
          <p className="text-sm text-gray-300 leading-relaxed max-w-xl">
            Accumulate 24K 99.9% pure hallmarked gold backed by insured physical bullion vaults or invest in direct zero-commission mutual fund portfolios through verified market platforms.
          </p>
        </div>

        {/* 24K Gold Partners Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <Sparkles className="size-4 text-amber-400" />
            <span>24K Hallmarked Digital Bullion Partners</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Augmont */}
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/50 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-lg text-white">Augmont Gold For All</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">24K 99.9% Pure</span>
                </div>
                <p className="text-xs text-gray-400">NABL &amp; BIS hallmarked gold stored in IDBI Trusteeship insured physical vaults. Start from ₹10.</p>
                <div className="text-[11px] text-gray-300 space-y-1 pt-2">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-400" /> Real-time live MCX market pricing</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-400" /> Doorstep insured delivery in tamper-proof packaging</div>
                </div>
              </div>
              <button
                onClick={handleAugmont}
                className="w-full py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Buy Gold on Augmont</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>

            {/* MMTC-PAMP */}
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/50 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-lg text-white">MMTC-PAMP</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">LBMA Accredited</span>
                </div>
                <p className="text-xs text-gray-400">India&apos;s only London Bullion Market Association (LBMA) Good Delivery accredited gold refinery.</p>
                <div className="text-[11px] text-gray-300 space-y-1 pt-2">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-400" /> 99.99%+ purity assurance</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-400" /> 100% insured vaulting with Brink&apos;s India</div>
                </div>
              </div>
              <button
                onClick={handleMmtc}
                className="w-full py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Buy Gold on MMTC-PAMP</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>

          </div>
        </div>

        {/* Direct Mutual Funds & Sovereign Bonds */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-400" />
            <span>SEBI-Registered Direct Mutual Funds &amp; RBI Retail Direct</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div
              onClick={handleGroww}
              className="rounded-2xl border border-white/10 bg-[#141414] p-5 space-y-3 hover:border-emerald-500/50 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-white text-sm">Groww Mutual Funds</div>
                <div className="text-xs text-gray-400 mt-1">Zero-commission direct mutual funds &amp; SIP plans with instant UPI mandate.</div>
              </div>
              <div className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <span>Explore on Groww</span>
                <ExternalLink className="size-3" />
              </div>
            </div>

            <div
              onClick={handleZerodha}
              className="rounded-2xl border border-white/10 bg-[#141414] p-5 space-y-3 hover:border-emerald-500/50 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-white text-sm">Zerodha Coin</div>
                <div className="text-xs text-gray-400 mt-1">Direct mutual fund investment held seamlessly in demat format.</div>
              </div>
              <div className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <span>Explore on Coin</span>
                <ExternalLink className="size-3" />
              </div>
            </div>

            <div
              onClick={handleRbi}
              className="rounded-2xl border border-white/10 bg-[#141414] p-5 space-y-3 hover:border-emerald-500/50 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-white text-sm">RBI Retail Direct</div>
                <div className="text-xs text-gray-400 mt-1">Sovereign Gold Bonds (SGB) and Treasury Bills directly from the Reserve Bank of India.</div>
              </div>
              <div className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <span>Open RBI Portal</span>
                <ExternalLink className="size-3" />
              </div>
            </div>

          </div>
        </div>

        {/* Regulatory Disclosure */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-2 text-xs text-gray-400 leading-relaxed">
          <div className="flex items-center gap-2 text-gray-300 font-bold">
            <Landmark className="size-4 text-emerald-400" />
            <span>SEBI &amp; Bullion Statutory Regulatory Disclosure</span>
          </div>
          <p>
            Digital gold transactions are cleared directly by BIS-recognized bullion assaying and hallmarking partners (Augmont / MMTC-PAMP) and secured in custodian vaults with independent security trusteeship. Mutual fund schemes are subject to market risks. Read all scheme-related documents carefully. Direct investment execution is completed on SEBI-registered Registered Investment Adviser (RIA) or Stock Broker portals.
          </p>
        </div>

      </div>
    </div>
  );
}
