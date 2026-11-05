import { MapPin, Users, Zap, Share2, Flame } from "lucide-react";
import { toast } from "sonner";
import { useLocationStore } from "@/lib/stores/location";

export function GeoViralWidget() {
  const location = useLocationStore((s) => s.location);
  const areaName = location.zoneName || "Your Neighborhood";
  const originUrl = typeof window !== "undefined" ? window.location.origin : "https://orderkingpay.com";
  const societyLink = `${originUrl}/?zone=${encodeURIComponent(location.zoneId || "local")}`;

  const handleShare = () => {
    const text = encodeURIComponent(
      `Hey neighbors in ${areaName}! Let's order food together on OrderKing to save on delivery: ${societyLink}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    toast.success("WhatsApp opened! Share in your society group.");
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-neutral-900 p-6 my-4 shadow-xl">
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-amber-500/15 blur-[60px] pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-amber-500/20 shadow-[0_0_10px_rgba(212,175,55,0.3)]">
            <Flame className="size-3.5 text-amber-400" />
          </span>
          <h3 className="font-display font-black text-amber-400 text-[11px] uppercase tracking-widest">
            {areaName} Group Delivery
          </h3>
        </div>

        <h4 className="text-2xl font-bold text-white leading-tight tracking-tight">
          Pool Orders in <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">{areaName}</span>!
        </h4>
        <p className="mt-2 text-sm text-gray-300 max-w-sm font-medium leading-relaxed">
          Order food together with neighbors or office colleagues to enjoy <strong className="text-white">Fast Delivery</strong> on orders over ₹499 with authentic menu rates.
        </p>

        <button 
          onClick={handleShare}
          className="mt-5 w-full group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3.5 text-sm font-bold text-white transition hover:from-amber-600 hover:to-orange-600 active:scale-95 shadow-lg"
        >
          <Share2 className="size-4 text-white group-hover:scale-110 transition-transform" />
          Share with Neighbors on WhatsApp
        </button>
      </div>
    </div>
  );
}
