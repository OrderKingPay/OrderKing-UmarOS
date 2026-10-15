import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardMeta, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { errorMessage } from "@/lib/client/errors";
import { LOCALE_LABELS } from "@/lib/rider/i18n";
import { useI18n } from "@/lib/rider/i18n-context";
import { DEFAULT_BRANDING } from "@/lib/rider/config";
import { bootstrapRiderFn, saveProfileFn, setLocaleFn } from "@/lib/server/rider-fns";
import type { LocaleCode, RiderProfile, RiderType } from "@/lib/rider/types";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Lock,
  Scale,
  Settings2,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/profile")({ component: Page });

type LegalDocId = "agreement" | "privacy" | "settlement";

type LegalSection = {
  id: LegalDocId;
  title: string;
  subtitle: string;
  statuteBadge: string;
  clauses: ReadonlyArray<{ heading: string; body: string }>;
};

const LEGAL_SECTIONS: ReadonlyArray<LegalSection> = [
  {
    id: "agreement",
    title: "Independent Delivery Partner Agreement",
    subtitle: "Scope of principal-to-principal gig engagement, rate card & partner rights",
    statuteBadge: "Code on Social Security, 2020",
    clauses: [
      {
        heading: "1. Independent Gig Engagement",
        body: "You engage with Order King Foods Private Limited on a non-exclusive, principal-to-principal basis as an Independent Delivery Partner. You retain full freedom to choose your online hours, book optional operational gig slots, and accept or decline dispatch offers.",
      },
      {
        heading: "2. Transparent Per-Order Rate Card",
        body: "Every delivery offer displays the guaranteed expected payout before acceptance. Payouts enforce a statutory base floor of ₹35.00 (3,500 paise) for the first 2 km, plus ₹12.00/km distance compensation beyond 2 km, and ₹1.00/minute restaurant wait-time compensation after 10 minutes past arrival.",
      },
      {
        heading: "3. 100% Customer Tip Retention & Zero Arbitrary Penalties",
        body: "100% of customer tips are credited directly to your partner ledger without platform commission. No unilateral or arbitrary monetary penalties are levied; any cash or order discrepancy is subject to documented audit and partner grievance review.",
      },
    ],
  },
  {
    id: "privacy",
    title: "Rider Privacy Policy & Location Data Usage",
    subtitle: "Strict on-duty GPS telemetry, data minimization & retention limits",
    statuteBadge: "IT Act, 2000 & DPDP Act, 2023",
    clauses: [
      {
        heading: "1. Strictly On-Duty Location Collection",
        body: "GPS coordinates are collected only when your duty status is set to ONLINE or BUSY on an active delivery. When you switch to OFFLINE, background and foreground location tracking halts immediately.",
      },
      {
        heading: "2. Purpose of Telemetry & Customer Privacy Masking",
        body: "Location pings are used solely for proximity dispatch matching, live order ETA calculation, route navigation, and emergency SOS response. Customer phone numbers and exact doorstep details are masked outside active delivery states.",
      },
      {
        heading: "3. Rolling Retention & KYC Document Security",
        body: "Operational GPS breadcrumbs are automatically pruned after 24 hours (capped at the latest 40 pings). KYC records (Driving Licence, RC, Government ID, and UPI/Bank details) are encrypted and used exclusively for identity verification and statutory payouts.",
      },
    ],
  },
  {
    id: "settlement",
    title: "COD Floating Cash & Weekly Settlement Policy",
    subtitle: "Integer-paise ledger accounting, TDS u/s 194-O & dispute resolution",
    statuteBadge: "Income Tax Act Sec 194-O",
    clauses: [
      {
        heading: "1. Integer-Paise Ledger & Wednesday Settlement",
        body: "All earnings, incentives, tips, and COD collections are recorded in exact integer paise to prevent rounding discrepancies. Net payable balances are settled every Wednesday via NEFT/IMPS to your verified bank account or UPI ID.",
      },
      {
        heading: "2. COD Floating Cash Limit (₹2,000 Ceiling)",
        body: "Cash collected from Cash-on-Delivery (COD) orders is held in trust and offset against your weekly payout ledger or reconciled via instant UPI QR / gateway deposits. If unreconciled COD cash reaches ₹2,000.00, new COD dispatches pause automatically while prepaid orders remain active.",
      },
      {
        heading: "3. Statutory TDS & Grievance Redressal Officer",
        body: "Where applicable under Section 194-O of the Income Tax Act, 1961, statutory TDS at 1% is accounted for on gross credits. For payout or ledger disputes, raise a ticket under Support → Cash / Payment Issue or contact the Partner Grievance Officer at grievance.rider@orderking.in.",
      },
    ],
  },
];

