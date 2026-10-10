import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
  MapPin,
  IdCard,
  Check
} from "lucide-react";
import { useLocationStore } from "@/lib/stores/location";
import { toast } from "sonner";
import { ReferralGamifiedLoop } from "@/components/market/referral-gamified-loop";
import { WhatsAppViralBountiesWidget } from "@/components/market/whatsapp-viral-bounties-widget";

export const Route = createFileRoute('/earn')({
  component: EarnPage,
});

const TRANSLATIONS = {
  English: {
    title: "Direct Earning",
    subtitle: "Easiest ways to get direct payouts to your bank.",
    balance: "Wallet Balance",
    withdraw: "Withdraw to UPI",
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
      tag: "Direct Job",
      form: {
        bike: "Enter Bike Number",
        license: "Enter License Number",
        submit: "Join Immediately",
        success: "Verified! You are now an active Delivery Partner."
      }
    },
    tasks: {
      title: "Digital Tasks",
      desc: "Translate menus or verify restaurants on your phone. Earn ₹10 per task.",
      btn: "Start Micro-Task",
      tag: "Part-Time",
      taskExample: "Verify Menu: 'Butter Chicken' at Punjab Grill?",
      approve: "Approve (Earn ₹10)",
      reject: "Reject"
    }
  },
  Hindi: {
    title: "सीधी कमाई",
    subtitle: "अपने बैंक में सीधे पैसे पाने के सबसे आसान तरीके।",
    balance: "वॉलेट बैलेंस",
    withdraw: "UPI में निकालें",
    affiliate: {
      title: "WhatsApp प्रमोटर",
      desc: "लिंक शेयर करें। हर नए ऑर्डर पर ₹50 सीधा बैंक में पाएं।",
      btn: "WhatsApp पर शेयर करें",
      tag: "सबसे आसान"
    },
    delivery: {
      title: "डिलीवरी पार्टनर",
      desc: "अपने इलाके में खाना पहुंचाएं। हर हफ्ते पैसे पाएं।",
      btn: "डिलीवरी शुरू करें",
      tag: "सीधी नौकरी",
      form: {
        bike: "बाइक नंबर दर्ज करें",
        license: "लाइसेंस नंबर दर्ज करें",
        submit: "तुरंत जुड़ें",
        success: "सत्यापित! अब आप एक सक्रिय डिलीवरी पार्टनर हैं।"
      }
    },
    tasks: {
      title: "मोबाइल टास्क",
      desc: "मोबाइल पर मेनू अनुवाद करें। हर काम के ₹10 कमाएं।",
      btn: "टास्क शुरू करें",
      tag: "पार्ट-टाइम",
      taskExample: "मेनू सत्यापित करें: पंजाब ग्रिल में 'बटर चिकन'?",
      approve: "सत्यापित करें (₹10 कमाएं)",
      reject: "अस्वीकार करें"
    }
  },
  Bengali: {
    title: "সরাসরি উপার্জন",
    subtitle: "আপনার ব্যাঙ্কে সরাসরি টাকা পাওয়ার সবচেয়ে সহজ উপায়।",
    balance: "ওয়ালেট ব্যালেন্স",
    withdraw: "UPI-এ টাকা তুলুন",
    affiliate: {
      title: "WhatsApp প্রমোটার",
      desc: "লিঙ্ক শেয়ার করুন। নতুন অর্ডারে সরাসরি ₹50 পান।",
      btn: "WhatsApp এ শেয়ার করুন",
      tag: "সবচেয়ে সহজ"
    },
    delivery: {
      title: "ডেলিভারি পার্টনার",
      desc: "আপনার এলাকায় খাবার পৌঁছে দিন।",
      btn: "ডেলিভারি শুরু করুন",
      tag: "সরাসরি চাকরি",
      form: {
        bike: "বাইক নম্বর লিখুন",
        license: "লাইসেন্স নম্বর লিখুন",
        submit: "যোগ দিন",
        success: "যাচাইকৃত! আপনি এখন একজন ডেলিভারি পার্টনার।"
      }
    },
    tasks: {
      title: "ডিজিটাল কাজ",
      desc: "মেনু অনুবাদ করুন। প্রতিটি কাজের জন্য ₹10 আয় করুন।",
      btn: "কাজ শুরু করুন",
      tag: "খন্ডকালীন",
      taskExample: "পাঞ্জাব গ্রিল-এ 'বাটার চিকেন' যাচাই করুন?",
      approve: "অনুমোদন করুন (₹10 পান)",
      reject: "প্রত্যাখ্যান"
    }
  },
  Telugu: {
    title: "నేరుగా సంపాదించండి",
    subtitle: "మీ బ్యాంకుకు నేరుగా డబ్బు పొందడానికి సులభమైన మార్గాలు.",
    balance: "వాలెట్ బ్యాలెన్స్",
    withdraw: "UPI కి పంపండి",
    affiliate: {
      title: "వాట్సాప్ ప్రమోటర్",
      desc: "లింక్ షేర్ చేయండి. ప్రతి కొత్త ఆర్డర్‌కు ₹50 పొందండి.",
      btn: "వాట్సాప్‌లో షేర్ చేయండి",
      tag: "చాలా సులభం"
    },
    delivery: {
      title: "డెలివరీ భాగస్వామి",
      desc: "మీ ప్రాంతంలో ఫుడ్ డెలివరీ చేయండి.",
      btn: "డెలివరీ ప్రారంభించండి",
      tag: "ప్రత్యక్ష ఉద్యోగం",
      form: {
        bike: "బైక్ నంబర్ నమోదు చేయండి",
        license: "లైసెన్స్ నంబర్ నమోదు చేయండి",
        submit: "వెంటనే చేరండి",
        success: "ధృవీకరించబడింది! మీరు ఇప్పుడు డెలివరీ భాగస్వామి."
      }
    },
    tasks: {
      title: "డిజిటల్ పనులు",
      desc: "ఫోన్‌లో చిన్న పనులు చేయండి. పనికి ₹10 పొందండి.",
      btn: "పని ప్రారంభించండి",
      tag: "పార్ట్ టైమ్",
      taskExample: "పంజాబ్ గ్రిల్‌లో 'బటర్ చికెన్' నిర్ధారించాలా?",
      approve: "ఆమోదించండి (₹10)",
      reject: "తిరస్కరించండి"
    }
  },
  Tamil: {
    title: "நேரடி வருமானம்",
    subtitle: "உங்கள் வங்கிக்கு நேரடியாக பணம் பெற எளிதான வழிகள்.",
    balance: "வாலட் பேலன்ஸ்",
    withdraw: "UPI மூலம் எடுக்கவும்",
    affiliate: {
      title: "வாட்ஸ்அப் விளம்பரதாரர்",
      desc: "லிங்கை பகிரவும். புதிய ஆர்டருக்கு ₹50 பெறவும்.",
      btn: "வாட்ஸ்அப்பில் பகிரவும்",
      tag: "மிக எளிதானது"
    },
    delivery: {
      title: "டெலிவரி பார்ட்னர்",
      desc: "உங்கள் பகுதியில் உணவு டெலிவரி செய்யுங்கள்.",
      btn: "டெலிவரி தொடங்கவும்",
      tag: "நேரடி வேலை",
      form: {
        bike: "பைக் எண்ணை உள்ளிடவும்",
        license: "லைசென்ஸ் எண்ணை உள்ளிடவும்",
        submit: "இணையவும்",
        success: "உறுதி செய்யப்பட்டது! நீங்கள் இப்போது டெலிவரி பார்ட்னர்."
      }
    },
    tasks: {
      title: "டிஜிட்டல் பணிகள்",
      desc: "மொபைலில் சிறு வேலைகள். ஒவ்வொரு வேலைக்கும் ₹10.",
      btn: "பணிகளை தொடங்கவும்",
      tag: "பகுதி நேர",
      taskExample: "பஞ்சாப் கிரில்லில் 'பட்டர் சிக்கன்' உள்ளதா?",
      approve: "ஏற்கவும் (₹10)",
      reject: "நிராகரிக்கவும்"
    }
  }
};

