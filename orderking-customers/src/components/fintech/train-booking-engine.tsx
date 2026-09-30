
import { Train, ArrowRight, ShieldCheck, Sparkles, MapPin, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type Props = {
  walletBalance: number;
  onDeductWallet: (amount: number, description: string) => boolean;
};

export function TrainBookingEngine() {
  const [from, setFrom] = useState("New Delhi (NDLS)");
  const [to, setTo] = useState("Mumbai Central (MMCT)");
  
  const handleRedirect = () => {
    // Affiliate redirect link to IRCTC partner like MakeMyTrip or ConfirmTkt
    window.open("https://www.makemytrip.com/railways/?utm_source=orderking_affiliate", "_blank");
  };

  return (
    <div className="space-y-6 text-fg p-4 md:p-6">
      <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-surface to-bg p-6 sm:p-10 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="flex size-12 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-500">
                <Train className="size-6" />
             </div>
             <div>
                <h2 className="font-display text-2xl font-black tracking-tight">IRCTC Train Booking</h2>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500">
                  <Sparkles className="size-3" /> Authorized Partner
                </div>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
           <div className="bg-surface-2 p-3 rounded-2xl border-2 border-border focus-within:border-indigo-500/50 transition-colors">
              <label htmlFor="train-from" className="text-xs font-bold text-muted flex items-center gap-1.5 mb-1"><MapPin className="size-3" /> FROM STATION</label>
              <input id="train-from" type="text" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full bg-transparent text-lg font-black outline-none text-fg" placeholder="Enter Station Name or Code" />
           </div>
           <div className="bg-surface-2 p-3 rounded-2xl border-2 border-border focus-within:border-indigo-500/50 transition-colors">
              <label htmlFor="train-to" className="text-xs font-bold text-muted flex items-center gap-1.5 mb-1"><MapPin className="size-3" /> TO STATION</label>
              <input id="train-to" type="text" value={to} onChange={(e) => setTo(e.target.value)} className="w-full bg-transparent text-lg font-black outline-none text-fg" placeholder="Enter Station Name or Code" />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
           <div className="bg-surface-2 p-3 rounded-2xl border-2 border-border focus-within:border-indigo-500/50 transition-colors">
              <label htmlFor="train-date" className="text-xs font-bold text-muted flex items-center gap-1.5 mb-1"><Calendar className="size-3" /> TRAVEL DATE</label>
              <input id="train-date" type="date" className="w-full bg-transparent text-base font-bold outline-none text-fg" defaultValue={new Date().toISOString().split('T')[0]} />
           </div>
           <div className="bg-surface-2 p-3 rounded-2xl border-2 border-border focus-within:border-indigo-500/50 transition-colors">
              <label htmlFor="train-quota" className="text-xs font-bold text-muted flex items-center gap-1.5 mb-1"><Tag className="size-3" /> QUOTA</label>
              <select id="train-quota" className="w-full bg-transparent text-base font-bold outline-none text-fg">
                <option value="GN">General (GN)</option>
                <option value="TQ">Tatkal (TQ)</option>
                <option value="PT">Premium Tatkal (PT)</option>
                <option value="LD">Ladies (LD)</option>
              </select>
           </div>
        </div>

        <Button 
          onClick={handleRedirect}
          className="w-full text-lg px-8 py-7 rounded-2xl shadow-lg shadow-indigo-500/25 bg-indigo-600 hover:bg-indigo-700 text-white font-black"
        >
          Search Trains (₹0 PG Fee) <ArrowRight className="ml-2 size-5" />
        </Button>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-muted">
          <span className="flex items-center gap-2">
             <ShieldCheck className="size-5 text-emerald-500" /> Authorized IRCTC
          </span>
          <span className="flex items-center gap-2">
             <span className="text-xl">💰</span> Zero Hidden Fees
          </span>
          <span className="flex items-center gap-2">
             <span className="text-xl">🚂</span> 10000+ Routes
          </span>
        </div>
      </div>
    </div>
  );
}
