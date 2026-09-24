import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CustomerShell } from "@/components/market/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <div className="px-4 py-5">
        <h1 className="font-display text-3xl">{t("account.title")}</h1>
        {isPending ? (
          <p className="mt-4 text-muted">{t("common.loading")}</p>
        ) : !user ? (
          <div className="mt-6">
            <p>{t("account.guest")}</p>
            <p className="text-sm text-muted">{t("account.guestHint")}</p>
            <Button className="mt-4" asChild>
              <Link to="/login">{t("common.signIn")}</Link>
            </Button>
          </div>
        ) : (
          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void updateProfile({ data: { name, phone, language: lang } }).then(() => toast.success(t("account.saved")));
            }}
          >
            <label className="block text-sm">
              {t("account.name")}
              <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block text-sm">
              {t("account.phone")}
              <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
            </label>
            <p className="text-sm text-muted">{user.primaryEmail}</p>
            <Button type="submit">{t("common.save")}</Button>
          </form>
        )}

        {/* KINGPAY SOVEREIGN FINTECH & VEHICLE GARAGE */}
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
                  Sovereign Wallet, Vehicle Garage &amp; BBPS Utilities
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
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-xl">
                  🎁
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-fg">Refer & Earn Wallet Cash</h3>
                  <p className="text-xs text-muted">Give ₹40 + Free Delivery, Get ₹25 for every friend who orders (min ₹249)</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-surface p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Your Referral Code</span>
                <p className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-300">KINGVIP</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText("KINGVIP");
                  toast.success("Referral code copied!");
                }}
                className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-fg hover:bg-surface-3 transition"
              >
                Copy Code
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent("Hey! Use my referral code KINGVIP to get ₹40 OFF + Free Delivery on your first delicious food order on OrderKing: https://orderking.in/?ref=KINGVIP")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                <span>💬</span>
                <span>Invite via WhatsApp</span>
              </a>
            </div>
          </section>
        ) : null}

        <nav className="mt-8 space-y-2 text-sm">
          <Link className="flex min-h-11 items-center justify-between rounded-[var(--radius-md)] bg-surface px-3 py-3 text-fg no-underline border border-border/80 hover:bg-surface-2 transition" to="/settings">
            <div className="flex items-center gap-2">
              <span>⚙️</span>
              <span className="font-medium">App Settings &amp; Language Preferences</span>
            </div>
            <span className="rounded bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">12 Indian Languages</span>
          </Link>
          <Link className="flex min-h-11 items-center justify-between rounded-[var(--radius-md)] bg-surface px-3 py-3 text-fg no-underline" to="/king-pay">
            <span className="font-medium">💳 KingPay (Wallet, Bills & Travel)</span>
            <span className="rounded bg-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">Fintech Hub</span>
          </Link>
          <Link className="flex min-h-11 items-center justify-between rounded-[var(--radius-md)] bg-surface px-3 py-3 text-fg no-underline" to="/rewards">
            <span className="font-medium">🎁 King Club Rewards Vault</span>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">Fuel & Alliances</span>
          </Link>
          <Link className="block min-h-11 rounded-[var(--radius-md)] bg-surface px-3 py-3 text-fg no-underline" to="/offers">
            {t("account.offers")}
          </Link>
          <Link className="block min-h-11 rounded-[var(--radius-md)] bg-surface px-3 py-3 text-fg no-underline" to="/support">
            {t("common.support")}
          </Link>
          <Link className="block min-h-11 rounded-[var(--radius-md)] bg-surface px-3 py-3 text-fg no-underline" to="/legal/privacy">
            {t("account.privacy")}
          </Link>
          <Link className="block min-h-11 rounded-[var(--radius-md)] bg-surface px-3 py-3 text-fg no-underline" to="/legal/terms">
            {t("account.terms")}
          </Link>
          <Link className="block min-h-11 rounded-[var(--radius-md)] bg-surface px-3 py-3 text-fg no-underline" to="/legal/refunds">
            {t("account.refunds")}
          </Link>
          <Link className="block min-h-11 rounded-[var(--radius-md)] bg-surface px-3 py-3 text-fg no-underline" to="/about">
            {t("account.about", { name: brand.appName })}
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