const RIDER_TYPES: ReadonlyArray<{ id: RiderType; label: string }> = [
  { id: "DELIVERY_PARTNER", label: "Standard Gig Partner" },
  { id: "FULL_TIME", label: "Full-Time Dedicated" },
  { id: "PART_TIME", label: "Part-Time / Shift" },
];

function Page() {
  const user = useCurrentUser();
  const { t, locale, setLocale } = useI18n();
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [openLegalId, setOpenLegalId] = useState<LegalDocId | null>("agreement");

  // Self-service operational & payout form state (non-KYC-locking fields)
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payoutUpi, setPayoutUpi] = useState("");
  const [payoutBankLast4, setPayoutBankLast4] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [riderType, setRiderType] = useState<RiderType>("DELIVERY_PARTNER");
  const [preferredZonesText, setPreferredZonesText] = useState("");
  const [availabilityNotes, setAvailabilityNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    void bootstrapRiderFn()
      .then((r) => {
        setRider(r);
        setPhone(r.phone ?? "");
        setAddress(r.address ?? "");
        setPayoutUpi(r.payoutUpi ?? "");
        setPayoutBankLast4(r.payoutBankLast4 ?? "");
        setEmergencyName(r.emergencyName ?? "");
        setEmergencyPhone(r.emergencyPhone ?? "");
        setRiderType(r.riderType ?? "DELIVERY_PARTNER");
        setPreferredZonesText((r.preferredZones ?? []).join(", "));
        setAvailabilityNotes(r.availabilityNotes ?? "");
      })
      .catch(() => undefined);
  }, []);

  async function handleSavePartnerSettings() {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const zones = preferredZonesText
        .split(",")
        .map((z) => z.trim())
        .filter(Boolean);
      const updated = await saveProfileFn({
        data: {
          phone: phone.trim(),
          address: address.trim(),
          payoutUpi: payoutUpi.trim() || null,
          payoutBankLast4: payoutBankLast4.trim().slice(0, 4) || null,
          emergencyName: emergencyName.trim(),
          emergencyPhone: emergencyPhone.trim(),
          riderType,
          preferredZones: zones,
          availabilityNotes: availabilityNotes.trim(),
        },
      });
      setRider(updated);
      setSaveSuccess(true);
    } catch (e: unknown) {
      setSaveError(errorMessage(e, t("actionNotConfirmed")));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="font-display text-3xl">{t("profile")}</h1>

        <Card className="flex items-center justify-between">
          <div>
            <CardTitle>{rider?.fullName || user?.displayName || "Partner"}</CardTitle>
            <CardMeta>{rider?.phone || user?.primaryEmail}</CardMeta>
            {rider?.payoutUpi ? (
              <p className="mt-1 text-xs font-mono text-muted-foreground">
                Verified Settlement UPI: {rider.payoutUpi}
              </p>
            ) : null}
          </div>
          <UserButton />
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{t("kyc")} &amp; Vehicle Status</span>
            <Badge tone={rider?.kycStatus === "VERIFIED" ? "online" : "busy"}>
              {rider?.kycStatus ?? "DRAFT"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="rounded-lg bg-muted/40 p-2 border border-border/60">
              <span className="text-muted-foreground block">Vehicle</span>
              <span className="font-semibold text-foreground">{rider?.vehicleType ?? "MOTORCYCLE"}</span>
            </div>
            <div className="rounded-lg bg-muted/40 p-2 border border-border/60">
              <span className="text-muted-foreground block">Registration</span>
              <span className="font-mono font-semibold text-foreground">
                {rider?.vehicleRegistration || "Pending"}
              </span>
            </div>
            <div className="rounded-lg bg-muted/40 p-2 border border-border/60">
              <span className="text-muted-foreground block">Driving Licence</span>
              <span className="font-mono font-semibold text-foreground">
                {rider?.licenceNumber || "Pending"}
              </span>
            </div>
            <div className="rounded-lg bg-muted/40 p-2 border border-border/60">
              <span className="text-muted-foreground block">Gov ID (Last 4)</span>
              <span className="font-mono font-semibold text-foreground">
                {rider?.governmentIdLast4 ? `•••• ${rider.governmentIdLast4}` : "Pending"}
              </span>
            </div>
          </div>
          <Link to="/onboarding" className="inline-block pt-1 text-sm font-medium underline">
            Manage KYC Identity &amp; Vehicle Documents
          </Link>
        </Card>

        {/* Self-Service Partner Payout, Zone & Emergency Contact Settings */}
        <Card className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Settings2 className="size-4" />
              </span>
              <div>
                <CardTitle className="text-base">
                  Self-Service Payout, Zones &amp; Emergency Contact
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Update your settlement UPI, preferred zones, and emergency contact anytime without resetting KYC verification
                </p>
              </div>
            </div>
            <Badge tone="online">Instant Save</Badge>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            <div>
              <Label className="text-xs">Engagement Mode</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {RIDER_TYPES.map((rt) => (
                  <Button
                    key={rt.id}
                    type="button"
                    size="sm"
                    variant={riderType === rt.id ? "default" : "outline"}
                    onClick={() => setRiderType(rt.id)}
                  >
                    {rt.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs">Settlement UPI ID (Wednesday Payouts)</Label>
                <Input
                  value={payoutUpi}
                  onChange={(e) => setPayoutUpi(e.target.value)}
                  placeholder="yourname@upi"
                  className="mt-1 font-mono text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Bank Account Last 4 Digits</Label>
                <Input
                  value={payoutBankLast4}
                  maxLength={4}
                  onChange={(e) => setPayoutBankLast4(e.target.value.replace(/\D/g, ""))}
                  placeholder="1234"
                  className="mt-1 font-mono text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Primary Mobile Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Preferred Delivery Zones (comma-separated)</Label>
                <Input
                  value={preferredZonesText}
                  onChange={(e) => setPreferredZonesText(e.target.value)}
                  placeholder="Central Hub, Station Road, North Zone"
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Emergency Contact Name (SOS Quick-Dial)</Label>
                <Input
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="Family / Next of Kin Name"
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Emergency Contact Phone</Label>
                <Input
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs">Residential Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Locality, City, PIN"
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Shift &amp; Availability Notes</Label>
                <Input
                  value={availabilityNotes}
                  onChange={(e) => setAvailabilityNotes(e.target.value)}
                  placeholder="e.g., Available Lunch & Dinner peaks"
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            {saveError ? <p className="text-xs text-offline">{saveError}</p> : null}
            {saveSuccess ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                Partner payout, zone, and emergency contact preferences saved to your profile.
              </p>
            ) : null}

            <Button
              size="sm"
              disabled={saving}
              onClick={() => void handleSavePartnerSettings()}
            >
              {saving ? "Saving Preferences..." : "Save Partner Settings"}
            </Button>
          </div>
        </Card>

        <Card>
          <CardTitle>{t("language")}</CardTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(LOCALE_LABELS) as LocaleCode[]).map((code) => (
              <Button
                key={code}
                size="sm"
                variant={locale === code ? "default" : "outline"}
                onClick={() => {
                  setLocale(code);
                  void setLocaleFn({ data: { locale: code } });
                }}
              >
                {LOCALE_LABELS[code]}
              </Button>
            ))}
          </div>
        </Card>

        {/* Rider Partner Legal, Agreements & Compliance Center */}
        <Card className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Rider Partner Legal, Agreements &amp; Compliance Center</CardTitle>
              <CardMeta className="mt-1">
                {DEFAULT_BRANDING.legalCompanyName} · {DEFAULT_BRANDING.domain}
              </CardMeta>
            </div>
            <Badge tone="online">Statutory</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{t("legalNote")}</p>

          <div className="space-y-2.5 pt-1">
            {LEGAL_SECTIONS.map((sec) => {
              const isOpen = openLegalId === sec.id;
              const Icon =
                sec.id === "agreement" ? FileText : sec.id === "privacy" ? Lock : Scale;
              return (
                <div
                  key={sec.id}
                  className="rounded-lg border border-border bg-muted/20 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenLegalId(isOpen ? null : sec.id)}
                    className="w-full flex items-center justify-between gap-3 p-3.5 text-left hover:bg-muted/40 transition"
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon className="size-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-sm font-bold text-foreground">
                            {sec.title}
                          </span>
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-primary">
                            {sec.statuteBadge}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{sec.subtitle}</p>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="size-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {isOpen ? (
                    <div className="border-t border-border bg-card p-3.5 space-y-2.5 text-xs">
                      {sec.clauses.map((clause) => (
                        <div key={clause.heading} className="space-y-1">
                          <p className="font-semibold text-foreground">{clause.heading}</p>
                          <p className="text-muted-foreground leading-relaxed">{clause.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex items-center gap-3 text-sm">
          <Link to="/assistant" className="underline">
            {t("assistant")}
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/support" className="underline">
            {t("support")}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
