import { Flame, Lock, Unlock } from "lucide-react";

export function DailyStreakWidget() {
  const currentStreak = 3;
  const days = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="my-4 rounded-3xl border border-white/10 bg-[#0a0a0a] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-fg text-lg">Royal Dining Streak</h3>
          <p className="text-xs text-muted mt-0.5">Order today to keep your streak alive.</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-[#D4AF37]/10 px-3 py-1 border border-[#D4AF37]/30">
          <Flame className="size-4 text-[#F59E0B]" />
          <span className="font-bold text-[#D4AF37] text-xs">{currentStreak} Day Streak</span>
        </div>
      </div>

      <div className="flex justify-between items-center gap-1.5">
        {days.map((day) => {
          const isCompleted = day <= currentStreak;
          const isToday = day === currentStreak + 1;
          const isGrandPrize = day === 7;
          
          return (
            <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
              <div className={[
                "flex h-9 w-full items-center justify-center rounded-xl border transition-all",
                isCompleted 
                  ? "bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.4)]" 
                  : isToday
                  ? "bg-zinc-800 border-white/30"
                  : "bg-black border-white/5"
              ].join(" ")}>
                {isCompleted ? (
                  <Flame className="size-4 text-black" />
                ) : isGrandPrize ? (
                  <Lock className="size-3.5 text-zinc-500" />
                ) : (
                  <span className="text-xs font-bold text-zinc-500">D{day}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center mt-3 text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
        Unlock ₹500 Flat Off on Day 7
      </p>
    </div>
  );
}
