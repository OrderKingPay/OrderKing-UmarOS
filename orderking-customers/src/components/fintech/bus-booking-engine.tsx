
import { Bus, ArrowRight, ShieldCheck, Sparkles, MapPin, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type Props = {
  walletBalance: number;
  onDeductWallet: (amount: number, description: string) => boolean;
};

export function BusBookingEngine() {
  const [from, setFrom] = useState("Bangalore");
  const [to, setTo] = useState("Hyderabad");
  
  const handleRedirect = () => {
    // Affiliate redirect link to RedBus
    window.open("https://www.redbus.in/?utm_source=orderking_affiliate", "_blank");
  };

  return (
    <div className="space-y-6 text-fg p-4 md:p-6">
      <div className="relative overflow-hidden rounded-3xl border-2 border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-surface to-bg p-6 sm:p-10 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="flex size-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-500">
                <Bus className="size-6" />
             </div>
             <div>
                <h2 className="font-display text-2xl font-black tracking-tight">Intercity Bus Search</h2>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500">
                  <Sparkles className="size-3" /> Powered by RedBus
                </div>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
           <div className="bg-surface-2 p-3 rounded-2xl border-2 border-border focus-within:border-rose-500/50 transition-colors">
              <label htmlFor="bus-from" className="text-xs font-bold text-muted flex items-center gap-1.5 mb-1"><MapPin className="size-3" /> LEAVING FROM</label>
              <input id="bus-from" type="text" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full bg-transparent text-lg font-black outline-none text-fg" placeholder="Enter Origin City" />
           </div>
           <div className="bg-surface-2 p-3 rounded-2xl border-2 border-border focus-within:border-rose-500/50 transition-colors">
              <label htmlFor="bus-to" className="text-xs font-bold text-muted flex items-center gap-1.5 mb-1"><MapPin className="size-3" /> GOING TO</label>
              <input id="bus-to" type="text" value={to} onChange={(e) => setTo(e.target.value)} className="w-full bg-transparent text-lg font-black outline-none text-fg" placeholder="Enter Destination City" />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
           <div className="bg-surface-2 p-3 rounded-2xl border-2 border-border focus-within:border-rose-500/50 transition-colors">
              <label htmlFor="bus-date" className="text-xs font-bold text-muted flex items-center gap-1.5 mb-1"><Calendar className="size-3" /> DATE OF JOURNEY</label>
              <input id="bus-date" type="date" className="w-full bg-transparent text-base font-bold outline-none text-fg" defaultValue={new Date().toISOString().split('T')[0]} />
           </div>
           <div className="bg-surface-2 p-3 rounded-2xl border-2 border-border focus-within:border-rose-500/50 transition-colors">
              <label htmlFor="bus-type" className="text-xs font-bold text-muted flex items-center gap-1.5 mb-1"><Tag className="size-3" /> BUS TYPE</label>
              <select id="bus-type" className="w-full bg-transparent text-base font-bold outline-none text-fg">
                <option value="all">All Buses</option>
                <option value="ac">AC Sleeper</option>
                <option value="non_ac">Non-AC Sleeper</option>
                <option value="seater">Seater</option>
              </select>
           </div>
        </div>

        <Button 
          onClick={handleRedirect}
          className="w-full text-lg px-8 py-7 rounded-2xl shadow-lg shadow-rose-500/25 bg-rose-600 hover:bg-rose-700 text-fg font-black"
        >
          Search Buses (₹0 Fee) <ArrowRight className="ml-2 size-5" />
        </Button>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-muted">
          <span className="flex items-center gap-2">
             <ShieldCheck className="size-5 text-emerald-500" /> Secure Booking
          </span>
          <span className="flex items-center gap-2">
             <span className="text-xl">💰</span> Zero Hidden Fees
          </span>
          <span className="flex items-center gap-2">
             <span className="text-xl">🚌</span> 3500+ Operators
          </span>
        </div>
      </div>
    </div>
  );
}
