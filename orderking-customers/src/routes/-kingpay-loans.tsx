import React from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ShieldCheck, Zap, ExternalLink, ArrowRight, CheckCircle2, Building2, TrendingUp, CreditCard } from 'lucide-react';

export default function KingPayLoans() {
  const handleNavi = () => window.open('https://navi.com/personal-loan?utm_source=orderking_pay', '_blank');
  const handleKreditBee = () => window.open('https://www.kreditbee.in/?utm_source=orderking_pay', '_blank');
  const handleMoneyView = () => window.open('https://moneyview.in/personal-loans?utm_source=orderking_pay', '_blank');
  const handleExperian = () => window.open('https://www.experian.in/consumer/free-credit-score', '_blank');

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
            <span>RBI-Regulated NBFC Partners</span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#141414] to-[#1E1E1E] p-6 sm:p-8 shadow-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="size-4" /> Instant Credit &amp; Micro-Lending
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Pre-Approved Personal Loans &amp; Credit
          </h1>
          <p className="text-sm text-gray-300 leading-relaxed max-w-xl">
            Compare pre-approved loan offers from licensed NBFC partners. 100% paperless processing with direct bank account disbursal in minutes.
          </p>
        </div>

        {/* Free Credit Score Check Strip */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <TrendingUp className="size-4" />
              <span>Free CIBIL / Experian Credit Score</span>
            </div>
            <p className="text-xs text-gray-400">
              Check your real-time credit score. Monthly refresh without impacting score.
            </p>
          </div>
          <button
            onClick={handleExperian}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
          >
            <span>Check Free Score</span>
            <ExternalLink className="size-3.5" />
          </button>
        </div>

        {/* Partner Offer Cards */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Licensed Lending Partners
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Navi */}
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-lg text-white">Navi</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">RBI Regulated</span>
                </div>
                <div className="text-2xl font-black text-emerald-400">Up to ₹20 L</div>
                <p className="text-xs text-gray-400">Interest from 9.9% p.a. Flexible tenure up to 72 months.</p>
                <div className="text-[11px] text-gray-300 space-y-1 pt-2">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-400" /> Disbursal in 5 mins</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-400" /> Zero paperwork</div>
                </div>
              </div>
              <button
                onClick={handleNavi}
                className="w-full py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Apply on Navi</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>

            {/* KreditBee */}
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-lg text-white">KreditBee</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">RBI Regulated</span>
                </div>
                <div className="text-2xl font-black text-emerald-400">Up to ₹4 L</div>
                <p className="text-xs text-gray-400">Quick personal loans for salaried and self-employed professionals.</p>
                <div className="text-[11px] text-gray-300 space-y-1 pt-2">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-400" /> Instant PAN &amp; Aadhaar KYC</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-400" /> Direct UPI / Bank Transfer</div>
                </div>
              </div>
              <button
                onClick={handleKreditBee}
                className="w-full py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Apply on KreditBee</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>

            {/* MoneyView */}
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-lg text-white">MoneyView</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">RBI Regulated</span>
                </div>
                <div className="text-2xl font-black text-emerald-400">Up to ₹5 L</div>
                <p className="text-xs text-gray-400">Customized loan amounts and affordable monthly installment plans.</p>
                <div className="text-[11px] text-gray-300 space-y-1 pt-2">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-400" /> Approval in 2 mins</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-400" /> 100% digital process</div>
                </div>
              </div>
              <button
                onClick={handleMoneyView}
                className="w-full py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Apply on MoneyView</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>

          </div>
        </div>

        {/* Statutory Regulatory Disclosure */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-2 text-xs text-gray-400 leading-relaxed">
          <div className="flex items-center gap-2 text-gray-300 font-bold">
            <Building2 className="size-4 text-emerald-400" />
            <span>Statutory Lending Disclosure</span>
          </div>
          <p>
            Digital lending services are facilitated through RBI-registered Non-Banking Financial Companies (NBFCs) and Scheduled Commercial Banks. Key Fact Statements (KFS), APR disclosures, and loan contracts are issued directly by the respective regulated lending entity in strict compliance with the Reserve Bank of India (RBI) Digital Lending Guidelines.
          </p>
        </div>

      </div>
    </div>
  );
}
