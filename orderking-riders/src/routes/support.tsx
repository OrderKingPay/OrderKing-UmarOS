// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/rider/app-shell";
import { ShieldAlert, PhoneCall, Wrench, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/support")({
  component: RiderSupportPage,
});

function RiderSupportPage() {
  const [ticketNotice, setTicketNotice] = useState<string | null>(null);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4 text-slate-100">
        <div className="rounded-2xl border border-[#1E283D] bg-[#121723] p-5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="size-5 text-[#E5A93C]" />
              <span>24x7 Fleet Dispatch &amp; Emergency Roadside Support</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant RSA dispatch, customer unreachable timer, and photo/video proof upload.
            </p>
          </div>
          <Link
            to="/assistant"
            className="rounded-xl bg-[#E5A93C] text-black font-bold text-xs px-3.5 py-2"
          >
            Upload Proof →
          </Link>
        </div>

        {ticketNotice && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span>{ticketNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              title: "24x7 Roadside Assistance (RSA)",
              desc: "Flat tyre, fuel emergency, or bike breakdown during active shift",
              action: "RSA Patrol Dispatched to your live GPS coordinates (ETA 14 mins).",
            },
            {
              title: "Customer Unreachable at Doorstep",
              desc: "Start mandatory 5-minute wait timer when customer does not provide 4-digit OTP",
              action: "5-minute doorstep wait timer started & SMS alert sent via Fast2SMS/2Factor.",
            },
            {
              title: "Restaurant Delay (&gt;15 mins)",
              desc: "Claim ₹1/min wait-time compensation automatically credited in paise",
              action: "Wait-time compensation tracker activated for current restaurant pickup.",
            },
            {
              title: "Order Spill / Packaging Damage",
              desc: "Log damaged item & request replacement dispatch without penalty",
              action: "Packaging damage logged; upload photo on Support Assistant screen.",
            },
          ].map((card, i) => (
            <div key={i} className="rounded-2xl border border-[#1E283D] bg-[#121723] p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-white">{card.title}</div>
                <div className="text-xs text-slate-400 mt-1">{card.desc}</div>
              </div>
              <Button
                type="button"
                onClick={() => setTicketNotice(card.action)}
                className="w-full h-9 bg-[#0E121B] hover:bg-slate-800 border border-[#1E283D] text-[#E5A93C] text-xs font-bold rounded-xl"
              >
                Trigger Action
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
