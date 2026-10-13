import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  Clock, 
  FileText, 
  X, 
  ChevronRight,
  ShieldCheck,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateFssaiExpiry, parseFssai } from "@/lib/merchant-kyc";

export interface FssaiLicenseInfo {
  licenseNumber: string;
  registeredName: string;
  expiryDate: string; // ISO string or YYYY-MM-DD
  daysRemaining: number;
  status: "EXPIRING_SOON" | "EXPIRED" | "VALID" | "MISSING";
  category: "State License" | "Central License" | "Petty FBO Registration";
}

export function FssaiExpiryBanner({
  fssaiNumber,
  expiryDate,
  daysRemaining,
  compact = false,
}: {
  fssaiNumber?: string | null;
  expiryDate?: string | null;
  daysRemaining?: number | null;
  compact?: boolean;
}) {
  const [snoozed, setSnoozed] = useState(false);

  const licenseInfo = useMemo<FssaiLicenseInfo | null>(() => {
    const cleanNum = (fssaiNumber ?? "").trim();
    if (!cleanNum && !expiryDate?.trim()) {
      return null;
    }

    const parsed = cleanNum ? parseFssai(cleanNum) : null;
    let category: FssaiLicenseInfo["category"] = "State License";
    if (parsed?.registrationType === 1) category = "Petty FBO Registration";
    else if (parsed?.registrationType === 2) category = "State License";
    else if (parsed?.registrationType === 3) category = "Central License";

    let calculatedDays = 365;
    let status: FssaiLicenseInfo["status"] = "VALID";

    if (daysRemaining != null) {
      calculatedDays = daysRemaining;
      if (calculatedDays <= 0) status = "EXPIRED";
      else if (calculatedDays <= 30) status = "EXPIRING_SOON";
    } else if (expiryDate) {
      const expRes = calculateFssaiExpiry(expiryDate);
      calculatedDays = expRes.daysRemaining;
      if (expRes.isExpired) status = "EXPIRED";
      else if (expRes.isExpiringSoon) status = "EXPIRING_SOON";
    } else if (!cleanNum) {
      status = "MISSING";
    }

    return {
      licenseNumber: cleanNum,
      registeredName: "Kitchen Partner",
      expiryDate: expiryDate || "",
      daysRemaining: calculatedDays,
      status,
      category,
    };
  }, [fssaiNumber, expiryDate, daysRemaining]);

  // Check local storage snooze
  useEffect(() => {
    try {
      const snoozeUntil = localStorage.getItem("orderking_fssai_snooze_until");
      if (snoozeUntil && Number(snoozeUntil) > Date.now()) {
        setSnoozed(true);
      }
    } catch (e) {}
  }, []);

  const handleSnooze = () => {
    setSnoozed(true);
    try {
      // 24 hour snooze
      localStorage.setItem("orderking_fssai_snooze_until", String(Date.now() + 24 * 60 * 60 * 1000));
    } catch (e) {}
  };

  if (!licenseInfo || licenseInfo.status === "VALID") {
    return null;
  }

  // Compact alert mode for inline forms (e.g. Station 3)
  if (compact) {
    const isExpired = licenseInfo.status === "EXPIRED";
    return (
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-lg border text-xs ${
          isExpired
            ? "bg-rose-950/40 border-rose-500/50 text-rose-200"
            : "bg-amber-950/40 border-amber-500/50 text-amber-200"
        }`}
      >
        <div className="flex items-start sm:items-center gap-2">
          {isExpired ? (
            <ShieldAlert className="size-4 text-rose-400 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
          ) : (
            <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
          )}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                isExpired ? "bg-rose-500 text-black" : "bg-amber-500 text-black"
              }`}>
                {isExpired ? "FSSAI EXPIRED" : `RENEWAL DUE IN ${licenseInfo.daysRemaining} DAYS`}
              </span>
              <span className="font-semibold text-white">
                {licenseInfo.category} {licenseInfo.licenseNumber ? `#${licenseInfo.licenseNumber}` : ""}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {isExpired
                ? "Statutory compliance violation: restaurant operations halted under Section 31 of FSS Act, 2006 until renewed."
                : `License expires soon (${licenseInfo.expiryDate || "within 30 days"}). Apply for FoSCoS renewal to prevent order suspension.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <a
            href="https://foscos.fssai.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold tracking-wide transition uppercase ${
              isExpired
                ? "bg-rose-500 hover:bg-rose-400 text-black"
                : "bg-amber-500 hover:bg-amber-400 text-black"
            }`}
          >
            <span>FoSCoS Portal</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    );
  }


  // If snoozed, display a compact high-contrast sticky pill instead of full banner
  if (snoozed) {
    return (
      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-3.5 text-amber-500 animate-pulse" />
          <span>FSSAI Lic #{licenseInfo.licenseNumber}: Renewal Due in {licenseInfo.daysRemaining} Days</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://foscos.fssai.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] underline hover:text-amber-300 flex items-center gap-0.5"
          >
            FoSCoS ↗
          </a>
          <button 
            onClick={() => setSnoozed(false)} 
            className="text-[10px] text-slate-400 hover:text-slate-200"
          >
            Expand
          </button>
        </div>
      </div>
    );
  }

  const isExpired = licenseInfo.status === "EXPIRED";

  return (
    <div 
      className={`relative rounded-xl border p-4 shadow-xl transition-all duration-300 ${
        isExpired 
          ? "bg-rose-950/20 border-rose-500/40 text-rose-200 shadow-rose-950/30" 
          : "bg-amber-950/20 border-amber-500/40 text-amber-200 shadow-amber-950/30"
      }`}
    >
      {/* Background statutory watermark */}
      <div className="absolute right-4 top-2 pointer-events-none opacity-5 text-right font-mono text-[64px] font-black leading-none">
        FSSAI
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 relative z-10">
        
        {/* Left: Icon & Statutory Message */}
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-lg shrink-0 ${
            isExpired ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
          }`}>
            {isExpired ? <ShieldAlert className="size-6 animate-bounce" /> : <AlertTriangle className="size-6 animate-pulse" />}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded uppercase ${
                isExpired ? "bg-rose-500 text-black font-extrabold" : "bg-amber-500 text-black font-extrabold"
              }`}>
                {isExpired ? "STATUTORY HALT RISK" : "MANDATORY STATUTORY NOTICE"}
              </span>
              <span className="text-xs font-mono text-slate-400">
                FSS Act, 2006 • Section 31 Compliance
              </span>
            </div>

            <h3 className="font-display text-sm sm:text-base font-bold text-white tracking-tight">
              {isExpired
                ? "FSSAI License Has Expired — Platform Listing at Risk"
                : `FSSAI Food License Renewal Due in ${licenseInfo.daysRemaining} Days`}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Under Food Safety and Standards Authority of India (FSSAI) statutory regulations, 
              food business operators must maintain a valid 14-digit registration. 
              License <span className="font-mono font-bold text-white">#{licenseInfo.licenseNumber}</span> ({licenseInfo.category}) 
              expires on <span className="font-mono font-bold text-white">{new Date(licenseInfo.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>.
              Failure to submit renewal documentation leads to automated order ingestion suspension.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Building2 className="size-3 text-slate-500" />
                {licenseInfo.registeredName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="size-3" /> Central FoSCoS Desk Linked
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions & Dismiss */}
        <div className="flex flex-col sm:items-end gap-2 shrink-0 pt-1 sm:pt-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href="https://foscos.fssai.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all uppercase tracking-wider"
            >
              <span>Renew on FoSCoS</span>
              <ExternalLink className="size-3.5" />
            </a>

            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition"
            >
              <span>Upload Certificate</span>
              <ChevronRight className="size-3.5 text-slate-400" />
            </Link>

            <button
              type="button"
              onClick={handleSnooze}
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition"
              title="Snooze warning for 24 hours"
              aria-label="Dismiss alert for 24 hours"
            >
              <X className="size-4" />
            </button>
          </div>

          <span className="text-[10px] font-mono text-slate-400 text-right">
            Annual audit due every 12 months • FoSCoS portal ID verified
          </span>
        </div>

      </div>
    </div>
  );
}
