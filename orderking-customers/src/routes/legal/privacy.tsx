import { createFileRoute } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { useT } from "@/components/providers";
import { ShieldCheck, Lock, Eye, Landmark, Scale, FileText, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/legal/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  const { t } = useT();

  return (
    <CustomerShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 text-zinc-100">
        {/* Header Banner */}
        <div className="border-b border-zinc-800 pb-6 mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="bg-emerald-950/60 border-emerald-500/40 text-emerald-400 font-mono text-[10px] uppercase tracking-wider">
              DPDP Act 2023 Compliant
            </Badge>
            <Badge className="bg-zinc-900 border-zinc-700 text-zinc-400 font-mono text-[10px]">
              Last Updated: October 2026
            </Badge>
            <Badge className="bg-amber-950/60 border-amber-500/40 text-amber-300 font-mono text-[10px]">
              GSTIN: 18AFXPH9838M1Z9
            </Badge>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight">
            OrderKing & KingPay Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed max-w-3xl">
            Data Protection Charter and Privacy Notice formulated in strict compliance with the Digital Personal Data Protection Act, 2023,
            Information Technology Act, 2000, and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
          </p>
        </div>

        <article className="space-y-8 text-sm leading-relaxed text-zinc-300">
          {/* Section 1: Data Fiduciary & Statutory Scope */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-white border-b border-zinc-800/80 pb-2">
              <Landmark className="size-4 text-emerald-400" />
              <h2>1. Data Fiduciary Identity &amp; Statutory Scope</h2>
            </div>
            <p>
              This Privacy Policy applies to all personal data collected and processed by <strong className="text-white">Orderkingpay</strong>,
              operating under Goods and Services Tax Identification Number (GSTIN) <span className="font-mono text-emerald-400 font-bold">18AFXPH9838M1Z9</span>,
              having its registered operations in Sribhumi, Assam - 788710, India (hereinafter designated as the &quot;Data Fiduciary&quot;, &quot;Company&quot;, &quot;OrderKing&quot;, &quot;We&quot;, &quot;Us&quot;, or &quot;Our&quot;).
            </p>
            <p>
              Under the Digital Personal Data Protection Act, 2023 (&quot;DPDP Act, 2023&quot;), the User transacting or registering on the OrderKing
              and KingPay platforms is recognized as the &quot;Data Principal&quot;. We are committed to maintaining the highest degree of confidentiality,
              integrity, and transparency regarding the processing of your digital personal data.
            </p>
          </section>

          {/* Section 2: Grounds for Processing & Data Minimization */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-white border-b border-zinc-800/80 pb-2">
              <ShieldCheck className="size-4 text-emerald-400" />
              <h2>2. Lawful Grounds for Processing &amp; Purpose Limitation</h2>
            </div>
            <p>
              In accordance with Section 4 and Section 6 of the DPDP Act, 2023, personal data is processed solely for explicit, lawful,
              and specified purposes based on:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>
                <strong className="text-white">Explicit Informed Consent:</strong> Provided by the Data Principal during mobile OTP sign-in, order placement,
                and location authorization.
              </li>
              <li>
                <strong className="text-white">Certain Legitimate Uses:</strong> Fulfilling consumer orders, executing deliveries via assigned delivery partners,
                discharging statutory tax obligations under Section 9(5) CGST Act, 2017, and complying with court orders or regulatory mandates.
              </li>
            </ul>
          </section>

          {/* Section 3: Categories of Data Collected */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-white border-b border-zinc-800/80 pb-2">
              <Database className="size-4 text-emerald-400" />
              <h2>3. Categories of Personal Data Processed</h2>
            </div>
            <p>
              OrderKing strictly follows the doctrine of data minimization. We only collect data necessary to provide seamless hyperlocal delivery and financial settlement services:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
              <li>
                <strong className="text-white">Identity &amp; Contact Credentials:</strong> Name, mobile phone number (verified via carrier telecom OTP),
                and optional email address for digital tax invoices.
              </li>
              <li>
                <strong className="text-white">Geographic &amp; Delivery Telemetry:</strong> Precise GPS coordinates (latitude, longitude) captured during
                order checkout, delivery street address, area landmarks, and delivery instructions required to direct assigned delivery riders.
              </li>
              <li>
                <strong className="text-white">Transactional &amp; Accounting Records:</strong> Complete order contents, invoice receipts, integer-paise
                transaction amounts, and payment reference numbers for audit compliance.
              </li>
              <li>
                <strong className="text-white">Zero Sensitive Financial Storage:</strong> We <strong className="text-white">NEVER store</strong> payment
                card numbers (PAN), CVVs, card expiry dates, netbanking passwords, or UPI MPINs. All payment authorizations occur within PCI-DSS Level 1
                certified environments governed by RBI-regulated Payment Aggregators.
              </li>
            </ul>
          </section>

          {/* Section 4: Data Disclosures & Third-Party Sharing */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-white border-b border-zinc-800/80 pb-2">
              <Eye className="size-4 text-emerald-400" />
              <h2>4. Controlled Third-Party Disclosures</h2>
            </div>
            <p>
              We enforce strict zero-sale protocols: <strong className="text-white">OrderKing does not sell, lease, or monetize personal data</strong> to
              advertisers or third-party data brokers. Disclosures are restricted strictly to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>
                <strong className="text-white">Assigned Delivery Partners:</strong> Provided access to delivery address, customer name, and masked phone numbers
                strictly for the duration of the active delivery trip.
              </li>
              <li>
                <strong className="text-white">FBO Merchant Restaurants:</strong> Provided itemized order details, preparation instructions, and delivery tokens.
              </li>
              <li>
                <strong className="text-white">Telecom Gateways:</strong> Transactional SMS and WhatsApp OTP dispatches routed through TRAI-compliant,
                DLT-registered telecom aggregators (e.g. Fast2SMS).
              </li>
              <li>
                <strong className="text-white">Law Enforcement:</strong> Disclosures made solely pursuant to valid, written orders issued by competent judicial
                or statutory authorities under Section 91 of the Code of Criminal Procedure, 1973 or equivalent Indian statutory provisions.
              </li>
            </ul>
          </section>

          {/* Section 5: Rights of Data Principals Under DPDP Act, 2023 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-white border-b border-zinc-800/80 pb-2">
              <Scale className="size-4 text-emerald-400" />
              <h2>5. Statutory Rights of the Data Principal</h2>
            </div>
            <p>
              Under the Digital Personal Data Protection Act, 2023, you enjoy comprehensive, enforceable statutory rights:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <div className="rounded-lg bg-zinc-950/60 border border-zinc-800 p-3 space-y-1">
                <h3 className="font-bold text-white text-xs">Right to Access Information</h3>
                <p className="text-[11px] text-zinc-400">Request a complete summary of personal data being processed and third parties with whom data was shared.</p>
              </div>
              <div className="rounded-lg bg-zinc-950/60 border border-zinc-800 p-3 space-y-1">
                <h3 className="font-bold text-white text-xs">Right to Correction &amp; Erasure</h3>
                <p className="text-[11px] text-zinc-400">Rectify misleading data or request complete deletion of your account and personal records.</p>
              </div>
              <div className="rounded-lg bg-zinc-950/60 border border-zinc-800 p-3 space-y-1">
                <h3 className="font-bold text-white text-xs">Right of Grievance Redressal</h3>
                <p className="text-[11px] text-zinc-400">File a complaint with our Grievance Officer and escalate to the Data Protection Board of India.</p>
              </div>
              <div className="rounded-lg bg-zinc-950/60 border border-zinc-800 p-3 space-y-1">
                <h3 className="font-bold text-white text-xs">Right to Nominate</h3>
                <p className="text-[11px] text-zinc-400">Nominate an individual to exercise data principal rights in the event of death or incapacity.</p>
              </div>
            </div>
          </section>

          {/* Section 6: Data Security & Technical Guardrails */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-white border-b border-zinc-800/80 pb-2">
              <Lock className="size-4 text-emerald-400" />
              <h2>6. Technical &amp; Operational Security Measures</h2>
            </div>
            <p>
              In compliance with Section 43A of the Information Technology Act, 2000 and Section 8(5) of the DPDP Act, 2023, we deploy reasonable
              security practices and procedures:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
              <li>Data in transit is encrypted using Transport Layer Security (TLS 1.3).</li>
              <li>Data at rest within PostgreSQL databases is encrypted using industry-standard AES-256 cryptographic standards.</li>
              <li>Multi-tenant role-based access control (RBAC) with strict server-side fail-closed gates for employee access.</li>
              <li>Continuous intrusion detection and automated session rotation upon sign-in identity shifts.</li>
            </ul>
          </section>

          {/* Section 7: Data Retention Mandate */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-white border-b border-zinc-800/80 pb-2">
              <FileText className="size-4 text-emerald-400" />
              <h2>7. Data Retention &amp; Statutory Archival</h2>
            </div>
            <p>
              Personal data is retained only for as long as necessary to fulfill the operational purpose for which it was collected.
              However, transaction invoices and double-entry accounting records are retained for a statutory period of <strong className="text-white">72 months (6 years)</strong> as
              mandated under the Central Goods and Services Tax Act, 2017 and Indian accounting statutes, after which they are irreversibly anonymized or purged.
            </p>
          </section>

          {/* Section 8: Statutory Grievance Redressal & Contact Details */}
          <section className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
            <div className="flex items-center gap-2 text-base font-bold text-white pb-1">
              <Scale className="size-4 text-emerald-400" />
              <h2>8. Statutory Grievance Redressal Officer</h2>
            </div>
            <p>
              In accordance with Section 8(9) of the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000,
              the designated Data Grievance Officer details are published below:
            </p>
            <div className="mt-2 rounded-lg bg-zinc-950/80 border border-zinc-800 p-3 font-mono text-xs space-y-1 text-zinc-300">
              <div><strong className="text-white">Designation:</strong> Data Grievance Officer, Orderkingpay</div>
              <div><strong className="text-white">Statutory Entity:</strong> Orderkingpay (GSTIN: 18AFXPH9838M1Z9)</div>
              <div><strong className="text-white">Operational Hub:</strong> Orderkingpay, Sribhumi, Assam - 788710, India</div>
              <div><strong className="text-white">Official Email:</strong> <a href="mailto:grievance@orderkingpay.com" className="text-emerald-400 underline">grievance@orderkingpay.com</a></div>
              <div><strong className="text-white">Statutory SLA:</strong> Acknowledged within 48 hours; resolved within 30 days of receipt.</div>
            </div>
          </section>

          {/* Section 9: Governing Law & Jurisdiction */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-white border-b border-zinc-800/80 pb-2">
              <Scale className="size-4 text-emerald-400" />
              <h2>9. Governing Law &amp; Exclusive Jurisdiction</h2>
            </div>
            <p>
              This Privacy Policy shall be governed by, and construed in accordance with, the laws of the Republic of India.
              Any disputes or legal proceedings arising under this Charter shall be subject to the <strong className="text-white">exclusive jurisdiction of the competent courts in Sribhumi / Karimganj, Assam, India</strong>.
            </p>
          </section>
        </article>
      </div>
    </CustomerShell>
  );
}
