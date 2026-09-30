
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Landmark, FileText, CheckCircle2, ChevronRight, Coins, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { OrderKingMark } from "@/components/brand/wordmark";

export const Route = createFileRoute("/news")({
  component: GovtSchemesNewsModule,
});

const SCHEMES = [
  {
    id: "pm-kisan",
    title: "PM-KISAN Samman Nidhi",
    category: "Agriculture / Financial",
    description: "Financial benefit of Rs 6,000 per year given to all landholding farmer families across the country.",
    amount: "₹6,000 / Year",
    eligible: "Farmers",
    link: "https://pmkisan.gov.in/",
  },
  {
    id: "pm-awwas",
    title: "Pradhan Mantri Awas Yojana (PMAY)",
    category: "Housing",
    description: "Credit-linked subsidy scheme for affordable housing. Up to 2.67 lakh subsidy on home loans.",
    amount: "Up to ₹2.67 Lakhs",
    eligible: "EWS/LIG/MIG",
    link: "https://pmaymis.gov.in/",
  },
  {
    id: "ayushman",
    title: "Ayushman Bharat PM-JAY",
    category: "Healthcare",
    description: "World's largest health insurance/assurance scheme fully financed by the government. Free treatment up to 5 lakhs.",
    amount: "₹5,000,000 Insurance",
    eligible: "Poor & Vulnerable Families",
    link: "https://pmjay.gov.in/",
  },
  {
    id: "mudra",
    title: "PM MUDRA Yojana (PMMY)",
    category: "Business Loans",
    description: "Loans up to 10 lakhs for micro-units and non-corporate small business sector. No collateral required.",
    amount: "Up to ₹10 Lakhs",
    eligible: "Small Businesses",
    link: "https://www.mudra.org.in/",
  },
  {
    id: "ujjwala",
    title: "PM Ujjwala Yojana (PMUY)",
    category: "Energy / Welfare",
    description: "Deposit-free LPG connections given to women from Below Poverty Line (BPL) households.",
    amount: "Free LPG Connection",
    eligible: "BPL Women",
    link: "https://www.pmuy.gov.in/",
  }
];

function GovtSchemesNewsModule() {
  return (
    <CustomerShell>
      <div className="flex flex-col min-h-screen bg-slate-50 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between bg-white/80 px-4 py-3 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link to="/" className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200">
              <ArrowLeft className="size-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Landmark className="size-5 text-emerald-600" />
              <h1 className="font-display text-lg font-black tracking-tight text-slate-800 leading-none">
                Govt Schemes
              </h1>
            </div>
          </div>
          <OrderKingMark className="size-7" />
        </div>

        {/* Hero Section */}
        <div className="bg-emerald-600 px-4 py-8 text-white text-center shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_0%,transparent_100%)]"></div>
          <ShieldCheck className="size-12 mx-auto mb-3 text-emerald-200 opacity-90" />
          <h2 className="text-2xl font-black mb-2 relative z-10 drop-shadow-md">Verified Govt Benefits</h2>
          <p className="text-emerald-100 text-sm font-medium relative z-10 mb-2">
            Real schemes, real grants, real benefits. Discover what you are eligible for today.
          </p>
          <div className="inline-flex items-center gap-1 bg-emerald-800/40 border border-emerald-500/30 px-3 py-1 rounded-full relative z-10 mt-2">
            <CheckCircle2 className="size-3 text-emerald-300" />
            <span className="text-[10px] font-bold text-emerald-50 uppercase tracking-widest">100% Authentic & Audited</span>
          </div>
        </div>

        {/* Schemes List */}
        <div className="p-4 space-y-4">
          {SCHEMES.map((scheme) => (
            <div key={scheme.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg border-b border-l border-emerald-100">
                {scheme.category}
              </div>
              
              <h3 className="font-black text-slate-800 text-lg mb-1 pr-24 leading-tight">{scheme.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{scheme.description}</p>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex items-center gap-2">
                  <Coins className="size-4 text-amber-500" />
                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Benefit</div>
                    <div className="text-xs font-black text-slate-800">{scheme.amount}</div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Eligibility</div>
                    <div className="text-xs font-black text-slate-800">{scheme.eligible}</div>
                  </div>
                </div>
              </div>

              <a 
                href={scheme.link}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl py-3 font-bold text-sm hover:bg-slate-800 transition shadow-sm"
              >
                <FileText className="size-4" />
                Apply / Learn More
                <ChevronRight className="size-4 opacity-70" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </CustomerShell>
  );
}
