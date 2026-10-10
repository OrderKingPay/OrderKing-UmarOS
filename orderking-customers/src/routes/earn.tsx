import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomerShell } from "@/components/market/shell";
import { 
  Wallet, 
  Share2, 
  Bike, 
  Smartphone, 
  Languages, 
  ArrowRight,
  CheckCircle2,
  Banknote,
  MapPin
} from "lucide-react";
import { useLocationStore } from "@/lib/stores/location";
import { toast } from "sonner";

export const Route = createFileRoute('/earn')({
  component: EarnPage,
});

const TRANSLATIONS = {
  English: {
    title: "Direct Earning",
    subtitle: "Easiest ways to get direct payouts to your bank.",
    affiliate: {
      title: "WhatsApp Promoter",
      desc: "Share your link. Earn ₹50 direct payout for every new user who orders.",
      btn: "Share on WhatsApp",
      tag: "Easiest"
    },
    delivery: {
      title: "Delivery Partner",
      desc: "Deliver food in your local area. Earn weekly payouts. No high qualifications needed.",
      btn: "Start Delivering",
      tag: "Direct Job"
    },
    tasks: {
      title: "Digital Tasks",
      desc: "Translate menus or verify restaurants on your phone. Earn ₹10 per task.",
      btn: "View Available Tasks",
      tag: "Part-Time"
    }
  },
  Hindi: {
    title: "सीधी कमाई (Direct Earning)",
    subtitle: "अपने बैंक में सीधे पैसे पाने के सबसे आसान तरीके।",
    affiliate: {
      title: "WhatsApp प्रमोटर",
      desc: "लिंक शेयर करें। हर नए ऑर्डर पर ₹50 सीधा बैंक में पाएं।",
      btn: "WhatsApp पर शेयर करें",
      tag: "सबसे आसान"
    },
    delivery: {
      title: "डिलीवरी पार्टनर",
      desc: "अपने इलाके में खाना पहुंचाएं। हर हफ्ते पैसे पाएं। किसी बड़ी डिग्री की जरूरत नहीं।",
      btn: "डिलीवरी शुरू करें",
      tag: "सीधी नौकरी"
    },
    tasks: {
      title: "मोबाइल टास्क",
      desc: "मोबाइल पर मेनू अनुवाद करें। हर काम के ₹10 कमाएं।",
      btn: "टास्क देखें",
      tag: "पार्ट-टाइम"
    }
  },
  Bengali: {
    title: "সরাসরি উপার্জন",
    subtitle: "আপনার ব্যাঙ্কে সরাসরি টাকা পাওয়ার সবচেয়ে সহজ উপায়।",
    affiliate: {
      title: "WhatsApp প্রমোটার",
      desc: "লিঙ্ক শেয়ার করুন। নতুন অর্ডারে সরাসরি ₹50 পান।",
      btn: "WhatsApp এ শেয়ার করুন",
      tag: "সবচেয়ে সহজ"
    },
    delivery: {
      title: "ডেলিভারি পার্টনার",
      desc: "আপনার এলাকায় খাবার পৌঁছে দিন। প্রতি সপ্তাহে টাকা পান।",
      btn: "ডেলিভারি শুরু করুন",
      tag: "সরাসরি চাকরি"
    },
    tasks: {
      title: "ডিজিটাল কাজ",
      desc: "মেনু অনুবাদ করুন। প্রতিটি কাজের জন্য ₹10 আয় করুন।",
      btn: "কাজ দেখুন",
      tag: "খন্ডকালীন"
    }
  },
  Telugu: {
    title: "నేరుగా సంపాదించండి",
    subtitle: "మీ బ్యాంకుకు నేరుగా డబ్బు పొందడానికి సులభమైన మార్గాలు.",
    affiliate: {
      title: "వాట్సాప్ ప్రమోటర్",
      desc: "లింక్ షేర్ చేయండి. ప్రతి కొత్త ఆర్డర్‌కు ₹50 పొందండి.",
      btn: "వాట్సాప్‌లో షేర్ చేయండి",
      tag: "చాలా సులభం"
    },
    delivery: {
      title: "డెలివరీ భాగస్వామి",
      desc: "మీ ప్రాంతంలో ఫుడ్ డెలివరీ చేయండి. ప్రతి వారం డబ్బులు పొందండి.",
      btn: "డెలివరీ ప్రారంభించండి",
      tag: "ప్రత్యక్ష ఉద్యోగం"
    },
    tasks: {
      title: "డిజిటల్ పనులు",
      desc: "ఫోన్‌లో చిన్న పనులు చేయండి. పనికి ₹10 పొందండి.",
      btn: "పనులు చూడండి",
      tag: "పార్ట్ టైమ్"
    }
  },
  Tamil: {
    title: "நேரடி வருமானம்",
    subtitle: "உங்கள் வங்கிக்கு நேரடியாக பணம் பெற எளிதான வழிகள்.",
    affiliate: {
      title: "வாட்ஸ்அப் விளம்பரதாரர்",
      desc: "லிங்கை பகிரவும். புதிய ஆர்டருக்கு ₹50 பெறவும்.",
      btn: "வாட்ஸ்அப்பில் பகிரவும்",
      tag: "மிக எளிதானது"
    },
    delivery: {
      title: "டெலிவரி பார்ட்னர்",
      desc: "உங்கள் பகுதியில் உணவு டெலிவரி செய்யுங்கள். வாராந்திர வருமானம்.",
      btn: "டெலிவரி தொடங்கவும்",
      tag: "நேரடி வேலை"
    },
    tasks: {
      title: "டிஜிட்டல் பணிகள்",
      desc: "மொபைலில் சிறு வேலைகள். ஒவ்வொரு வேலைக்கும் ₹10.",
      btn: "பணிகளை பார்க்கவும்",
      tag: "பகுதி நேர"
    }
  }
};

