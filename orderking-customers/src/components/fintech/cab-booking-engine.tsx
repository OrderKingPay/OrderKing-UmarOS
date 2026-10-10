
import { Car, ArrowRight, ShieldCheck, Sparkles, MapPin, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type Props = {
  walletBalance: number;
  onDeductWallet: (amount: number, description: string) => boolean;
};

export function CabBookingEngine() {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  
  const handleUber = () => {
    window.open("https://m.uber.com/ul/?utm_source=orderking_affiliate", "_blank");
  };

  const handleOla = () => {
    window.open("https://book.olacabs.com/?utm_source=orderking_affiliate", "_blank");
  };

  const handleRapido = () => {
    window.open("https://www.rapido.bike/?utm_source=orderking_affiliate", "_blank");
  };

  return (
    <div className="space-y-6 text-fg p-4 md:p-6">
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-surface to-bg p-6 sm:p-10 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                <Car className="size-6" />
             </div>
             <div>
                <h2 className="font-display text-2xl font-black tracking-tight">Outstation & Airport Cabs</h2>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500">
                  <Sparkles className="size-3" /> Verified Fleet Partners
                </div>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
           <div className="bg-surface-2 p-3 rounded-2xl border-2 border-border focus-within:border-amber-500/50 transition-colors">
              <label htmlFor="cab-pickup" className="text-xs font-bold text-muted flex items-center gap-1.5 mb-1"><MapPin className="size-3" /> PICKUP LOCATION</label>
              <input id="cab-pickup" type="text" value={pickup} onChange={(e) => setPickup(e.target.value)} className="w-full bg-transparent text-lg font-black outline-none text-fg" placeholder="Enter Pickup Location" />
           </div>
           <div className="bg-surface-2 p-3 rounded-2xl border-2 border-border focus-within:border-amber-500/50 transition-colors">
              <label htmlFor="cab-drop" className="text-xs font-bold text-muted flex items-center gap-1.5 mb-1"><MapPin className="size-3" /> DROP LOCATION</label>
              <input id="cab-drop" type="text" value={drop} onChange={(e) => setDrop(e.target.value)} className="w-full bg-transparent text-lg font-black outline-none text-fg" placeholder="Enter Drop Location" />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
           <div className="bg-surface-2 p-3 rounded-2xl border-2 border-border focus-within:border-amber-500/50 transition-colors">
              <label htmlFor="cab-date" className="text-xs font-bold text-muted flex items-center gap-1.5 mb-1"><Calendar className="size-3" /> PICKUP DATE</label>
              <input id="cab-date" type="date" className="w-full bg-transparent text-base font-bold outline-none text-fg" defaultValue={new Date().toISOString().split('T')[0]} />
           </div>
           <div className="bg-surface-2 p-3 rounded-2xl border-2 border-border focus-within:border-amber-500/50 transition-colors">
              <label htmlFor="cab-time" className="text-xs font-bold text-muted flex items-center gap-1.5 mb-1"><Clock className="size-3" /> PICKUP TIME</label>
              <input id="cab-time" type="time" className="w-full bg-transparent text-base font-bold outline-none text-fg" defaultValue="10:00" />
           </div>
        </div>

        <p className="text-sm font-bold text-muted text-center mb-4">Select your preferred partner to book with ₹0 extra convenience fee:</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            onClick={handleUber}
            className="w-full sm:w-auto text-base px-8 py-6 rounded-2xl shadow-lg bg-white hover:bg-gray-800 text-fg font-black"
          >
            Book Uber <ArrowRight className="ml-2 size-5" />
          </Button>

          <Button 
            onClick={handleOla}
            className="w-full sm:w-auto text-base px-8 py-6 rounded-2xl shadow-lg bg-[#bada55] hover:bg-[#a6c34a] text-black font-black"
          >
            Book Ola <ArrowRight className="ml-2 size-5" />
          </Button>

          <Button 
            onClick={handleRapido}
            className="w-full sm:w-auto text-base px-8 py-6 rounded-2xl shadow-lg bg-yellow-400 hover:bg-yellow-500 text-black font-black"
          >
            Book Rapido <ArrowRight className="ml-2 size-5" />
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-muted">
          <span className="flex items-center gap-2">
             <ShieldCheck className="size-5 text-emerald-500" /> Trusted Drivers
          </span>
          <span className="flex items-center gap-2">
             <span className="text-xl">💰</span> Competitive Prices
          </span>
          <span className="flex items-center gap-2">
             <span className="text-xl">🚖</span> 100+ Cities
          </span>
        </div>
      </div>
    </div>
  );
}
