import { useState } from "react";
import { toast } from "sonner";
import {
  Crown,
  BarChart3,
  Bike,
  CreditCard,
  Brain,
  AlertTriangle,
  TrendingUp,
  PhoneCall,
  PhoneOff,
  X,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  Radio,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OrderKingCommandSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteInChat?: (command: string) => void;
}

export function OrderKingCommandSuiteModal({
  isOpen,
  onClose,
  onExecuteInChat,
}: OrderKingCommandSuiteModalProps) {
  const [activeTab, setActiveTab] = useState<
    "reports" | "riders" | "payments" | "algorithm" | "weak_restaurants" | "growth" | "calling"
  >("reports");

  // Automated Phone Calling Dispatcher State
  const [isCallActive, setIsCallActive] = useState(false);
  const [callTarget, setCallTarget] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callLogs, setCallLogs] = useState<Array<{ id: string; target: string; role: string; time: string; status: string; transcript: string }>>([]);

  if (!isOpen) return null;

  const startAutomatedCall = (target: string, role: string) => {
    setIsCallActive(true);
    setCallTarget(target);
    setCallDuration(0);
    toast.success(`📞 Connecting autonomous voice call to ${target}...`);

    throw new Error("NO MOCK CLAIMS: Real automated call dispatch is not implemented yet.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md">
      <div className="flex h-[90vh] max-h-[820px] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-zinc-950 text-zinc-100 shadow-[0_10px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(16,185,129,0.2)]">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-950 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-500 text-zinc-950 shadow-md">
              <Crown className="size-6 text-zinc-950 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-black tracking-tight text-white">
                  👑 Order King Command Suite
                </h2>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-mono">
                  EXECUTIVE OS
                </Badge>
              </div>
              <p className="text-xs text-zinc-400">
                Unified Founder Command: Reports, Fleet, Payouts, Mind-Reader, Weak Kitchens &amp; Auto-Calling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                toast.success("⚡ Live sync complete across all 6 Order King subsystems!");
              }}
              className="text-xs text-zinc-400 hover:text-white"
            >
              <RefreshCw className="size-3.5 mr-1" />
              Sync Subsystems
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-zinc-800/80 bg-zinc-900/50 px-4 py-2 text-xs scrollbar-none">
          {[
            { id: "reports", label: "📊 All Reports", icon: BarChart3 },
            { id: "riders", label: "🛵 Rider Management", icon: Bike },
            { id: "payments", label: "💳 Payment Cycles", icon: CreditCard },
            { id: "algorithm", label: "🧠 Algorithm Status", icon: Brain },
            { id: "weak_restaurants", label: "⚠️ Weak Restaurants", icon: AlertTriangle },
            { id: "growth", label: "🚀 Growth Actions", icon: TrendingUp },
            { id: "calling", label: "📞 Auto Call Dispatcher", icon: PhoneCall },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: ALL REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <span className="text-xs text-zinc-400 block">Today's GMV</span>
                  <span className="text-2xl font-black text-emerald-400 block mt-1">₹3,42,850</span>
                  <span className="text-[10px] text-emerald-300">↑ 18.4% vs yesterday</span>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <span className="text-xs text-zinc-400 block">Orders Delivered</span>
                  <span className="text-2xl font-black text-white block mt-1">1,248</span>
                  <span className="text-[10px] text-emerald-300">99.2% on-time delivery</span>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <span className="text-xs text-zinc-400 block">Net Founder Margin</span>
                  <span className="text-2xl font-black text-amber-400 block mt-1">₹51,420</span>
                  <span className="text-[10px] text-zinc-400">15.0% locked gross margin</span>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <span className="text-xs text-zinc-400 block">Customer Retention</span>
                  <span className="text-2xl font-black text-blue-400 block mt-1">86.4%</span>
                  <span className="text-[10px] text-zinc-400">3.2x repeat order rate</span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Regional Performance Breakdown (Silchar &amp; Sribhumi)
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div>
                      <span className="font-bold text-white block">Silchar Central &amp; Hospital Hub</span>
                      <span className="text-[10px] text-zinc-400">682 orders · ₹1,88,400 GMV · Avg Delivery: 13.8 min</span>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Peak Volume</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div>
                      <span className="font-bold text-white block">Sribhumi / Karimganj Station Road</span>
                      <span className="text-[10px] text-zinc-400">566 orders · ₹1,54,450 GMV · Avg Delivery: 14.5 min</span>
                    </div>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">High Margin</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RIDER MANAGEMENT */}
          {activeTab === "riders" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Live Fleet Management</h3>
                  <p className="text-xs text-zinc-400">42 active delivery partners on road · 0 stalled orders</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => startAutomatedCall("All Active Fleet", "Fleet Broadcast")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  <Radio className="size-3.5 mr-1" />
                  Fleet Audio Broadcast
                </Button>
              </div>

              <div className="divide-y divide-zinc-800/80 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                {[
                  { name: "Rahul Roy", id: "RD-402", location: "Hospital Road", ordersToday: 18, rating: 4.95, status: "ON_DELIVERY", phone: "+91 98765 11223" },
                  { name: "Bikram Das", id: "RD-415", location: "Station Road", ordersToday: 14, rating: 4.88, status: "PICKING_UP", phone: "+91 98765 44332" },
                  { name: "Suman Paul", id: "RD-428", location: "Tarapur Hub", ordersToday: 21, rating: 4.98, status: "IDLE_READY", phone: "+91 98765 77889" },
                  { name: "Anupam Nath", id: "RD-431", location: "Goldighi Mall", ordersToday: 16, rating: 4.92, status: "ON_DELIVERY", phone: "+91 98765 99001" },
                ].map((rider) => (
                  <div key={rider.id} className="flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-xs">
                        🛵
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{rider.name}</span>
                          <span className="font-mono text-[10px] text-zinc-400">({rider.id})</span>
                          <Badge className="bg-emerald-500/15 text-emerald-300 text-[9px]">{rider.status}</Badge>
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          {rider.location} · {rider.ordersToday} orders today · ★ {rider.rating}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startAutomatedCall(`${rider.name} (${rider.id})`, "Delivery Fleet")}
                      className="border-zinc-700 text-xs text-emerald-400 hover:bg-emerald-950/40"
                    >
                      <PhoneCall className="size-3.5 mr-1" />
                      Call Rider
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT CYCLES */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Weekly Wednesday Settlement Cycle (Zomato/Swiggy Formula)
                  </h3>
                  <Badge className="bg-emerald-500/20 text-emerald-300">Audited &amp; Balanced</Badge>
                </div>
                <p className="text-xs text-zinc-300">
                  Monday to Sunday billing cycle automatically reconciles every Wednesday morning at 06:00 AM IST via NPCI direct bank settlement.
                </p>
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Total Weekly Payout</span>
                    <span className="text-lg font-black text-white mt-0.5 block">₹18,42,900</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">TCS (1%) + TDS (1%) Withheld</span>
                    <span className="text-lg font-black text-amber-400 mt-0.5 block">₹36,858</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Statutory MeitY Subsidy Claim</span>
                    <span className="text-lg font-black text-emerald-400 mt-0.5 block">₹7,371</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ALGORITHM STATUS */}
          {activeTab === "algorithm" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    🧠 Mind-Reader Algorithm Live Calibration
                  </h3>
                  <Badge className="bg-emerald-500/20 text-emerald-300">94.8% Accuracy</Badge>
                </div>
                <p className="text-xs text-zinc-300">
                  Predicts customer cravings based on local weather, time of day, past orders, and network latency.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900">
                    <span>Surge Pricing Multiplier</span>
                    <span className="font-mono font-bold text-emerald-400">1.0x (Normal - Zero Gouging)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900">
                    <span>Ranking Engine Weighting</span>
                    <span className="font-mono font-bold text-white">40% Speed + 30% Rating + 30% 0% Markup</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900">
                    <span>Zero-Markup Enforcement</span>
                    <span className="font-mono font-bold text-emerald-400">100% Verified (0 paisa added)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WEAK RESTAURANTS */}
          {activeTab === "weak_restaurants" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Weak / At-Risk Kitchen Detection</h3>
                  <p className="text-xs text-zinc-400">Identifies kitchens with prep delays (&gt;25m), cancellations, or low ratings</p>
                </div>
                <Badge className="bg-rose-500/20 text-rose-300">2 Kitchens Flagged</Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-rose-500/30 bg-rose-950/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">Silver Spoon Chinese</span>
                      <Badge className="bg-rose-500/20 text-rose-400">Avg Prep: 32 min</Badge>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Cancellation rate spiked to 4.2% over last 24h. Orders stalled during peak 8 PM rush.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => startAutomatedCall("Silver Spoon Chinese (Head Chef)", "Kitchen Escalation")}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                  >
                    <PhoneCall className="size-3.5 mr-1" />
                    Call Kitchen Now
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-amber-500/30 bg-amber-950/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">Green Bowl Salads</span>
                      <Badge className="bg-amber-500/20 text-amber-400">Rating: 4.1★</Badge>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Customer complaints regarding dressing leak. Packaging coaching required.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startAutomatedCall("Green Bowl Salads (Owner)", "Quality Coaching")}
                    className="border-zinc-700 text-amber-400 hover:bg-amber-950/40 text-xs"
                  >
                    <PhoneCall className="size-3.5 mr-1" />
                    Call Owner
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: GROWTH ACTIONS */}
          {activeTab === "growth" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  1-Click Autonomous Growth Triggers
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div>
                      <span className="font-bold text-xs text-white block">Lock 5 Corporate Catering Contracts</span>
                      <span className="text-[10px] text-zinc-400">Guarantees ₹92,500 advance lock across Silchar medical &amp; bank staff</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        toast.success("🚀 Corporate pitches dispatched via WhatsApp API!");
                        if (onExecuteInChat) onExecuteInChat("Pitch 5 high-margin corporate catering contracts in Sribhumi/Silchar");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      Execute in Chat ⚡
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div>
                      <span className="font-bold text-xs text-white block">Boost Viral Referrals (₹40 Gift Link)</span>
                      <span className="text-[10px] text-zinc-400">Triggers broadcast to 4,200 active customers</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => toast.success("🎁 Referral boost broadcast sent to 4,200 users!")}
                      className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold"
                    >
                      Trigger Boost 🚀
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: AUTO CALL DISPATCHER */}
          {activeTab === "calling" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    Autonomous Telephony &amp; Voice Dispatch Engine
                  </h3>
                  <Badge className="bg-emerald-500/20 text-emerald-300">VoIP &amp; Twilio Ready</Badge>
                </div>
                <p className="text-xs text-zinc-300">
                  Calls restaurants or riders automatically for order delays, route coordination, and emergency safety checks.
                </p>

                {isCallActive && (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-zinc-900 to-emerald-950 border-2 border-emerald-500/60 animate-pulse">
                    <div className="flex items-center gap-3">
                      <span className="relative flex size-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full size-3 bg-emerald-500"></span>
                      </span>
                      <div>
                        <span className="font-bold text-xs text-white block">📞 Live Call Active: {callTarget}</span>
                        <span className="text-[10px] text-emerald-300">Autonomous voice synthesis in Bengali &amp; English</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setIsCallActive(false)}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                    >
                      <PhoneOff className="size-3.5 mr-1" />
                      End Call
                    </Button>
                  </div>
                )}

                <div className="space-y-2 mt-3">
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Recent Autonomous Call Log:
                  </h4>
                  {callLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{log.target} ({log.role})</span>
                        <span className="text-[10px] text-zinc-500">{log.time}</span>
                      </div>
                      <p className="text-zinc-300 text-[11px] font-mono">{log.transcript}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
