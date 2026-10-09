import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HomeFeed } from "@/components/market/home-feed";
import { CustomerShell } from "@/components/market/shell";
import { trackAnalytics } from "@/lib/server/quote";
import { useLocationStore } from "@/lib/stores/location";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute('/')({ component: Home, head: () => ({ meta: [{ property: 'og:title', content: '🍔 OrderKing - Beat Zomato. 0% Markup.' }, { property: 'og:description', content: 'Order from elite local kitchens. Delivered fast, tracked live, with flawless perfection.' }] }) });

function Home() {
  const navigate = useNavigate();
  const location = useLocationStore((s) => s.location);
  const isDeliveryActive = isDeliveryActiveInLocation(location.lat, location.lng, location.cityId);
  const [showZomatoKillerPopup, setShowZomatoKillerPopup] = useState(false);

  useEffect(() => {
    void trackAnalytics({
      data: {
        name: "app_open",
        payload: {
          cityId: location.cityId,
          cityName: location.cityName,
          isDeliveryActive,
        },
      },
    });
    
    // Aggressive pop-up delay
    const timer = setTimeout(() => {
      const hasSeen = localStorage.getItem("zomato_killer_seen");
      if (!hasSeen) {
        setShowZomatoKillerPopup(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [location.cityId, location.cityName, isDeliveryActive]);

  const claimAndClose = () => {
    localStorage.setItem("zomato_killer_seen", "true");
    setShowZomatoKillerPopup(false);
    toast.success("₹1000 King Coins added! Zomato is crying right now.", { duration: 5000 });
  };

  return (
    <>
      <CustomerShell onSearch={() => void navigate({ to: "/search" })}>
        <HomeFeed />
      </CustomerShell>
      
      <AnimatePresence>
        {showZomatoKillerPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-[#D4AF37]/50 bg-gradient-to-br from-black via-[#1a1505] to-black p-8 text-center shadow-[0_20px_60px_rgba(212,175,55,0.4)]"
            >
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#D4AF37]/30 blur-3xl animate-pulse"></div>
              
              <h2 className="relative z-10 font-display text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-[#D4AF37]">
                DEFEAT ZOMATO
              </h2>
              <p className="relative z-10 mt-4 text-sm font-bold text-slate-300">
                Zomato charges ₹80 delivery? <span className="text-red-500 line-through">Ridiculous.</span>
              </p>
              <p className="relative z-10 mt-2 text-xl font-black text-white drop-shadow-md">
                We charge <span className="text-[#D4AF37]">₹0.</span> Forever.
              </p>
              <p className="relative z-10 mt-4 text-xs font-medium text-slate-400">
                Claim your Welcome King's Ransom: ₹1000 Free Coins for your first 3 orders. Force the revolution.
              </p>
              
              <button
                onClick={claimAndClose}
                className="relative z-10 mt-8 w-full rounded-2xl bg-gradient-to-r from-[#D4AF37] via-yellow-400 to-[#B8860B] py-4 text-lg font-black uppercase tracking-wider text-black shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-transform hover:scale-105 active:scale-95"
              >
                CLAIM ₹1000 NOW
              </button>
              <button
                onClick={() => setShowZomatoKillerPopup(false)}
                className="relative z-10 mt-4 text-xs font-medium text-slate-500 hover:text-white"
              >
                I like paying extra fees on Zomato
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
