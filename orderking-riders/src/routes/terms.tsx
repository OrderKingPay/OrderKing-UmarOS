import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { ArrowLeft, FileText, Scale, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: DeliveryPartnerTermsPage,
});

export function DeliveryPartnerTermsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6 text-foreground font-sans">
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-foreground">Delivery Partner Agreement</h1>
            <p className="text-xs text-muted-foreground">OrderKing Delivery Partner Terms of Service</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-5 text-xs text-muted-foreground leading-relaxed">
          <div className="border-b border-border pb-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Scale className="size-4" />
              <span>1. Nature of Engagement (Independent Contractor)</span>
            </div>
            <p className="mt-2">
              This Agreement constitutes a Principal-to-Principal contract under the provisions of the Code on Social Security, 2020 governing gig and platform workers. The Delivery Partner ("Partner") operates as an independent contractor and not an employee, agent, or representative of OrderKing (Orderkingpay, GSTIN: 18AFXPH9838M1Z9). The Partner retains complete autonomy over shift start/stop timings, geographic operational zones, and trip acceptance.
            </p>
          </div>

          <div className="border-b border-border pb-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <ShieldCheck className="size-4" />
              <span>2. Delivery Payout Architecture &amp; Tariffs</span>
            </div>
            <ul className="mt-2 list-disc pl-4 space-y-1">
              <li>
                <strong className="text-foreground">Base Fare Floor:</strong> ₹35 statutory minimum floor covering initial 2.0 km of each dispatched trip.
              </li>
              <li>
                <strong className="text-foreground">Distance Compensation:</strong> ₹12.00/km for distance between 2.0 km and 5.0 km; ₹15.00/km for distances exceeding 5.0 km.
              </li>
              <li>
                <strong className="text-foreground">Merchant Wait-Time Pay:</strong> ₹1.00 per minute auto-credited for wait time exceeding 6 minutes from arrival timestamp at restaurant.
              </li>
              <li>
                <strong className="text-foreground">Customer Tip Pass-Through:</strong> Customer tips are credited directly to the Partner with zero platform commission or tax withholding.
              </li>
              <li>
                <strong className="text-foreground">Settlement Cycles:</strong> T+1 automated daily settlement to verified Bank Account or UPI ID, with weekly Wednesday reconciliation.
              </li>
            </ul>
          </div>

          <div className="border-b border-border pb-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <FileText className="size-4" />
              <span>3. Cash on Delivery (COD) &amp; Float Limits</span>
            </div>
            <p className="mt-2">
              Partners collecting cash on delivery (COD) are held strictly accountable as custodians of platform funds. Cash collected must be deposited prior to cutoff via direct NPCI UPI float clearing (<code className="text-primary font-mono font-bold">orderking@ybl</code>). Exceeding your tier COD holding limit temporarily pauses COD order dispatching while prepaid orders remain active.
            </p>
          </div>

          <div className="border-b border-border pb-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <ShieldCheck className="size-4" />
              <span>4. Doorstep Delivery 4-Digit OTP Protocol</span>
            </div>
            <p className="mt-2">
              To enforce fulfillment integrity, every delivery completion is gated by the customer's 4-digit doorstep delivery OTP or doorstep photo proof of delivery. Releasing goods without verification marks the trip disputed under audit protocol.
            </p>
          </div>

          <div className="border-b border-border pb-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <ShieldCheck className="size-4" />
              <span>5. Road Safety, CMVR &amp; FSSAI Standards</span>
            </div>
            <ul className="mt-2 list-disc pl-4 space-y-1">
              <li>Partners operating motorized two-wheelers must maintain a valid Driving License, active Vehicle RC plate, and third-party insurance under the Central Motor Vehicles Rules (CMVR). Non-motorized bicycles and low-speed EVs are exempt under CMVR Rule 2(u).</li>
              <li>Wearing an ISI-certified helmet and high-visibility reflective gear is mandatory during active shifts. The platform enforces helmet selfie verification before shift activation.</li>
              <li>All food packages must be transported inside insulated, hygienic delivery bags in compliance with Food Safety and Standards Authority of India (FSSAI) norms. Tampering with or opening customer packaging is cause for permanent deactivation.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Scale className="size-4" />
              <span>6. Statutory Disclosures &amp; Jurisdiction</span>
            </div>
            <p className="mt-2">
              This Agreement is governed by the laws of India, under GSTIN 18AFXPH9838M1Z9 (Orderkingpay, Assam - 788710) and Section 9(5) of the Central Goods and Services Tax Act, 2017. Any disputes arising from or in connection with this Agreement are subject to the jurisdiction of the competent courts in Assam, India.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
