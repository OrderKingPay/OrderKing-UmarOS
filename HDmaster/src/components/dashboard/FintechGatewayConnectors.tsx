import { ShieldAlert, LockKeyhole, ServerCog } from "lucide-react";

type Provider = {
  id: string;
  name: string;
  purpose: string;
  requirement: string;
};

const providers: Provider[] = [
  {
    id: "merchant_upi",
    name: "Merchant UPI acquiring",
    purpose: "UPI collect and merchant QR payments",
    requirement: "Authorized acquiring/PSP provider, approved merchant, and signed payment verification",
  },
  {
    id: "payouts",
    name: "Merchant and rider payouts",
    purpose: "Beneficiary-verified disbursements and settlement reconciliation",
    requirement: "Authorized payout provider, approved beneficiaries, verified transfer and bank reconciliation",
  },
  {
    id: "bbps",
    name: "Bill payments",
    purpose: "Provider-backed utility and recurring bill workflows",
    requirement: "Eligible BBPS integration and contracted provider verification",
  },
];

/**
 * Read-only safety boundary until an authenticated server endpoint can attest
 * specific provider capabilities. No client-side credential collection and no
 * optimistic "Connected" state based on a timer or key-looking text.
 */
export const FintechGatewayConnectors = () => {
  return (
    <section
      aria-labelledby="financial-provider-readiness"
      className="overflow-hidden rounded-2xl border border-amber-300/30 bg-slate-950 text-slate-100 shadow-xl"
    >
      <header className="border-b border-amber-300/20 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-amber-300" />
          <div>
            <h2 id="financial-provider-readiness" className="text-lg font-bold tracking-wide text-white">
              Financial integrations — verification required
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              No live provider connection is verified by this dashboard. Financial features remain gated
              until a server-side integration proves onboarding, authorization and transaction readiness.
            </p>
          </div>
        </div>
      </header>

      <div className="divide-y divide-white/10">
        {providers.map((provider) => (
          <div key={provider.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-start">
            <div>
              <h3 className="font-semibold text-slate-100">{provider.name}</h3>
              <p className="mt-1 text-sm text-slate-300">{provider.purpose}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">{provider.requirement}</p>
            </div>
            <span className="inline-flex h-fit items-center gap-1.5 self-start rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-200">
              <LockKeyhole aria-hidden="true" className="h-3.5 w-3.5" />
              Unverified
            </span>
          </div>
        ))}
      </div>

      <footer className="flex gap-3 border-t border-white/10 bg-slate-900/80 p-5 text-sm leading-relaxed text-slate-200">
        <ServerCog aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
        <p>
          Configure secrets only in the authorized server/Cloudflare environment, never in this browser.
          When a verified backend capability endpoint is implemented, replace this conservative status
          with authenticated, timestamped provider checks. Never mark a provider connected from a timeout.
        </p>
      </footer>
    </section>
  );
};
