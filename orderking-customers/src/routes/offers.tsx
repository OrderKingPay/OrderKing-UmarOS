
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Tag, Utensils } from "lucide-react";
import { CustomerShell } from "@/components/market/shell";
import { useT } from "@/components/providers";
import { listPromos } from "@/lib/server/account";
import { formatPaise } from "@/lib/money";
import { useCartStore } from "@/lib/stores/cart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/offers")({ component: OffersPage });

function OffersPage() {
  const { t, lang } = useT();
  const locale = lang === "bn" ? "bn-IN" : "en-IN";
  const setCoupon = useCartStore((s) => s.setCoupon);
  const promos = useQuery({ queryKey: ["promos"], queryFn: () => listPromos() });
  const serverPromos = promos.data?.promos ?? [];

  return (
    <CustomerShell>
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] px-4 py-5 pb-28">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-black text-stone-900 tracking-tight">
              {t("offers.title")}
            </h1>
            <p className="mt-0.5 text-xs font-bold text-orange-900">
              Available coupons and restaurant discounts
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-400/20 border border-orange-400/40 px-3 py-1 text-xs font-black text-orange-950 shadow-2xs">
            <Tag className="size-3.5 text-orange-700" />
            <span>{serverPromos.length} Deals</span>
          </span>
        </div>

        {serverPromos.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xs">
            <Tag className="mx-auto size-8 text-stone-400" />
            <h2 className="mt-3 font-display text-base font-bold text-stone-900">
              No active coupons right now
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Active restaurant and platform promotions will appear here once published.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-3.5">
            <div className="flex items-center gap-2">
              <Utensils className="size-4 text-orange-600" />
              <h2 className="font-display text-lg font-black text-stone-900">Partner Kitchen Deals</h2>
            </div>
            <ul className="space-y-3">
              {serverPromos.map((p) => (
                <li
                  key={p.id}
                  className="rounded-2xl border border-orange-950/10 bg-white/95 backdrop-blur-md p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.12)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-extrabold text-stone-900 text-sm">{p.name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {p.fundedBy === "RESTAURANT"
                        ? t("offers.fundedByRestaurant")
                        : p.fundedBy === "PLATFORM"
                          ? t("offers.fundedByPlatform")
                          : t("offers.fundedByShared")}
                    </p>
                    <p className="text-[11px] font-bold text-orange-900 mt-1">
                      {t("offers.min", { amount: formatPaise(p.minOrderPaise, { locale }) })}
                    </p>
                  </div>
                  {p.code ? (
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg border border-dashed border-orange-300 bg-orange-50 px-2 py-1 font-mono text-xs font-bold text-orange-950">
                        {p.code}
                      </span>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-orange-500 to-orange-500 text-white font-bold text-xs rounded-xl shadow-xs"
                        onClick={() => {
                          setCoupon(p.code!);
                          toast.success(t("cart.applied"));
                        }}
                      >
                        {t("cart.apply")}
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
