import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Crown, ShieldCheck, Sparkles } from "lucide-react";
import { KingPayShell, type KingPaySection } from "@/components/fintech/kingpay-shell";
import { CustomerConciergeDrawer } from "@/components/ai/customer-concierge-drawer";

export const Route = createFileRoute("/king-pay/assist")({ component: KingAssistPage });

function KingAssistPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<KingPaySection>("account");
  const [open, setOpen] = useState(true);
  return (
    <KingPayShell
      onAddMoneyClick={() => void navigate({ to: "/king-pay" })}
      onOpenScannerClick={() => void navigate({ to: "/king-pay" })}
      activeSection={activeSection}
      onSelectSection={(next) => { setActiveSection(next); void navigate({ to: "/king-pay" }); }}
    >
      <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-5">
        <header className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-emerald-950 to-slate-950 p-5">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-amber-200">
            <Crown className="size-7" /> King Assist
          </h1>
          <p className="mt-2 text-sm text-slate-200">
            Ask about King Pay, UPI, bill split, refunds, EMI calculations and anything else.
            Assistance is read-only and does not execute financial transactions.
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-300">
            <ShieldCheck className="size-4" /> No administrative access
          </span>
        </header>
        <CustomerConciergeDrawer open={open} onClose={() => setOpen(false)} area="kingpay" embedded />
        {!open && (
          <button onClick={() => setOpen(true)} type="button"
            className="rounded-xl bg-amber-400 px-4 py-3 font-semibold text-slate-950">
            <Sparkles className="mr-2 inline size-4" /> Open King Assist
          </button>
        )}
        <Link to="/support" className="inline-block text-sm text-amber-200 underline">
          Visit account support
        </Link>
      </div>
    </KingPayShell>
  );
}
