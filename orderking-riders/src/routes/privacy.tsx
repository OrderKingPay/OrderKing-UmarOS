import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { ArrowLeft, Database, Lock, ShieldCheck, UserCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: DeliveryPartnerPrivacyPage,
});

export function DeliveryPartnerPrivacyPage() {
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
            <h1 className="text-xl font-black text-foreground">Privacy Policy &amp; Data Governance</h1>
            <p className="text-xs text-muted-foreground">Compliance under Digital Personal Data Protection (DPDP) Act, 2023</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-5 text-xs text-muted-foreground leading-relaxed">
          <div className="border-b border-border pb-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <ShieldCheck className="size-4" />
              <span>1. Data Fiduciary Identity &amp; Scope</span>
            </div>
            <p className="mt-2">
              Orderkingpay (GSTIN: 18AFXPH9838M1Z9, Assam - 788710) acts as the Data Fiduciary for personal data collected from delivery partners operating on the OrderKing delivery network. We process data strictly in accordance with the Digital Personal Data Protection Act, 2023 (DPDP) and applicable Indian telecommunications and tax regulations.
            </p>
          </div>

          <div className="border-b border-border pb-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Database className="size-4" />
              <span>2. Categories of Personal Data Collected</span>
            </div>
            <ul className="mt-2 list-disc pl-4 space-y-1">
              <li><strong className="text-foreground">Contact Identifiers:</strong> 10-digit Indian mobile number, emergency contact phone number.</li>
              <li><strong className="text-foreground">Statutory KYC:</strong> Full name, UIDAI Aadhaar last 4 digits (verified via Verhoeff checksum; raw Aadhaar is never stored), Permanent Account Number (PAN), Driving License, and Vehicle Registration Certificate (RC).</li>
              <li><strong className="text-foreground">Financial &amp; Settlement Data:</strong> Bank account number, IFSC code, and Virtual Payment Address (UPI ID) used for processing T+1 daily earnings disbursements.</li>
              <li><strong className="text-foreground">Real-Time Geolocation:</strong> High-precision GPS coordinates streamed during active duty shifts to match nearby orders, calculate route distance pay, monitor shift boundary safety (Day 12km, Evening 7.5km, Late-Night 3.5km), and display live tracking to customers.</li>
            </ul>
          </div>

          <div className="border-b border-border pb-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Lock className="size-4" />
              <span>3. Data Retention Schedules (Section 36 CGST Act vs DPDP Purge)</span>
            </div>
            <p className="mt-2">
              In strict adherence to Indian statutory retention mandates:
            </p>
            <ul className="mt-2 list-disc pl-4 space-y-1">
              <li><strong className="text-foreground">Financial Ledgers &amp; Tax Invoices:</strong> Retained for 72 months (6 years) as mandated under Section 36 of the Central Goods and Services Tax (CGST) Act, 2017.</li>
              <li><strong className="text-foreground">GPS Telematics &amp; Location Trails:</strong> Retained for a maximum of 90 days for dispute arbitration and insurance safety auditing, after which telemetry logs are permanently purged.</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <UserCheck className="size-4" />
              <span>4. Data Principal Rights &amp; Grievance Redressal</span>
            </div>
            <p className="mt-2">
              Under Sections 11 to 14 of the DPDP Act 2023, you have the right to request a summary of your personal data, seek correction of incomplete or inaccurate records, and withdraw consent for non-statutory data processing upon account closure.
            </p>
            <p className="mt-2">
              For grievances regarding personal data processing, contact the designated Data Protection Officer (DPO):
            </p>
            <div className="mt-2 rounded-xl border border-border bg-muted/30 p-3">
              <p><strong className="text-foreground">Grievance Officer:</strong> OrderKing Legal &amp; Data Governance</p>
              <p><strong className="text-foreground">Entity:</strong> Orderkingpay (Assam - 788710)</p>
              <p><strong className="text-foreground">Grievance Channel:</strong> <code className="text-primary font-mono">grievance@orderkingpay.com</code></p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
