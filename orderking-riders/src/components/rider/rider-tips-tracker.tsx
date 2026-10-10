import { useState } from "react";
import { Coins, Award, CloudRain, Zap, TrendingUp, CheckCircle2, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface TipRecord {
  id: string;
  orderCode: string;
  amountPaise: number;
  timeAgo: string;
  customerNote?: string;
}

export function RiderTipsTracker() {
  const [tips, setTips] = useState<TipRecord[]>([
    { id: "t-1", orderCode: "OK-94281", amountPaise: 5000, timeAgo: "15m ago", customerNote: "Advanced fast in the rain! ⭐" },
    { id: "t-2", orderCode: "OK-94274", amountPaise: 3000, timeAgo: "1h ago" },
    { id: "t-3", orderCode: "OK-94269", amountPaise: 5000, timeAgo: "3h ago", customerNote: "Followed instructions perfectly." },
    { id: "t-4", orderCode: "OK-94260", amountPaise: 2000, timeAgo: "5h ago" },
  ]);

  const totalTipsPaise = tips.reduce((sum, t) => sum + t.amountPaise, 0);

  // Daily Incentive Milestone
  const deliveriesCompleted = 12;
  const nextTarget = 15;
  const milestoneBonusPaise = 25000; // ₹250

  return (
    <div className="space-y-4">
      {/* Top Tips & Surcharges Summary Card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 p-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-100 font-medium">Today's Customer Tips</p>
            <h3 className="font-display text-2xl font-black mt-0.5">
              ₹{(totalTipsPaise / 100).toFixed(0)}
            </h3>
          </div>
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/20 text-2xl">
            💰
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-white/20 pt-2.5">
          <div className="flex items-center gap-1.5">
            <CloudRain className="size-4 text-sky-200" />
            <span>Rain Bonus: <strong>₹60/trip</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="size-4 text-amber-200" />
            <span>Peak Surge: <strong>1.4x</strong></span>
          </div>
        </div>
      </div>

      {/* Daily Incentive Milestone Card */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-amber-500" />
            <h4 className="text-xs font-bold text-fg">Daily Milestone Incentive</h4>
          </div>
          <span className="text-xs font-bold text-primary">₹{(milestoneBonusPaise / 100).toFixed(0)} Bonus</span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-muted font-medium">
            <span>{deliveriesCompleted} of {nextTarget} orders completed</span>
            <span>{nextTarget - deliveriesCompleted} more to unlock bonus</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(deliveriesCompleted / nextTarget) * 100}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Tips Breakdown List */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-fg flex items-center gap-1.5">
          <Coins className="size-3.5 text-primary" /> Recent Tip Earnings
        </h4>
        <div className="space-y-1.5">
          {tips.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-2.5 text-xs"
            >
              <div>
                <p className="font-semibold text-fg">Order #{t.orderCode}</p>
                <p className="text-[10px] text-muted">{t.timeAgo}</p>
                {t.customerNote && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 italic mt-0.5">
                    "{t.customerNote}"
                  </p>
                )}
              </div>
              <span className="font-display font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                +₹{(t.amountPaise / 100).toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