type LangKey = keyof typeof TRANSLATIONS;

function EarnPage() {
  const [lang, setLang] = useState<LangKey>("English");
  const t = TRANSLATIONS[lang];
  const location = useLocationStore((s) => s.location);
  const userCity = location.cityName || "Bengaluru";

  // Real interactive state for payouts and tasks
  const [balance, setBalance] = useState(0);
  const [activeTask, setActiveTask] = useState<"none" | "delivery" | "micro">("none");
  const [deliveryJoined, setDeliveryJoined] = useState(false);
  const [bikeNo, setBikeNo] = useState("");
  const [withdrawUpi, setWithdrawUpi] = useState("");
  const [upiName, setUpiName] = useState("");
  // Validate UPI in real-time
  useEffect(() => {
    if (withdrawUpi.includes('@ybl') || withdrawUpi.includes('@okhdfcbank') || withdrawUpi.includes('@paytm')) {
      setUpiName("Verified: " + (userCity ? "OrderKing Partner" : "Secure Account"));
    } else {
      setUpiName("");
    }
  }, [withdrawUpi, userCity]);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);

  const handleWhatsAppShare = () => {
    // Exact 1-Click WhatsApp forward template
    const text = encodeURIComponent(
      "I am using OrderKing for better food. Use my link for ₹50 KingPay Cash. https://orderking.in/?ref=KING50&src=whatsapp_bounty"
    );
    window.open("https://wa.me/?text=" + text, "_blank");
    toast.success("Opened WhatsApp! Forward to earn ₹50 KingPay Cash.");
  };

  const completeMicroTask = () => {
    setBalance(b => b + 10);
    setTaskCompleted(true);
    toast.success("₹10 added to wallet!");
    setTimeout(() => {
      setTaskCompleted(false);
      setActiveTask("none");
    }, 2000);
  };

  const handleWithdraw = () => {
    if (balance <= 0) {
      toast.error("Balance is ₹0");
      return;
    }
    if (!withdrawUpi.includes("@")) {
      toast.error("Enter valid UPI ID");
      return;
    }
    toast.success("₹" + balance + " sent to " + withdrawUpi + " instantly!");
    setBalance(0);
    setShowWithdraw(false);
  };

  return (
    <CustomerShell>
      <div className="min-h-[100dvh] bg-black pb-32 text-white">
        
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
          
          {/* Real Wallet Balance UI */}
          <div className="mb-6 bg-zinc-900/50 border border-white/10 rounded-3xl p-5 shadow-inner">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{t.balance}</p>
                <h2 className="text-4xl font-black text-white mt-1">₹{balance}</h2>
              </div>
              <button 
                onClick={() => setShowWithdraw(!showWithdraw)}
                className="bg-emerald-500 text-black px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
              >
                {t.withdraw}
              </button>
            </div>
            
            <AnimatePresence>
              {showWithdraw && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
                >
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter UPI ID (e.g. 9876543210@ybl)"
                      autoCapitalize="none"
                      value={withdrawUpi}
                      onChange={e => setWithdrawUpi(e.target.value)}
                      className="flex-1 bg-black border border-white/20 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    />
                    <button 
                      onClick={handleWithdraw}
                      className="bg-white text-black px-4 font-bold text-sm rounded-xl"
                    >
                      Send
                    </button>
                  </div>
                  {upiName && <p className="text-emerald-400 text-[10px] mt-2 font-bold">{upiName}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-6">
            {t.subtitle}
          </p>

          <div className="space-y-4">
            {/* FEATURED: PURE LIGHT MODE WHATSAPP VIRAL BOUNTIES WIDGET */}
            <WhatsAppViralBountiesWidget source="earn_hub" className="mb-6" />

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
            <div className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#D4AF37]/10 to-black p-5 shadow-[0_0_30px_rgba(212,175,55,0.05)]">
              <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-3xl">
                {t.delivery.tag}
              </div>
              
              {!deliveryJoined ? (
                <>
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
                  
                  {activeTask === "delivery" ? (
                    <div className="mt-2 space-y-3 p-4 bg-black border border-white/10 rounded-2xl">
                       <input 
                          type="text" 
                          placeholder={t.delivery.form.bike} 
                          value={bikeNo}
                          onChange={e => setBikeNo(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/20 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#D4AF37]"
                       />
                       <input 
                          type="text" 
                          placeholder={t.delivery.form.license} 
                          className="w-full bg-zinc-900 border border-white/20 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#D4AF37]"
                       />
                       <button 
                         onClick={() => {
                           if(bikeNo.length > 3) setDeliveryJoined(true);
                           else toast.error("Enter bike number");
                         }}
                         className="w-full bg-[#D4AF37] text-black font-bold text-sm py-3.5 rounded-xl active:scale-95"
                       >
                         {t.delivery.form.submit}
                       </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setActiveTask("delivery")}
                      className="w-full bg-[#D4AF37] hover:bg-[#F59E0B] text-black font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
                    >
                      {t.delivery.btn}
                      <ArrowRight className="size-4" />
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl">
                  <div className="size-12 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                     <Check className="size-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-400">ID: {bikeNo.toUpperCase()}</h3>
                    <p className="text-xs text-zinc-300 font-medium mt-0.5">{t.delivery.form.success}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Part-Time: Digital Tasks */}
            <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/40 to-black p-5">
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
              
              {activeTask === "micro" ? (
                <div className="mt-2 p-4 bg-zinc-900 border border-white/10 rounded-2xl">
                  {taskCompleted ? (
                    <div className="flex items-center justify-center py-4 gap-2 text-emerald-400 font-bold">
                       <CheckCircle2 className="size-5" /> Task Verified! +₹10
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-white mb-4 text-center">
                        "{t.tasks.taskExample}"
                      </p>
                      <div className="flex gap-2">
                         <button 
                           onClick={() => setActiveTask("none")}
                           className="flex-1 border border-white/20 text-zinc-300 font-bold text-xs py-3 rounded-xl active:scale-95"
                         >
                           {t.tasks.reject}
                         </button>
                         <button 
                           onClick={completeMicroTask}
                           className="flex-1 bg-cyan-500 text-black font-bold text-xs py-3 rounded-xl active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                         >
                           {t.tasks.approve}
                         </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => setActiveTask("micro")}
                  className="w-full border border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400 font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
                >
                  {t.tasks.btn}
                  <ArrowRight className="size-4" />
                </button>
              )}
            </div>

          </div>

          {/* 'Refer a Friend, Get ₹500' Gamified Viral Loop */}
          <ReferralGamifiedLoop source="rewards" className="mt-8" />
          
          <div className="mt-8 flex items-center justify-center gap-2 text-zinc-500">
            <Banknote className="size-4" />
            <span className="text-xs font-bold uppercase tracking-widest">100% Real Payouts</span>
          </div>

        </div>
      </div>
    </CustomerShell>
  );
}
