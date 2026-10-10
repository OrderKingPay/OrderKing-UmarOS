import { Crown, AlertTriangle, ChevronRight, ShieldCheck } from "lucide-react";

export function DailyStreakWidget() {
  const currentStreak = 4;
  const isClaimedToday = false;
  const currentCredits = 450;
  const days = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="my-5 relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#050505] p-6 shadow-2xl">
      {/* Background subtle radial gradient for premium metallic look */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(212,175,55,0.08),_transparent_50%)] pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Crown className="size-5 text-[#D4AF37]" />
              <h3 className="font-display tracking-widest uppercase font-medium text-fg text-lg">The King's Vault</h3>
            </div>
            <p className="text-[12px] text-zinc-400 font-medium tracking-wide">
              Wealth favors the disciplined. Claim daily or forfeit your tier.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Vault Balance</p>
            <div className="flex items-baseline justify-end gap-1 text-[#D4AF37]">
              <span className="font-display text-2xl font-medium tracking-tight">₹{currentCredits}</span>
              <span className="text-xs font-medium text-[#D4AF37]/60">.00</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-2 mb-6">
          {days.map((day) => {
            const isCompleted = day <= currentStreak;
            const isToday = day === currentStreak + 1;
            
            return (
              <div key={day} className="flex flex-col items-center gap-2 flex-1">
                <div className={[
                  "flex h-11 w-full items-center justify-center rounded border transition-all duration-300",
                  isCompleted 
                    ? "bg-[#D4AF37]/5 border-[#D4AF37]/40 shadow-[0_0_10px_rgba(212,175,55,0.05)] text-[#D4AF37]" 
                    : isToday && !isClaimedToday
                    ? "bg-white border-white animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.2)] text-black"
                    : "bg-black border-zinc-900 text-zinc-700"
                ].join(" ")}>
                  {isCompleted ? (
                    <ShieldCheck className="size-4" strokeWidth={2.5} />
                  ) : isToday && !isClaimedToday ? (
                    <span className="text-xs font-bold tracking-tight">₹50</span>
                  ) : (
                    <span className="text-[9px] font-bold tracking-widest uppercase">D{day}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="size-3.5" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Grace period: 14h 22m</span>
          </div>
          
          <button className="flex items-center gap-1.5 bg-white hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] text-black px-5 py-2.5 rounded font-bold text-[10px] uppercase tracking-widest transition-all duration-300">
            Secure Dividend <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
