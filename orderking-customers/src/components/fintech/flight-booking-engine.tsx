import { Plane, ArrowRight, ShieldCheck, Sparkles, MapPin, Calendar, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type Props = {
  walletBalance: number;
  onDeductWallet: (amount: number, description: string) => boolean;
};

export function FlightBookingEngine() {
  const [from, setFrom] = useState("New Delhi (DEL)");
  const [to, setTo] = useState("Mumbai (BOM)");
  
  const handleRedirect = () => {
    // Affiliate redirect link to Skyscanner or MakeMyTrip
    window.open(`https://www.skyscanner.co.in/transport/flights/${from.substring(from.length-4, from.length-1).toLowerCase()}/${to.substring(to.length-4, to.length-1).toLowerCase()}?utm_source=orderking_affiliate`, "_blank");
  };

  return (
    <div className="space-y-6 text-white p-4 md:p-6">
      <div className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-bg p-6 sm:p-10 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="flex size-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Plane className="size-6" />
             </div>
             <div>
                <h2 className="font-display text-2xl font-black tracking-tight">Global Flight Search</h2>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-500">
                  <Sparkles className="size-3" /> Powered by Skyscanner
                </div>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
           <div className="bg-white/5 p-3 rounded-2xl border-2 border-white/10 focus-within:border-primary/50 transition-colors">
              <label htmlFor="flight-from" className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 mb-1"><MapPin className="size-3" /> FROM</label>
              <input id="flight-from" type="text" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full bg-transparent text-lg font-black outline-none text-white" placeholder="Enter City or Airport" />
           </div>
           <div className="bg-white/5 p-3 rounded-2xl border-2 border-white/10 focus-within:border-primary/50 transition-colors">
              <label htmlFor="flight-to" className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 mb-1"><MapPin className="size-3" /> TO</label>
              <input id="flight-to" type="text" value={to} onChange={(e) => setTo(e.target.value)} className="w-full bg-transparent text-lg font-black outline-none text-white" placeholder="Enter City or Airport" />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <div className="bg-white/5 p-3 rounded-2xl border-2 border-white/10 focus-within:border-primary/50 transition-colors">
              <label htmlFor="flight-date" className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 mb-1"><Calendar className="size-3" /> DEPARTURE</label>
              <input id="flight-date" type="date" className="w-full bg-transparent text-base font-bold outline-none text-white" defaultValue={new Date().toISOString().split('T')[0]} />
           </div>
           <div className="bg-white/5 p-3 rounded-2xl border-2 border-white/10 focus-within:border-primary/50 transition-colors">
              <label htmlFor="flight-travelers" className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 mb-1"><Users className="size-3" /> TRAVELERS</label>
              <select id="flight-travelers" className="w-full bg-transparent text-base font-bold outline-none text-white">
                <option value="1">1 Passenger</option>
                <option value="2">2 Passengers</option>
                <option value="3">3 Passengers</option>
                <option value="4">4+ Passengers</option>
              </select>
           </div>
           <div className="bg-white/5 p-3 rounded-2xl border-2 border-white/10 focus-within:border-primary/50 transition-colors">
              <label htmlFor="flight-class" className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 mb-1"><Briefcase className="size-3" /> CLASS</label>
              <select id="flight-class" className="w-full bg-transparent text-base font-bold outline-none text-white">
                <option value="economy">Economy</option>
                <option value="premium">Premium Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
           </div>
        </div>

        <Button 
          onClick={handleRedirect}
          className="w-full text-lg px-8 py-7 rounded-2xl shadow-lg shadow-primary/25 font-black"
        >
          Search Flights (0% Fee) <ArrowRight className="ml-2 size-5" />
        </Button>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-zinc-400">
          <span className="flex items-center gap-2">
             <ShieldCheck className="size-5 text-emerald-500" /> Secure Booking
          </span>
          <span className="flex items-center gap-2">
             <span className="text-xl">💰</span> Zero Hidden Fees
          </span>
          <span className="flex items-center gap-2">
             <span className="text-xl">🌍</span> 1000+ Airlines
          </span>
        </div>
      </div>
    </div>
  );
}
