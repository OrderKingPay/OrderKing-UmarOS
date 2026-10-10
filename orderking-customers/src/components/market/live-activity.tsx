import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Bell, MapPin, Zap } from "lucide-react";

const REAL_EVENTS = [
  { user: "Rajesh S.", area: "Local", action: "unlocked Lifetime Free Delivery via 5 Invites", time: "2 min ago" },
  { user: "Priya M.", area: "Local", action: "saved ₹142 on Dum Biryani with OrderKing Black", time: "4 min ago" },
  { user: "Rahul K.", area: "Nearby", action: "just claimed a ₹500 Courtesy Credit", time: "just now" },
  { user: "Sneha V.", area: "Local", action: "gifted a VIP Invite to a friend", time: "7 min ago" },
];

export function LiveActivityFeed() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % REAL_EVENTS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="my-2 h-9 w-full overflow-hidden rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex h-full items-center gap-2 text-[10px] font-medium sm:text-xs"
        >
          <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20">
            <Zap className="size-2.5 text-[#D4AF37]" />
          </div>
          <span className="truncate text-gray-300">
            <strong className="text-white">{REAL_EVENTS[index].user}</strong> ({REAL_EVENTS[index].area}) {REAL_EVENTS[index].action}
          </span>
          <span className="ml-auto shrink-0 text-[#D4AF37]/80">{REAL_EVENTS[index].time}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
