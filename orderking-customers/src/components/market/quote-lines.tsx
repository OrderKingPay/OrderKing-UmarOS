
import { useT } from "@/components/providers";
import { formatPaise } from "@/lib/money";
import type { QuoteLine } from "@/lib/pricing";
import { Sparkles, ShieldCheck, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuoteLines({ lines, locale }: { lines: QuoteLine[]; locale: string }) {
  const { t } = useT();
  const visible = lines.filter((l) => l.code !== "TOTAL" && (l.amountPaise !== 0 || l.code === "DELIVERY"));
  const total = lines.find((l) => l.code === "TOTAL");
  const label = (code: string, fallback: string) => {
    const key = `quote.${code}`;
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  return (
    <div className="space-y-2.5 text-sm">
      {visible.map((line) => {
        const isDiscount = line.amountPaise < 0;
        const isFreeDelivery = line.code === "DELIVERY" && line.amountPaise === 0;

        return (
          <div
            key={line.code}
            className={cn(
              "flex items-start justify-between gap-4 py-1 px-1 rounded-xl transition-all duration-200 transform-gpu",
              isDiscount ? "bg-emerald-50/70 border border-emerald-200/60 p-2 text-emerald-950" : ""
            )}
          >
            <div>
              <p className={cn("text-xs sm:text-sm font-bold flex items-center gap-1.5", isDiscount ? "text-emerald-900" : "text-gray-900")}>
                {isDiscount && <Sparkles className="size-3 text-emerald-600 shrink-0" />}
                {label(line.code, line.name)}
              </p>
              {line.reason && (
                <p className={cn("text-[11px] mt-0.5", isDiscount ? "text-emerald-700" : "text-gray-500")}>
                  {line.reason}
                </p>
              )}
            </div>

            <div className="text-right shrink-0">
              {isFreeDelivery ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-md shadow-2xs">
                  <Sparkles className="size-2.5 text-emerald-600 fill-emerald-500" />
                  WAIVED
                </span>
              ) : (
                <p
                  className={cn(
                    "tabular-nums text-xs sm:text-sm font-black",
                    isDiscount ? "text-emerald-700" : "text-gray-950"
                  )}
                >
                  {formatPaise(line.amountPaise, { locale })}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* 24K Gold & Obsidian Luxury Grand Total Card */}
      {total ? (
        <div
          className="relative overflow-hidden mt-3 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex items-center justify-between text-white shadow-[0_8px_25px_rgba(245,158,11,0.22)] border border-amber-400/40 transform-gpu transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #09090b 0%, #17140f 50%, #0d0a06 100%)",
          }}
        >
          {/* Specular ambient gold highlight */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="flex size-5 items-center justify-center rounded-md bg-amber-400/20 border border-amber-400/40 text-amber-300 shadow-2xs">
                <Crown className="size-3 text-amber-300" />
              </span>
              <span className="font-display text-sm sm:text-base font-black tracking-tight text-amber-100">
                {t("cart.toPay") || "To Pay"}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-amber-300/70 flex items-center gap-1">
              <ShieldCheck className="size-3 text-emerald-400" />
              <span>Inclusive of statutory taxes &amp; GST</span>
            </p>
          </div>

          {/* 24K Gold Sovereign Amount Pill */}
          <div className="relative z-10 flex items-center gap-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-3.5 sm:px-4 py-2 text-stone-950 font-black shadow-[0_4px_14px_rgba(245,158,11,0.45)] border border-amber-200">
            <span className="text-base sm:text-lg tabular-nums tracking-tight">
              {formatPaise(total.amountPaise, { locale })}
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500 pt-1">
        <ShieldCheck className="size-3 text-emerald-600" />
        <span>FSSAI &amp; GST Compliant SafeInteger Pricing</span>
      </div>
    </div>
  );
}
