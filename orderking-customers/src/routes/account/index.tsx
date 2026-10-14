
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CustomerShell } from "@/components/market/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeviceAvatar } from "@/components/common/device-avatar";
import { useBrand, useT } from "@/components/providers";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ensureProfile, getLoyalty, requestDeletion, updateProfile } from "@/lib/server/account";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/account/")({ component: AccountPage });

function AccountPage() {
  const { t, lang, setLang } = useT();
  const { brand, domain } = useBrand();
  const { user, isPending } = useCurrentUserState();
  const [name, setName] = useState(user?.displayName ?? "");
  const [phone, setPhone] = useState("");

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => ensureProfile({ data: { name: user?.displayName ?? undefined, language: lang } }),
    enabled: Boolean(user),
  });
  const loyalty = useQuery({
    queryKey: ["loyalty"],
    queryFn: () => getLoyalty(),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (profile.data?.profile?.display_name) setName(profile.data.profile.display_name);
    if (profile.data?.profile?.phone) setPhone(profile.data.profile.phone);
  }, [profile.data]);

  return (
    <CustomerShell>
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] px-4 py-5 pb-28">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-black text-stone-900 tracking-tight">
              {t("account.title")}
            </h1>
            <p className="mt-0.5 text-xs font-bold text-amber-800">
              VIP Profile &amp; Royal Privileges
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 px-3 py-1 text-xs font-black text-amber-950 shadow-2xs">
            <span>👑</span>
            <span>Prestige Member</span>
          </span>
        </div>

        {isPending ? (
          <div className="mt-6 space-y-3 animate-pulse">
            <div className="h-32 bg-gradient-to-r from-amber-100 via-amber-200/60 to-amber-100 rounded-3xl" />
            <div className="h-24 bg-gradient-to-r from-amber-100 via-amber-200/60 to-amber-100 rounded-3xl" />
          </div>
        ) : !user ? (
          <div className="mt-6 rounded-3xl border border-amber-300/50 bg-white/95 backdrop-blur-md p-8 text-center shadow-[0_12px_40px_rgba(245,158,11,0.08)]">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800 shadow-inner">
              <span className="text-3xl">👑</span>
            </div>
            <h2 className="mt-4 font-display text-2xl font-black text-stone-900">{t("account.guest")}</h2>
            <p className="mt-1 text-sm text-stone-600 max-w-xs mx-auto">{t("account.guestHint")}</p>
            <div className="mt-6">
              <Button className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black px-7 py-3 rounded-2xl shadow-lg shadow-orange-500/25 hover:from-amber-600 hover:to-orange-600 transition-all" asChild>
                <Link to="/login">{t("common.signIn")}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Crown VIP Profile Card */}
            <div className="mt-5 relative overflow-hidden rounded-3xl border-2 border-amber-400/60 bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 p-6 text-white shadow-2xl">
              <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-gradient-to-br from-amber-400/25 to-yellow-300/15 blur-2xl" />
              <div className="relative flex items-center gap-4">
                <div className="relative size-16 shrink-0 rounded-2xl ring-2 ring-amber-400/80 p-0.5 bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-md shadow-amber-400/30 flex items-center justify-center">
                  <DeviceAvatar userId={user.id} name={user.displayName} />
                  <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-amber-400 text-stone-950 text-[10px] font-black shadow-xs">
                    👑
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-black text-white truncate">
                      {name || user.displayName || "OrderKing Royalty"}
                    </h2>
                    <span className="rounded-full bg-amber-400/20 border border-amber-400/50 px-2 py-0.2 text-[9px] font-black uppercase tracking-wider text-amber-300">
                      VIP Gold
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 truncate mt-0.5">{user.primaryEmail}</p>
                  {phone && <p className="text-[11px] font-mono text-amber-200 mt-0.5">📞 {phone}</p>}
                </div>
              </div>
            </div>

            {/* Profile Edit Form */}
            <form
              className="mt-4 rounded-3xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                void updateProfile({ data: { name, phone, language: lang } }).then(() => toast.success(t("account.saved")));
              }}
            >
              <div className="flex items-center gap-2 pb-2 border-b border-amber-900/10">
                <span className="text-amber-600 text-sm">✏️</span>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-800">
                  Personal Profile Details
                </h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-stone-700">
                  {t("account.name")}
                  <Input
                    className="mt-1 rounded-xl border-amber-200 bg-amber-50/30 text-stone-900 font-medium h-10 text-xs focus:bg-white focus:border-amber-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label className="block text-xs font-bold text-stone-700">
                  {t("account.phone")}
                  <Input
                    className="mt-1 rounded-xl border-amber-200 bg-amber-50/30 text-stone-900 font-medium h-10 text-xs focus:bg-white focus:border-amber-500"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                  />
                </label>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-stone-500 font-medium">Primary: {user.primaryEmail}</span>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-extrabold px-5 rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition-all text-xs h-9"
                >
                  {t("common.save")}
                </Button>
              </div>
            </form>
          </>
        )}

        {/* KINGPAY WALLET & VEHICLE GARAGE */}
        <section className="mt-8 overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-emerald-950/20 via-surface to-amber-500/15 p-5 shadow-lg relative group">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0D3B2E] via-emerald-700 to-[#07241C] p-0.5 shadow-md ring-2 ring-amber-400/60">
                <span className="text-2xl">👑</span>
                <span className="absolute -top-1 -right-1 flex size-3">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-amber-500" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-display text-lg font-black text-fg tracking-tight">
                    King<span className="text-amber-500">Pay</span>
                  </h2>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.2 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                    NPCI UPI
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  King Pay Wallet, Vehicle Garage &amp; Bill Payments
                </p>
              </div>
            </div>

            <Link
              to="/king-pay"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-2 text-xs font-black text-black shadow-md hover:from-amber-400 hover:to-amber-500 transition flex items-center gap-1 shrink-0"
            >
              <span>Open KingPay</span>
              <span>➔</span>
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-amber-500/20 pt-3 text-center">
            <Link to="/king-pay" className="rounded-xl bg-surface-2/60 p-2 hover:bg-surface-2 transition">
              <span className="text-base block mb-0.5">💳</span>
              <span className="text-[11px] font-bold text-fg block">1-Tap Wallet</span>
              <span className="text-[9px] text-emerald-600 font-semibold">0% PG Fees</span>
            </Link>
            <Link to="/king-pay" className="rounded-xl bg-surface-2/60 p-2 hover:bg-surface-2 transition">
              <span className="text-base block mb-0.5">🚗</span>
              <span className="text-[11px] font-bold text-fg block">Vehicle Garage</span>
              <span className="text-[9px] text-amber-600 font-semibold">e-Challan Radar</span>
            </Link>
            <Link to="/king-pay" className="rounded-xl bg-surface-2/60 p-2 hover:bg-surface-2 transition">
              <span className="text-base block mb-0.5">⚡</span>
              <span className="text-[11px] font-bold text-fg block">Bill Payments</span>
              <span className="text-[9px] text-primary font-semibold">BBPS 2% Back</span>
            </Link>
          </div>
        </section>

        {user ? (
          <section className="mt-8 overflow-hidden rounded-[var(--radius-xl)] border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-surface to-amber-500/5 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  ⭐ OrderKing Gold VIP
                </span>
                <h2 className="mt-1.5 font-display text-xl font-bold">
                  {t("account.loyalty", { name: brand.appName })}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">
                  {loyalty.data?.loyalty.points ?? 0} <span className="text-xs font-semibold">pts</span>
                </p>
                <p className="text-[11px] font-medium text-muted">
                  ≈ ₹{Math.round((loyalty.data?.loyalty.points ?? 0) * 0.3)} Wallet Credit
                </p>
              </div>
            </div>

            {/* VIP Tier Perks Bar */}
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-amber-500/20 pt-3 text-center">
              <div className="rounded-lg bg-surface/70 p-2">
                <span className="text-base">🚀</span>
                <p className="mt-0.5 text-[11px] font-bold">Free Delivery</p>
                <p className="text-[10px] text-muted">Orders &gt; ₹299</p>
              </div>
              <div className="rounded-lg bg-surface/70 p-2">
                <span className="text-base">💎</span>
                <p className="mt-0.5 text-[11px] font-bold">Up to 5% Back</p>
                <p className="text-[10px] text-muted">On every order</p>
              </div>
              <div className="rounded-lg bg-surface/70 p-2">
                <span className="text-base">⚡</span>
                <p className="mt-0.5 text-[11px] font-bold">Priority Bot</p>
                <p className="text-[10px] text-muted">Instant refund</p>
              </div>
            </div>

            {/* Next Tier Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-muted">
                <span>Current Tier: Gold</span>
                <span>Next Tier: Diamond (15,000 pts)</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(10, ((loyalty.data?.loyalty.points ?? 0) / 15000) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-amber-500/20 pt-3">
              <span className="text-xs text-muted">Redeem for Fuel, Retail & Free Courses</span>
              <Button size="sm" variant="primary" asChild>
                <Link to="/rewards">Rewards Vault →</Link>
              </Button>
            </div>
          </section>
        ) : null}

        {user ? (
          <section className="mt-4 rounded-[var(--radius-xl)] border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-surface to-emerald-500/5 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-xl">
                  🎁
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-fg">Share OrderKing with Friends</h3>
                  <p className="text-xs text-muted">Invite friends to discover OrderKing. Cash referrals and voucher offers are not active.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-surface p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Referral program</span>
                <p className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-300">Not active</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText("https://www.orderkingpay.com/?src=invite");
                  toast.success("OrderKing invitation link copied. No cash reward is offered.");
                }}
                className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-fg hover:bg-surface-3 transition"
              >
                Copy Link
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent("Explore OrderKing services in your area: https://www.orderkingpay.com/?src=invite. No referral cash or voucher is promised.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-fg shadow-xs hover:bg-emerald-700 transition"
              >
                <span>💬</span>
                <span>Invite via WhatsApp</span>
              </a>
            </div>
          </section>
        ) : null}

        {/* VIP Navigation Menu */}
        <nav className="mt-8 space-y-2.5 text-sm">
          <Link
            className="flex items-center justify-between rounded-2xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-3.5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all no-underline group"
            to="/settings"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xs">
                ⚙️
              </div>
              <span className="font-extrabold text-stone-900 group-hover:text-amber-800 transition-colors">
                App Settings &amp; Language Preferences
              </span>
            </div>
            <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
              12 Languages ➔
            </span>
          </Link>

          <Link
            className="flex items-center justify-between rounded-2xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-3.5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all no-underline group"
            to="/king-pay"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs">
                💳
              </div>
              <span className="font-extrabold text-stone-900 group-hover:text-amber-800 transition-colors">
                KingPay (Wallet, Bills &amp; Travel)
              </span>
            </div>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              Fintech Hub ➔
            </span>
          </Link>

          <Link
            className="flex items-center justify-between rounded-2xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-3.5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all no-underline group"
            to="/rewards"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xs">
                🎁
              </div>
              <span className="font-extrabold text-stone-900 group-hover:text-amber-800 transition-colors">
                King Club Rewards Vault
              </span>
            </div>
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
              Fuel &amp; Alliances ➔
            </span>
          </Link>

          <Link
            className="flex items-center justify-between rounded-2xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-3.5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all no-underline group"
            to="/offers"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-xs">
                🎟️
              </div>
              <span className="font-extrabold text-stone-900 group-hover:text-amber-800 transition-colors">
                {t("account.offers")}
              </span>
            </div>
            <span className="text-xs font-bold text-stone-400 group-hover:text-amber-800">➔</span>
          </Link>

          <Link
            className="flex items-center justify-between rounded-2xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-3.5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all no-underline group"
            to="/support"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xs">
                💬
              </div>
              <span className="font-extrabold text-stone-900 group-hover:text-amber-800 transition-colors">
                {t("common.support")}
              </span>
            </div>
            <span className="rounded-full bg-violet-50 border border-violet-200 px-2.5 py-0.5 text-[10px] font-bold text-violet-700">
              24x7 AI Bot ➔
            </span>
          </Link>

          <Link
            className="flex items-center justify-between rounded-2xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-3.5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all no-underline group"
            to="/legal/privacy"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-stone-400 to-stone-600 text-white shadow-xs">
                🛡️
              </div>
              <span className="font-extrabold text-stone-900 group-hover:text-amber-800 transition-colors">
                {t("account.privacy")}
              </span>
            </div>
            <span className="text-xs font-bold text-stone-400 group-hover:text-amber-800">➔</span>
          </Link>

          <Link
            className="flex items-center justify-between rounded-2xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-3.5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all no-underline group"
            to="/legal/terms"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-stone-400 to-stone-600 text-white shadow-xs">
                ⚖️
              </div>
              <span className="font-extrabold text-stone-900 group-hover:text-amber-800 transition-colors">
                {t("account.terms")}
              </span>
            </div>
            <span className="text-xs font-bold text-stone-400 group-hover:text-amber-800">➔</span>
          </Link>

          <Link
            className="flex items-center justify-between rounded-2xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-3.5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all no-underline group"
            to="/legal/refunds"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-stone-400 to-stone-600 text-white shadow-xs">
                ↩️
              </div>
              <span className="font-extrabold text-stone-900 group-hover:text-amber-800 transition-colors">
                {t("account.refunds")}
              </span>
            </div>
            <span className="text-xs font-bold text-stone-400 group-hover:text-amber-800">➔</span>
          </Link>

          <Link
            className="flex items-center justify-between rounded-2xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-3.5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all no-underline group"
            to="/about"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-xs">
                👑
              </div>
              <span className="font-extrabold text-stone-900 group-hover:text-amber-800 transition-colors">
                {t("account.about", { name: brand.appName })}
              </span>
            </div>
            <span className="text-xs font-bold text-stone-400 group-hover:text-amber-800">➔</span>
          </Link>
        </nav>

        {user ? (
          <Button
            className="mt-8"
            variant="ghost"
            onClick={() =>
              void requestDeletion().then(() => toast.success(t("account.deleteDone")))
            }
          >
            {t("account.delete")}
          </Button>
        ) : null}
        <p className="mt-2 text-xs text-muted">{t("account.deleteHint")}</p>
        <p className="mt-8 text-xs text-subtle">{domain.webUrl}</p>
      </div>
    </CustomerShell>
  );
}
