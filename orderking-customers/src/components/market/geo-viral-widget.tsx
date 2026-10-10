import { MapPin, Users, Zap, Share2, Flame } from "lucide-react";
import { toast } from "sonner";
import { useLocationStore } from "@/lib/stores/location";

export function GeoViralWidget() {
  const location = useLocationStore((s) => s.location);
  const areaName = location.zoneName || "Your Neighborhood";
  const ordersNeeded = 250;
  const currentOrders = 214;
  const percentage = Math.floor((currentOrders / ordersNeeded) * 100);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-black p-6 my-4 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[#D4AF37]/15 blur-[60px] pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-[#D4AF37]/20 shadow-[0_0_10px_rgba(212,175,55,0.3)]">
            <Flame className="size-3.5 text-[#D4AF37]" />
          </span>
          <h3 className="font-display font-black text-[#D4AF37] text-[11px] uppercase tracking-widest">
            {areaName} Turf War
          </h3>
        </div>

        <h4 className="text-2xl font-bold text-white leading-tight tracking-tight">
          Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F59E0B]">Free Midnight Delivery</span> <br/>for {areaName}!
        </h4>
        <p className="mt-2 text-sm text-gray-300 max-w-sm font-medium leading-relaxed">
          Your neighborhood is only <strong className="text-white">{ordersNeeded - currentOrders} orders</strong> away from permanently unlocking Free Delivery for all residents this month. 
        </p>

        <div className="mt-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Neighborhood Progress</span>
            <span className="text-[12px] font-bold text-[#D4AF37]">{percentage}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 border border-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F59E0B]" style={{ width: percentage + "%" }}></div>
          </div>
        </div>

        <button 
          onClick={() => {
            navigator.clipboard.writeText("https://orderking.app/rally/" + (location.zoneId || "local"));
            toast.success("Rally Link Copied! Drop this in your society WhatsApp group.");
          }}
          className="mt-5 w-full group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gray-900 to-black border border-[#D4AF37]/30 px-4 py-3.5 text-sm font-bold text-white transition hover:border-[#D4AF37] active:scale-95 shadow-lg"
        >
          <Share2 className="size-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
          Rally Your Society on WhatsApp
        </button>
      </div>
    </div>
  );
}
