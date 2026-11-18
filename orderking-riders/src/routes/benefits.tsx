import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { RiderBenefitsHub } from "@/components/rider/rider-benefits-hub";
import { bootstrapRiderFn, getHomeFn } from "@/lib/server/rider-fns";
import type { RiderProfile } from "@/lib/rider/types";
import { Card, CardMeta, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Banknote,
  Clock,
  Phone,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/benefits")({
  beforeLoad: ({ context }) => {
    return { sessionUser: context?.sessionUser ?? null };
  },
  component: BenefitsPage,
});

export function BenefitsPage() {
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [lifetimeTrips, setLifetimeTrips] = useState(0);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    void bootstrapRiderFn()
      .then((r) => {
        if (r) setRider(r);
      })
      .catch(() => undefined)
      .finally(() => setCheckedAuth(true));

    void getHomeFn()
      .then((h) => {
        if (h?.rider) {
          setLifetimeTrips(h.rider.lifetimeDeliveries ?? h.completedToday ?? 0);
        }
      })
      .catch(() => undefined);
  }, []);

  if (rider?.id) {
    return (
      <AppShell>
        <RiderBenefitsHub
          lifetimeDeliveries={lifetimeTrips}
          riderName={rider.fullName}
          riderId={rider.id}
        />
      </AppShell>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/login" className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary">
            <ArrowLeft className="size-4" />
            <span>Back to Sign In</span>
          </Link>
          <span className="font-display text-sm font-bold">OrderKing Delivery Partner</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold">Partner Rate Card &amp; Statutory Welfare</h1>
            <Badge tone="online">Assam Fleet</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Standard statutory delivery tariff, payout schedule, and Code on Social Security 2020 coverage.
            {!checkedAuth ? " Checking partner session…" : ""}
          </p>
        </div>

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Banknote className="size-4 text-primary" />
            <CardTitle className="text-sm">Statutory Delivery Tariff</CardTitle>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Base Delivery Floor</p>
              <p className="font-mono text-base font-bold mt-0.5">₹35.00</p>
              <p className="text-[11px] text-muted-foreground">Covers first 2.0 km per completed trip</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Distance Pay</p>
              <p className="font-mono text-base font-bold mt-0.5">₹12.00 / km</p>
              <p className="text-[11px] text-muted-foreground">2.0–5.0 km slab · ₹15.00/km beyond 5.0 km</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Kitchen Wait-Time Pay</p>
              <p className="font-mono text-base font-bold mt-0.5">₹1.00 / min</p>
              <p className="text-[11px] text-muted-foreground">Applies after 6-minute restaurant grace period</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Customer Tips</p>
              <p className="font-mono text-base font-bold mt-0.5">Direct Pass-Through</p>
              <p className="text-[11px] text-muted-foreground">Zero platform commission deducted on tips</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-primary" />
            <CardTitle className="text-sm">Payout &amp; Settlement Schedule</CardTitle>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <p className="font-bold">Weekly Scheduled Settlement</p>
              <p className="text-muted-foreground">Every Wednesday at 14:00 IST via NEFT / UPI. ₹0 processing fee.</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <p className="font-bold">On-Demand Early Withdrawal</p>
              <p className="text-muted-foreground">IMPS transfer to verified bank/UPI account. Flat ₹10 fee (discounted on Gold/Diamond tiers).</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600" />
            <CardTitle className="text-sm">Statutory Social Security &amp; Safety</CardTitle>
          </div>
          <CardMeta>Code on Social Security, 2020 (Chapter IX)</CardMeta>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>• ₹10,00,000 Accidental Death &amp; Permanent Total Disability Cover</li>
            <li>• ₹1,00,000 On-Duty Emergency Hospitalization Cover</li>
            <li>• 2 days/month penalty-free Period Leave for female delivery partners</li>
            <li>• 24x7 Safety Desk (+91-9395065587) and 1-tap National 112 / 108 SOS inside the app</li>
          </ul>
        </Card>

        <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-foreground">Ready to sign in or complete KYC onboarding?</p>
            <p className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span>Orderkingpay · Hailakandi / Karimganj, Assam - 788710 · GSTIN: 18AFXPH9838M1Z9</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:+919395065587"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
            >
              <Phone className="size-3.5" />
              <span>Support</span>
            </a>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-[#c92d39]"
            >
              Partner Sign In
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