type LangKey = keyof typeof TRANSLATIONS;

function EarnPage() {
  const [lang, setLang] = useState<LangKey>("English");
  const t = TRANSLATIONS[lang];
  const location = useLocationStore((s) => s.location);
  const userCity = location.cityName || "India";

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      "Hey! Use my OrderKing link to get ₹500 free on your first order: https://orderking.app/KING500"
    );
    window.open("https://wa.me/?text=" + text, "_blank");
    toast.success("Opened WhatsApp!");
  };

  const handleDirectJob = () => {
    toast.success("Application started! We will contact you directly.");
  };

  return (
    <CustomerShell>
      <div className="min-h-screen bg-black pb-24 text-white">
        
        {/* Header & Language Toggle */}
        <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="size-6 text-emerald-400" />
            <h1 className="font-display text-xl font-bold tracking-tight text-white">
              {t.title}
            </h1>
          </div>
          <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 rounded-full px-2 py-1">
            <Languages className="size-3.5 text-zinc-400" />
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as LangKey)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer appearance-none pl-1 pr-2"
            >
              {Object.keys(TRANSLATIONS).map(l => (
                <option key={l} value={l} className="bg-zinc-900">{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-4 pt-6 pb-2">
          <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-6">
            {t.subtitle}
          </p>

          <div className="space-y-4">
            
            {/* Easiest: WhatsApp Affiliate */}
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/40 to-black p-5 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
            >
              <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-3xl">
                {t.affiliate.tag}
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 flex items-center justify-center size-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30">
                  <Share2 className="size-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">{t.affiliate.title}</h2>
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-[90%] mb-4">
                    {t.affiliate.desc}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleWhatsAppShare}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                {t.affiliate.btn}
                <ArrowRight className="size-4" />
              </button>
            </motion.div>

            {/* Direct Job: Delivery */}
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#D4AF37]/10 to-black p-5 shadow-[0_0_30px_rgba(212,175,55,0.05)]"
            >
              <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-3xl">
                {t.delivery.tag}
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 flex items-center justify-center size-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/30">
                  <Bike className="size-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">{t.delivery.title}</h2>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin className="size-3 text-zinc-400" />
                    <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">{userCity}</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-[90%] mb-4">
                    {t.delivery.desc}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleDirectJob}
                className="w-full bg-[#D4AF37] hover:bg-[#F59E0B] text-black font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                {t.delivery.btn}
                <ArrowRight className="size-4" />
              </button>
            </motion.div>

            {/* Part-Time: Digital Tasks */}
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/40 to-black p-5"
            >
              <div className="absolute top-0 right-0 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-3xl">
                {t.tasks.tag}
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 flex items-center justify-center size-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30">
                  <Smartphone className="size-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">{t.tasks.title}</h2>
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-[90%] mb-4">
                    {t.tasks.desc}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleDirectJob}
                className="w-full border border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400 font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                {t.tasks.btn}
                <ArrowRight className="size-4" />
              </button>
            </motion.div>

          </div>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-zinc-500">
            <CheckCircle2 className="size-4" />
            <span className="text-xs font-bold uppercase tracking-widest">100% Direct Payouts</span>
          </div>

        </div>
      </div>
    </CustomerShell>
  );
}
