import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/client/errors";
import { useI18n } from "@/lib/rider/i18n-context";
import { ZONES } from "@/lib/rider/catalog";
import { bootstrapRiderFn, saveProfileFn, submitKycFn } from "@/lib/server/rider-fns";
import type { RiderProfile, VehicleType } from "@/lib/rider/types";
import { useEffect, useMemo, useState } from "react";
import { ZomatoSwiggySwitchFlow } from "@/components/rider/zomato-swiggy-switch-flow";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Bike,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Edit3,
  FileCheck,
  MapPin,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  FileText,
  Scale,
  Copy,
  Check,
  X,
  HeartPulse,
} from "lucide-react";
import {
  ORDERKING_PARTNER_AGREEMENT_SECTIONS,
  ORDERKING_PARTNER_AGREEMENT_METADATA,
  getFullAgreementLegalMarkdown,
} from "@/lib/rider/partner-agreement";

export const Route = createFileRoute("/onboarding")({ component: Page });

type VehicleCategory = "BIKE" | "SCOOTER" | "EV" | "CYCLE";

type DocAttachment = {
  name: string;
  sizeBytes: number;
  previewUrl: string | null;
};

type KycDocsState = {
  dlFrontBack: DocAttachment | null;
  rcCopy: DocAttachment | null;
  panCopy: DocAttachment | null;
  aadhaarMasked: DocAttachment | null;
  partnerSelfie: DocAttachment | null;
};

type LegalAgreementsState = {
  serviceAgreement: boolean;
  roadSafety: boolean;
  foodHygiene: boolean;
  privacyGps: boolean;
};

const DRAFT_STORAGE_KEY = "orderking_onboarding_draft_v2";

const BANK_CODES: Record<string, string> = {
  SBIN: "State Bank of India",
  HDFC: "HDFC Bank",
  ICIC: "ICICI Bank",
  UTIB: "Axis Bank",
  PUNB: "Punjab National Bank",
  BARB: "Bank of Baroda",
  CNRB: "Canara Bank",
  UBIN: "Union Bank of India",
  BKID: "Bank of India",
  IDIB: "Indian Bank",
  KKBK: "Kotak Mahindra Bank",
  YESB: "Yes Bank",
  FDRL: "Federal Bank",
  UCBA: "UCO Bank",
  CBIN: "Central Bank of India",
  IOBA: "Indian Overseas Bank",
  MAHB: "Bank of Maharashtra",
  BAND: "Bandhan Bank",
  IDFB: "IDFC FIRST Bank",
  INDB: "IndusInd Bank",
  AIRP: "Airtel Payments Bank",
  PYTM: "Paytm Payments Bank",
};

function detectIfscBank(ifsc: string): string | null {
  const clean = ifsc.trim().toUpperCase();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean)) return null;
  const prefix = clean.slice(0, 4);
  return BANK_CODES[prefix]
    ? `${BANK_CODES[prefix]} (Branch Code: ${clean.slice(5)})`
    : `Verified IFSC Format (${prefix} · Branch ${clean.slice(5)})`;
}

function detectPinRegion(pin: string): string | null {
  const clean = pin.trim();
  if (!/^[1-9]\d{5}$/.test(clean)) return null;
  if (clean.startsWith("788")) return "Assam — Barak Valley (Sribhumi / Karimganj / Silchar)";
  if (clean.startsWith("781") || clean.startsWith("782") || clean.startsWith("783"))
    return "Assam — Brahmaputra Valley (Guwahati / Kamrup)";
  if (clean.startsWith("79")) return "North-East India Postal Circle";
  if (clean.startsWith("700")) return "West Bengal — Kolkata Metropolitan Region";
  if (clean.startsWith("560")) return "Karnataka — Bengaluru Urban";
  if (clean.startsWith("400")) return "Maharashtra — Mumbai Metropolitan Region";
  if (clean.startsWith("110")) return "Delhi NCR Postal Circle";
  if (clean.startsWith("500")) return "Telangana — Hyderabad Metropolitan Region";
  if (clean.startsWith("600")) return "Tamil Nadu — Chennai Metropolitan Region";
  if (clean.startsWith("411")) return "Maharashtra — Pune Region";
  return `Valid Indian Postal PIN (${clean.slice(0, 2)}xxxx Circle)`;
}

function calculateAgeYears(dobIso: string | null | undefined): number | null {
  if (!dobIso) return null;
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function mapCategoryToVehicleType(cat: VehicleCategory): VehicleType {
  if (cat === "CYCLE") return "BICYCLE";
  if (cat === "SCOOTER" || cat === "EV") return "SCOOTER";
  return "MOTORCYCLE";
}

function Page() {
  const { t } = useI18n();
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [flowMode, setFlowMode] = useState<"standard" | "switch">("standard");
  const [isEditingSubmitted, setIsEditingSubmitted] = useState(false);

  // Extended Onboarding Form State
  const [cityZone, setCityZone] = useState("Sribhumi / Karimganj");
  const [pincode, setPincode] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>("BIKE");
  const [dlNumber, setDlNumber] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarLast4, setAadhaarLast4] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [docs, setDocs] = useState<KycDocsState>({
    dlFrontBack: null,
    rcCopy: null,
    panCopy: null,
    aadhaarMasked: null,
    partnerSelfie: null,
  });
  const [agreements, setAgreements] = useState<LegalAgreementsState>({
    serviceAgreement: false,
    roadSafety: false,
    foodHygiene: false,
    privacyGps: false,
  });
  const [expandedAgreement, setExpandedAgreement] = useState<string | null>(null);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [modalSectionIdx, setModalSectionIdx] = useState(1);
  const [copiedAgreement, setCopiedAgreement] = useState(false);

  useEffect(() => {
    void bootstrapRiderFn()
      .then((profile) => {
        setRider(profile);
        if (profile.address) {
          setServiceAddress(profile.address);
          const pinMatch = profile.address.match(/PIN\s*(\d{6})/i);
          if (pinMatch?.[1]) setPincode(pinMatch[1]);
        }
        if (profile.licenceNumber) setDlNumber(profile.licenceNumber);
        if (profile.vehicleRegistration) setRcNumber(profile.vehicleRegistration);
        if (profile.governmentIdLast4) setAadhaarLast4(profile.governmentIdLast4);
        if (profile.governmentIdType?.startsWith("AADHAAR_PAN:")) {
          setPanNumber(profile.governmentIdType.replace("AADHAAR_PAN:", ""));
        }
        if (profile.payoutUpi) setUpiId(profile.payoutUpi);
        if (profile.fullName) setBankAccountHolder(profile.fullName);
        if (profile.vehicleType === "BICYCLE") setVehicleCategory("CYCLE");
        else if (profile.vehicleType === "SCOOTER") setVehicleCategory("SCOOTER");
        else setVehicleCategory("BIKE");

        try {
          const savedDraftRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
          if (savedDraftRaw) {
            const draft = JSON.parse(savedDraftRaw) as Record<string, string>;
            if (draft.cityZone) setCityZone(draft.cityZone);
            if (draft.pincode) setPincode(draft.pincode);
            if (draft.serviceAddress && !profile.address) setServiceAddress(draft.serviceAddress);
            if (draft.panNumber && !panNumber) setPanNumber(draft.panNumber);
            if (draft.bankAccountHolder) setBankAccountHolder(draft.bankAccountHolder);
            if (draft.bankAccountNumber) setBankAccountNumber(draft.bankAccountNumber);
            if (draft.ifsc) setIfsc(draft.ifsc);
          }

          const prefillRaw = localStorage.getItem("orderking_rider_prefill");
          if (prefillRaw) {
            const prefill = JSON.parse(prefillRaw) as {
              fullName?: string;
              phone?: string;
              cityZone?: string;
              vehicleCategory?: VehicleCategory;
            };
            if (prefill.cityZone) setCityZone(prefill.cityZone);
            if (prefill.vehicleCategory) setVehicleCategory(prefill.vehicleCategory);
            setRider((prev) =>
              prev
                ? {
                    ...prev,
                    fullName: prev.fullName || prefill.fullName || "",
                    phone: prev.phone || prefill.phone || "",
                  }
                : prev,
            );
          }
        } catch {
          /* ignore storage read errors */
        }
      })
      .catch((e) => setError(errorMessage(e, t("connectionLostBody"))));
  }, [t]);

  // Persist local draft automatically so rider never loses progress
  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          cityZone,
          pincode,
          serviceAddress,
          panNumber,
          bankAccountHolder,
          bankAccountNumber,
          ifsc,
        }),
      );
    } catch {
      /* ignore quota */
    }
  }, [
    cityZone,
    pincode,
    serviceAddress,
    panNumber,
    bankAccountHolder,
    bankAccountNumber,
    ifsc,
  ]);

  const isExemptVehicle = vehicleCategory === "CYCLE" || vehicleCategory === "EV";
  const pinRegionLabel = useMemo(() => detectPinRegion(pincode), [pincode]);
  const ifscBankLabel = useMemo(() => detectIfscBank(ifsc), [ifsc]);
  const riderAge = useMemo(() => calculateAgeYears(rider?.dateOfBirth), [rider?.dateOfBirth]);

  const allAgreementsAccepted =
    agreements.serviceAgreement &&
    agreements.roadSafety &&
    agreements.foodHygiene &&
    agreements.privacyGps;

  async function save(patch: Partial<RiderProfile> & Record<string, unknown>) {
    setPending(true);
    try {
      const next = await saveProfileFn({ data: patch as Partial<RiderProfile> });
      setRider(next);
      setError(null);
      return next;
    } catch (e) {
      setError(errorMessage(e, t("actionNotConfirmed")));
      throw e;
    } finally {
      setPending(false);
    }
  }

  async function handleSaveDraftNow() {
    if (!rider) return;
    try {
      const cleanPhone = rider.phone.trim().replace(/\D/g, "");
      await save({
        fullName: rider.fullName.trim(),
        phone: cleanPhone,
        email: rider.email.trim(),
        address: serviceAddress.trim() || rider.address,
        dateOfBirth: rider.dateOfBirth,
        emergencyName: rider.emergencyName.trim(),
        emergencyPhone: rider.emergencyPhone.trim().replace(/\D/g, ""),
        vehicleType: mapCategoryToVehicleType(vehicleCategory),
        licenceNumber: dlNumber.trim() || rider.licenceNumber,
        vehicleRegistration: rcNumber.trim() || rider.vehicleRegistration,
        governmentIdLast4: aadhaarLast4.trim() || rider.governmentIdLast4,
        payoutUpi: upiId.trim() || rider.payoutUpi,
      });
      toast.success("Onboarding progress saved to your Partner Profile.");
    } catch {
      /* error already displayed */
    }
  }

  function handleDocUpload(key: keyof KycDocsState, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds 5 MB maximum size. Please select a clearer compressed image or PDF.");
      return;
    }
    setError(null);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setDocs((prev) => ({
          ...prev,
          [key]: {
            name: file.name,
            sizeBytes: file.size,
            previewUrl: typeof reader.result === "string" ? reader.result : null,
          },
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setDocs((prev) => ({
        ...prev,
        [key]: {
          name: file.name,
          sizeBytes: file.size,
          previewUrl: null,
        },
      }));
    }
    toast.info(`${file.name} — Attached for KYC Review`);
  }

  function removeDoc(key: keyof KycDocsState) {
    setDocs((prev) => ({ ...prev, [key]: null }));
  }

  async function handleNextStep() {
    setError(null);
    if (!rider) return;

    if (step === 1) {
      const cleanPhone = rider.phone.trim().replace(/\D/g, "");
      if (!rider.fullName.trim() || !cleanPhone || !serviceAddress.trim() || !rider.dateOfBirth) {
        setError(
          "Please complete Full Legal Name, 10-Digit Mobile Number, Complete Address, and Date of Birth.",
        );
        return;
      }
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
        return;
      }
      if (riderAge !== null && riderAge < 18) {
        setError(
          "Delivery Partners must be at least 18 years of age under Indian labour and motor vehicle laws.",
        );
        return;
      }
      if (!cityZone.trim()) {
        setError("Please enter your Operating City / Service Zone.");
        return;
      }
      if (!/^[1-9]\d{5}$/.test(pincode.trim())) {
        setError("Please enter a valid 6-digit Indian PIN code (e.g., 788710, 781001, 700001).");
        return;
      }
      const cleanEmergencyPhone = rider.emergencyPhone.trim().replace(/\D/g, "");
      if (!rider.emergencyName.trim() || !/^[6-9]\d{9}$/.test(cleanEmergencyPhone)) {
        setError(
          "Emergency Contact Name and a valid 10-digit Emergency Mobile Number are mandatory for on-duty rider safety.",
        );
        return;
      }

      const formattedAddress = serviceAddress.includes("PIN ")
        ? serviceAddress.trim()
        : `${serviceAddress.trim()}, ${cityZone.trim()} - PIN ${pincode.trim()}`;

      await save({
        fullName: rider.fullName.trim(),
        phone: cleanPhone,
        email: rider.email.trim(),
        address: formattedAddress,
        dateOfBirth: rider.dateOfBirth,
        emergencyName: rider.emergencyName.trim(),
        emergencyPhone: cleanEmergencyPhone,
        cityZone: cityZone.trim(),
        serviceAddress: formattedAddress,
        emergencyContactName: rider.emergencyName.trim(),
        emergencyContactPhone: cleanEmergencyPhone,
      });
      if (!bankAccountHolder) setBankAccountHolder(rider.fullName.trim());
      setStep(2);
    } else if (step === 2) {
      if (!isExemptVehicle) {
        if (!dlNumber.trim() || dlNumber.trim().length < 8) {
          setError(
            "Valid Driving Licence Number (minimum 8 characters) is mandatory for Motorcycle and Scooter partners.",
          );
          return;
        }
        if (!rcNumber.trim() || rcNumber.trim().length < 6) {
          setError(
            "Valid Vehicle RC Number (e.g., AS10AB1234) is mandatory for Motorcycle and Scooter partners.",
          );
          return;
        }
      }
      if (!/^\d{4}$/.test(aadhaarLast4.trim())) {
        setError("Please enter the last 4 digits of your Aadhaar Card for statutory KYC verification.");
        return;
      }
      if (panNumber.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.trim().toUpperCase())) {
        setError("Please enter a valid 10-character PAN number (e.g., ABCDE1234F).");
        return;
      }

      const mappedVehicle = mapCategoryToVehicleType(vehicleCategory);
      const effectiveDl = isExemptVehicle
        ? dlNumber.trim() || `${vehicleCategory}_EXEMPT`
        : dlNumber.trim();
      const effectiveRc = isExemptVehicle
        ? rcNumber.trim() || `${vehicleCategory}_EXEMPT`
        : rcNumber.trim();

      const attachedSummary = [
        docs.dlFrontBack ? `DL:${docs.dlFrontBack.name}` : null,
        docs.rcCopy ? `RC:${docs.rcCopy.name}` : null,
        docs.panCopy ? `PAN:${docs.panCopy.name}` : null,
        docs.aadhaarMasked ? `AADHAAR:${docs.aadhaarMasked.name}` : null,
        docs.partnerSelfie ? `SELFIE_BAG:${docs.partnerSelfie.name}` : null,
      ]
        .filter(Boolean)
        .join("; ");

      await save({
        vehicleType: mappedVehicle,
        licenceNumber: effectiveDl,
        vehicleRegistration: effectiveRc,
        governmentIdType: panNumber.trim()
          ? `AADHAAR_PAN:${panNumber.trim().toUpperCase()}`
          : "AADHAAR",
        governmentIdLast4: aadhaarLast4.trim(),
        insuranceRef: rider.insuranceRef || (attachedSummary ? `DOCS(${attachedSummary})` : null),
        dlNumber: effectiveDl,
        rcNumber: effectiveRc,
        aadhaarLast4: aadhaarLast4.trim(),
      });
      setStep(3);
    }
  }

  async function submit() {
    setError(null);
    if (!rider) return;

    if (!upiId.trim() || !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim())) {
      setError(
        "Please provide a valid UPI ID (e.g., 9876543210@ybl or partner@okaxis) for settlements.",
      );
      return;
    }
    if (ifsc.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase())) {
      setError("Please enter a valid 11-character Bank IFSC code (e.g., SBIN0001234).");
      return;
    }
    if (!allAgreementsAccepted) {
      setError(
        "You must review and accept all 4 mandatory Delivery Partner Legal & Safety Agreements before submitting.",
      );
      return;
    }

    setPending(true);
    try {
      const cleanAcc = bankAccountNumber.trim().replace(/\D/g, "");
      const bankLast4 = cleanAcc.length >= 4 ? cleanAcc.slice(-4) : rider.payoutBankLast4;
      const baseAddr = serviceAddress.trim() || rider.address;
      const formattedAddress = baseAddr.includes("PIN ")
        ? baseAddr
        : `${baseAddr}, ${cityZone.trim()}${pincode.trim() ? ` - PIN ${pincode.trim()}` : ""}`;

      const savedProfile = await save({
        fullName: rider.fullName.trim(),
        phone: rider.phone.trim().replace(/\D/g, ""),
        address: formattedAddress,
        payoutUpi: upiId.trim(),
        payoutBankLast4: bankLast4 || null,
        preferredZones:
          rider.preferredZones && rider.preferredZones.length > 0
            ? rider.preferredZones
            : [ZONES[0]],
        availabilityNotes: [
          `CityZone:${cityZone.trim()}`,
          `Vehicle:${vehicleCategory}`,
          ifsc.trim() ? `IFSC:${ifsc.trim().toUpperCase()}` : null,
          `AgreementsAccepted:CSS2020,MVAct1988,FSSAI,ITAct2000`,
        ]
          .filter(Boolean)
          .join(" | "),
        // Expected structured onboarding keys
        cityZone: cityZone.trim(),
        serviceAddress: formattedAddress,
        dlNumber: rider.licenceNumber || dlNumber.trim(),
        rcNumber: rider.vehicleRegistration || rcNumber.trim(),
        aadhaarLast4: rider.governmentIdLast4 || aadhaarLast4.trim(),
        bankAccountHolder: bankAccountHolder.trim() || rider.fullName.trim(),
        bankAccountNumber: cleanAcc,
        ifsc: ifsc.trim().toUpperCase(),
        upiId: upiId.trim(),
        emergencyContactName: rider.emergencyName,
        emergencyContactPhone: rider.emergencyPhone,
        safetyRulesAccepted: true,
      });

      if (savedProfile.kycStatus === "VERIFIED") {
        setRider(savedProfile);
      } else {
        setRider(await submitKycFn());
      }
      setIsEditingSubmitted(false);
      toast.success("KYC & Settlement Application submitted successfully.");
    } catch (e) {
      setError(errorMessage(e, t("actionNotConfirmed")));
    } finally {
      setPending(false);
    }
  }

  const isVerified = rider?.kycStatus === "VERIFIED" || (rider?.kycStatus as string) === "APPROVED";
  const isWaiting =
    (rider?.kycStatus as string) === "PENDING_APPROVAL" ||
    rider?.kycStatus === "SUBMITTED" ||
    rider?.kycStatus === "UNDER_REVIEW" ||
    (rider?.kycStatus as string) === "VERIFYING";

  if ((isVerified || isWaiting) && !isEditingSubmitted) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-6 pt-2 font-sans">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="size-7" />
                </div>
                <div>
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    {isVerified ? "Verified Delivery Partner" : "KYC Verification Under Review"}
                  </span>
                  <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                    {isVerified
                      ? "Partner Account Active & Verified"
                      : "Onboarding Dossier Submitted"}
                  </h1>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsEditingSubmitted(true);
                  setStep(1);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-2xs"
              >
                <Edit3 className="size-3.5" />
                <span>Edit KYC / Bank &amp; UPI Details</span>
              </button>
            </div>

            {/* Complete Self-Service Partner KYC Dossier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  1. Partner Identity
                </span>
                <p className="font-bold text-slate-900 text-sm">{rider?.fullName}</p>
                <p className="text-slate-600">Mobile: +91-{rider?.phone}</p>
                <p className="text-slate-600">DOB: {rider?.dateOfBirth || "Recorded"}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  2. Vehicle &amp; Statutory KYC
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {rider?.vehicleType} ({vehicleCategory})
                </p>
                <p className="text-slate-600">DL: {rider?.licenceNumber || "Exempt"}</p>
                <p className="text-slate-600">
                  RC: {rider?.vehicleRegistration || "Exempt"} · Aadhaar: XXXX-
                  {rider?.governmentIdLast4}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  3. Bank &amp; UPI Settlement
                </span>
                <p className="font-bold text-emerald-800 text-sm">
                  UPI: {rider?.payoutUpi || "Not set"}
                </p>
                <p className="text-slate-600">
                  Bank A/C: {rider?.payoutBankLast4 ? `XXXX-${rider.payoutBankLast4}` : "Linked via UPI"}
                </p>
                <p className="text-slate-600">
                  Emergency: {rider?.emergencyName} ({rider?.emergencyPhone})
                </p>
              </div>

              <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Registered Service Address &amp; Preferred Delivery Zones
                  </span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{rider?.address}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(rider?.preferredZones ?? []).map((z) => (
                    <span
                      key={z}
                      className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-bold text-white"
                    >
                      {z}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-emerald-900">
                    Statutory Partner Payout Structure
                  </span>
                  <p className="text-base sm:text-lg font-extrabold text-slate-900">
                    ₹35 Minimum Base Fare + ₹10/km Distance Pay + Wait-Time Compensation
                  </p>
                </div>
                <span className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shrink-0">
                  {isVerified ? "Verified" : "Submitted"}
                </span>
              </div>
              <p className="mt-2 text-xs text-emerald-950 leading-relaxed">
                {isVerified
                  ? "Your statutory KYC and vehicle credentials are approved. You can go online from the Duty Dashboard to accept live delivery offers."
                  : "Your Driving Licence, Vehicle RC, Aadhaar Last 4, and Bank/UPI settlement details have been logged. You can edit any detail above at any time using the 'Edit KYC / Bank & UPI Details' button."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 transition"
              >
                Go to Duty Dashboard <ArrowRight className="ml-2 size-4" />
              </a>
              <a
                href="/earnings"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
              >
                View Earnings &amp; Settlement Ledger
              </a>
              <button
                type="button"
                onClick={() => setShowAgreementModal(true)}
                className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50/80 px-5 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-100 transition shadow-2xs"
              >
                <FileText className="mr-2 size-4 text-emerald-700" />
                View Executed Partner Agreement (CSS 2020)
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const LEGAL_CLAUSES = [
    {
      id: "serviceAgreement" as const,
      title: "1. Independent Delivery Partner Service Agreement (Code on Social Security, 2020)",
      summary:
        "Establishes principal-to-principal gig/platform worker engagement, transparent payout computation, and statutory social security registration.",
      fullText:
        "You engage with OrderKing Foods Private Limited as an independent platform delivery partner under the Code on Social Security, 2020. Relationship is non-exclusive and principal-to-principal. Per-order payouts comprise Base Fare (₹35 minimum floor), Distance Pay beyond base kilometres, Restaurant Wait-Time Compensation (>5 mins after verified arrival), and 100% pass-through of customer tips.",
    },
    {
      id: "roadSafety" as const,
      title: "2. Road Safety, BIS Helmet & Zero-Intoxication Undertaking (Motor Vehicles Act, 1988)",
      summary:
        "Mandatory ISI/BIS-certified helmet usage, speed adherence, no mobile usage while riding, and zero tolerance for alcohol/narcotics.",
      fullText:
        "While logged into active duty, you undertake to wear a BIS/ISI-certified protective helmet at all times (including pillion if any), carry valid Driving Licence, RC, Fitness, and Third-Party Insurance (unless operating a pedal bicycle or exempted low-speed EV <25 km/h), obey traffic signals, and strictly refrain from operating a vehicle under the influence of alcohol or prohibited substances.",
    },
    {
      id: "foodHygiene" as const,
      title: "3. Food Hygiene & Tamper-Proof Thermal Bag SOP (FSSAI Guidelines)",
      summary:
        "Strict adherence to FSSAI food safety handling, clean insulated delivery bag maintenance, and tamper-evident seal verification at pickup.",
      fullText:
        "In compliance with Food Safety and Standards Authority of India (FSSAI) norms for food delivery personnel, you agree to maintain a clean, sanitized thermal delivery bag, separate hot and cold packages, verify restaurant tamper-evident seals before departing the pickup counter, and never open or tamper with customer food packages.",
    },
    {
      id: "privacyGps" as const,
      title: "4. Rider Privacy Policy & Live GPS Dispatch Consent (Information Technology Act, 2000)",
      summary:
        "Consent for foreground location telemetry strictly during online duty and active deliveries for dispatch routing, ETA calculation, and SOS safety.",
      fullText:
        "Under the Information Technology Act, 2000 and applicable Indian data protection rules, you consent to OrderKing collecting real-time GPS coordinates solely when your status is ONLINE or BUSY on an active order, and retaining KYC records for statutory audit, tax compliance (Income Tax Act), and incident resolution.",
    },
  ];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6 pt-2 font-sans">
        {/* TOP MODE SELECTOR: STANDARD KYC PORTAL VS EXPERIENCED PARTNER FAST-TRACK */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Delivery Partner Onboarding &amp; Statutory KYC Portal
              </p>
              <p className="text-xs text-slate-500">
                Self-service digital KYC verification, vehicle onboarding &amp; bank settlement setup
              </p>
            </div>
          </div>

          <div className="flex w-full sm:w-auto rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setFlowMode("standard")}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                flowMode === "standard"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Standard KYC Application
            </button>

            <button
              type="button"
              onClick={() => setFlowMode("switch")}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                flowMode === "switch"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Experienced Partner Fast-Track
            </button>
          </div>
        </div>

        {flowMode === "switch" ? (
          <ZomatoSwiggySwitchFlow rider={rider} onSuccess={(updated) => setRider(updated)} />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Delivery Partner KYC &amp; Fleet Registration
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete all 3 verification steps to activate your OrderKing Delivery Partner ID
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void handleSaveDraftNow()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Save className="size-3.5" />
                  <span>Save Draft</span>
                </button>
                {isEditingSubmitted && (
                  <button
                    type="button"
                    onClick={() => setIsEditingSubmitted(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    View Dossier
                  </button>
                )}
                <span className="text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                  Step {step} of 3
                </span>
              </div>
            </div>

            {/* Interactive Step Indicator */}
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { num: 1 as const, label: "1. Personal & Zone" },
                  { num: 2 as const, label: "2. Vehicle & KYC Docs" },
                  { num: 3 as const, label: "3. Bank & Agreements" },
                ] as const
              ).map((item) => (
                <button
                  key={item.num}
                  type="button"
                  onClick={() => setStep(item.num)}
                  className="text-left space-y-1.5 group cursor-pointer"
                >
                  <div
                    className={`h-2 rounded-full transition ${
                      step >= item.num
                        ? "bg-slate-900"
                        : "bg-slate-100 group-hover:bg-slate-200"
                    }`}
                  />
                  <p
                    className={`text-[11px] font-bold ${
                      step === item.num ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </p>
                </button>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: PERSONAL, CITY/ZONE & EMERGENCY DETAILS */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Step 1: Personal Identity, Service Zone &amp; Emergency Contact
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    All Indian cities and service zones with a valid 6-digit PIN code are supported.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Full Legal Name (as per Aadhaar / PAN) *
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      placeholder="e.g. Rajesh Kumar Sharma"
                      value={rider?.fullName ?? ""}
                      onChange={(e) => rider && setRider({ ...rider, fullName: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      10-Digit Mobile Number *
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      inputMode="tel"
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={rider?.phone ?? ""}
                      onChange={(e) =>
                        rider && setRider({ ...rider, phone: e.target.value.replace(/\D/g, "") })
                      }
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Email Address
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      type="email"
                      placeholder="partner@email.com"
                      value={rider?.email ?? ""}
                      onChange={(e) => rider && setRider({ ...rider, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Date of Birth (Must be 18+ years) *
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      type="date"
                      value={rider?.dateOfBirth ?? ""}
                      onChange={(e) => rider && setRider({ ...rider, dateOfBirth: e.target.value })}
                    />
                    {riderAge !== null && (
                      <span
                        className={`mt-1 block text-[11px] font-semibold ${
                          riderAge >= 18 ? "text-emerald-800" : "text-rose-700"
                        }`}
                      >
                        {riderAge >= 18
                          ? `Verified Age: ${riderAge} years (Eligible)`
                          : `Age: ${riderAge} years (Minimum 18 years required)`}
                      </span>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Operating City / Service Zone *
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      placeholder="e.g. Sribhumi, Guwahati, Silchar, Kolkata, Bengaluru"
                      value={cityZone}
                      onChange={(e) => setCityZone(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      6-Digit Indian PIN Code *
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="e.g. 788710"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                    />
                    {pinRegionLabel && (
                      <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                        <MapPin className="size-3 text-emerald-700" />
                        <span>{pinRegionLabel}</span>
                      </span>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold text-slate-700">
                      Complete Residential / Service Address *
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      placeholder="House/Flat No., Street, Ward/Locality, Landmark"
                      value={serviceAddress}
                      onChange={(e) => setServiceAddress(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Emergency Contact Name (Family / Next of Kin) *
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      placeholder="Emergency contact full name"
                      value={rider?.emergencyName ?? ""}
                      onChange={(e) =>
                        rider && setRider({ ...rider, emergencyName: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Emergency Contact Phone Number *
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      inputMode="tel"
                      maxLength={10}
                      placeholder="10-digit emergency number"
                      value={rider?.emergencyPhone ?? ""}
                      onChange={(e) =>
                        rider &&
                        setRider({ ...rider, emergencyPhone: e.target.value.replace(/\D/g, "") })
                      }
                    />
                  </div>
                </div>

                <Button
                  className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-bold"
                  disabled={pending}
                  onClick={() => void handleNextStep()}
                >
                  {pending ? "Saving Personal Details..." : "Save & Continue to Vehicle & KYC →"}
                </Button>
              </div>
            )}

            {/* STEP 2: VEHICLE CATEGORY & STATUTORY DOCUMENTS */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Step 2: Vehicle Category &amp; Statutory KYC Documents
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your delivery vehicle category and attach clear copies of your KYC documents.
                  </p>
                </div>

                {/* Vehicle Category Selector */}
                <div>
                  <Label className="text-xs font-semibold text-slate-700">
                    Select Delivery Vehicle Category *
                  </Label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(
                      [
                        {
                          id: "BIKE",
                          title: "Motorcycle (BIKE)",
                          sub: "DL & RC Mandatory",
                        },
                        {
                          id: "SCOOTER",
                          title: "Scooter (SCOOTER)",
                          sub: "DL & RC Mandatory",
                        },
                        {
                          id: "EV",
                          title: "Low-Speed EV",
                          sub: "<25 km/h · DL/RC Exempt",
                        },
                        {
                          id: "CYCLE",
                          title: "Bicycle (CYCLE)",
                          sub: "Short-Range · DL/RC Exempt",
                        },
                      ] as const
                    ).map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVehicleCategory(v.id)}
                        className={`rounded-xl border p-3 text-left transition ${
                          vehicleCategory === v.id
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Bike className="size-3.5 shrink-0" />
                          <span>{v.title}</span>
                        </div>
                        <p
                          className={`mt-1 text-[11px] ${
                            vehicleCategory === v.id ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {v.sub}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {isExemptVehicle && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-950 dark:text-emerald-200">
                    <p className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                      Statutory Driving Licence (DL) Exemption Notice (
                      {vehicleCategory === "CYCLE"
                        ? "Pedal Bicycle"
                        : "Electric Vehicle — Low-Speed EV / Electric Cycle"}
                      )
                    </p>
                    <p className="mt-1 leading-relaxed">
                      In accordance with national delivery partner fleet standards and Central Motor Vehicles Rules (CMVR Rule 2(u)), <strong>Driving Licence (DL) is NOT MANDATORY</strong> for EV (Electric Cycle/Scooter &lt; 25 km/h) and Bicycle delivery partners. <strong>Aadhaar + PAN + Partner Selfie with Bag</strong> are sufficient for onboarding verification; DL is only required for petrol two-wheelers.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Driving Licence Number {isExemptVehicle ? "(Optional / Exempt)" : "*"}
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      placeholder={
                        isExemptVehicle ? "Exempt for Cycle / Low-Speed EV" : "e.g. AS1020180012345"
                      }
                      value={dlNumber}
                      onChange={(e) => setDlNumber(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Vehicle Registration (RC) Number {isExemptVehicle ? "(Optional / Exempt)" : "*"}
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      placeholder={
                        isExemptVehicle ? "Exempt for Cycle / Low-Speed EV" : "e.g. AS10AB1234"
                      }
                      value={rcNumber}
                      onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      PAN Card Number (for Tax &amp; TDS Compliance)
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      maxLength={10}
                      placeholder="e.g. ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Aadhaar Card Number (Last 4 Digits Only) *
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      maxLength={4}
                      inputMode="numeric"
                      placeholder="Last 4 digits (e.g. 4821)"
                      value={aadhaarLast4}
                      onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>

                {/* Document Upload Verification Section with Real Image Thumbnail Preview */}
                <div className="space-y-3 pt-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Document Upload Verification (Recorded for KYC Compliance Review)
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(
                      [
                        {
                          key: "dlFrontBack" as const,
                          label: isExemptVehicle
                            ? "Driving Licence (Exempt for Cycle/EV)"
                            : "Driving Licence (Front & Back)",
                        },
                        {
                          key: "rcCopy" as const,
                          label: isExemptVehicle
                            ? "Vehicle RC / Cycle Ownership Note"
                            : "Vehicle Registration Certificate (RC)",
                        },
                        {
                          key: "panCopy" as const,
                          label: "PAN Card Copy",
                        },
                        {
                          key: "aadhaarMasked" as const,
                          label: "Masked Aadhaar Card (Front & Back)",
                        },
                        {
                          key: "partnerSelfie" as const,
                          label: isExemptVehicle
                            ? "Partner Selfie with Bag (Mandatory for Cycle/EV)"
                            : "Partner Selfie with Delivery Bag",
                        },
                      ] as const
                    ).map((docItem) => {
                      const attached = docs[docItem.key];
                      return (
                        <div
                          key={docItem.key}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-col justify-between gap-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              {docItem.label}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-800 hover:bg-slate-100 transition">
                                <Upload className="size-3 text-slate-600" />
                                <span>{attached ? "Replace" : "Attach File"}</span>
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  className="hidden"
                                  onChange={(e) => handleDocUpload(docItem.key, e)}
                                />
                              </label>
                              {attached && (
                                <button
                                  type="button"
                                  onClick={() => removeDoc(docItem.key)}
                                  className="rounded-lg border border-rose-200 bg-rose-50 p-1 text-rose-700 hover:bg-rose-100"
                                  title="Remove attached file"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {attached ? (
                            <div className="space-y-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-[11px] text-emerald-900">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate font-medium">
                                  {attached.name} ({formatBytes(attached.sizeBytes)})
                                </span>
                                <span className="shrink-0 font-bold text-emerald-800 flex items-center gap-1">
                                  <FileCheck className="size-3" />
                                  Attached for KYC Review
                                </span>
                              </div>
                              {attached.previewUrl && (
                                <img
                                  src={attached.previewUrl}
                                  alt={docItem.label}
                                  className="max-h-24 rounded border border-emerald-200 bg-white object-contain p-0.5"
                                />
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500">
                              Accepted formats: JPG, PNG, PDF (Max 5 MB)
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-slate-300 text-slate-800"
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </Button>
                  <Button
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                    disabled={pending}
                    onClick={() => void handleNextStep()}
                  >
                    {pending ? "Saving KYC Details..." : "Next: Bank & Legal Agreements →"}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: BANK PAYOUT, ZONES & MANDATORY LEGAL AGREEMENTS */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Step 3: Bank Settlement Account, Zones &amp; Statutory Agreements
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure your bank/UPI payout credentials and accept mandatory statutory safety undertakings.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Bank Account Holder Name *
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      placeholder="Name as per bank passbook"
                      value={bankAccountHolder}
                      onChange={(e) => setBankAccountHolder(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Bank Account Number
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      inputMode="numeric"
                      placeholder="9 to 18 digit bank account number"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Bank IFSC Code
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      maxLength={11}
                      placeholder="e.g. SBIN0001234"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    />
                    {ifscBankLabel && (
                      <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                        <Building2 className="size-3 text-emerald-700" />
                        <span>{ifscBankLabel}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Verified UPI ID for Payouts *
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      placeholder="e.g. 9876543210@ybl or name@okaxis"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                    />
                  </div>
                </div>

                {/* Preferred Zones */}
                <div>
                  <Label className="text-xs font-semibold text-slate-700">
                    Preferred Operational Delivery Zones ({t("zones")})
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ZONES.map((z) => {
                      const on = rider?.preferredZones?.includes(z) ?? false;
                      return (
                        <button
                          key={z}
                          type="button"
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition ${
                            on
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                          onClick={() => {
                            if (!rider) return;
                            const preferredZones = on
                              ? rider.preferredZones.filter((x) => x !== z)
                              : [...rider.preferredZones, z];
                            setRider({ ...rider, preferredZones });
                          }}
                        >
                          {z}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Statutory Benefits & Insurance Callout under Code on Social Security 2020 */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-2xs">
                        <Scale className="size-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                          Code on Social Security, 2020 Statutory Partner Benefits
                        </h4>
                        <p className="text-[11px] text-emerald-900 font-medium">
                          Official OrderKing Independent Delivery Partner Agreement (Act No. 36 of 2020)
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAgreementModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-1.5 text-xs font-bold text-emerald-950 hover:bg-emerald-100 transition shadow-2xs"
                    >
                      <FileText className="size-3.5 text-emerald-700" />
                      <span>Inspect Official 13-Section Agreement</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                    <div className="rounded-xl bg-white/90 border border-emerald-200/90 p-3 space-y-1">
                      <span className="font-bold text-emerald-950 block">Aggregator Welfare Fund</span>
                      <p className="text-emerald-900 leading-relaxed">
                        1.5% platform turnover contribution under Section 114 to Central Social Security Fund. Zero rider deduction.
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/90 border border-emerald-200/90 p-3 space-y-1">
                      <span className="font-bold text-emerald-950 block">Group Accidental Cover</span>
                      <p className="text-emerald-900 leading-relaxed">
                        ₹10,00,000 Death &amp; Disability + ₹1,00,000 Emergency Hospitalization on active duty at zero premium cost.
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/90 border border-emerald-200/90 p-3 space-y-1">
                      <span className="font-bold text-emerald-950 block">Principal-to-Principal Autonomy</span>
                      <p className="text-emerald-900 leading-relaxed">
                        Absolute freedom over login shifts, multi-app non-exclusivity, and 2-tier dispute arbitration under Indian law.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mandatory Delivery Partner Legal & Safety Agreements */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Mandatory Delivery Partner Legal &amp; Safety Agreements *
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Review the statutory summaries below and check all 4 undertakings to submit your KYC application.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setAgreements({
                          serviceAgreement: true,
                          roadSafety: true,
                          foodHygiene: true,
                          privacyGps: true,
                        })
                      }
                      className="shrink-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-800 hover:bg-slate-100 transition"
                    >
                      Accept All 4
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {LEGAL_CLAUSES.map((clause) => {
                      const checked = agreements[clause.id];
                      const isExpanded = expandedAgreement === clause.id;
                      return (
                        <div
                          key={clause.id}
                          className="rounded-xl border border-slate-200 bg-white p-3.5 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  setAgreements((prev) => ({
                                    ...prev,
                                    [clause.id]: e.target.checked,
                                  }))
                                }
                                className="mt-0.5 size-4 rounded border-slate-300 accent-slate-900"
                              />
                              <div>
                                <span className="text-xs font-bold text-slate-900 block">
                                  {clause.title}
                                </span>
                                <span className="text-[11px] text-slate-600 mt-0.5 block">
                                  {clause.summary}
                                </span>
                              </div>
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedAgreement(isExpanded ? null : clause.id)
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 shrink-0"
                            >
                              <span>{isExpanded ? "Hide Text" : "Read Full Clause"}</span>
                              {isExpanded ? (
                                <ChevronUp className="size-3.5" />
                              ) : (
                                <ChevronDown className="size-3.5" />
                              )}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="mt-2.5 border-t border-slate-100 pt-2.5 text-[11px] text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-2.5">
                              {clause.fullText}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-slate-300 text-slate-800"
                    onClick={() => setStep(2)}
                  >
                    ← Back
                  </Button>
                  <Button
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                    disabled={pending || !allAgreementsAccepted}
                    onClick={() => void submit()}
                  >
                    {pending
                      ? "Submitting KYC Application..."
                      : isEditingSubmitted
                        ? "Save & Update KYC Dossier"
                        : t("submitKyc")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Official Delivery Partner Agreement Modal (13 Statutory Sections) */}
        {showAgreementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
            <div className="relative w-full max-w-4xl rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <Scale className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {ORDERKING_PARTNER_AGREEMENT_METADATA.complianceFramework}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {ORDERKING_PARTNER_AGREEMENT_METADATA.version}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                      {ORDERKING_PARTNER_AGREEMENT_METADATA.documentTitle}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAgreementModal(false)}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Modal Body: Left Section List + Right Section Legal Text */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
                {/* Left Section Navigation */}
                <div className="md:col-span-4 border-r border-slate-100 overflow-y-auto p-3 space-y-1 bg-slate-50/50 max-h-[480px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                    Agreement Sections (13)
                  </span>
                  {ORDERKING_PARTNER_AGREEMENT_SECTIONS.map((sec, idx) => (
                    <button
                      key={sec.sectionNumber}
                      type="button"
                      onClick={() => setModalSectionIdx(idx)}
                      className={`w-full text-left p-2.5 rounded-xl border transition ${
                        modalSectionIdx === idx
                          ? "border-slate-900 bg-slate-900 text-white shadow-2xs"
                          : "border-slate-200/80 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            modalSectionIdx === idx ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          Sec {sec.sectionNumber}
                        </span>
                        <ChevronRight
                          className={`size-3 ${
                            modalSectionIdx === idx ? "text-white" : "text-slate-400"
                          }`}
                        />
                      </div>
                      <p className="font-bold text-xs truncate mt-0.5">{sec.title}</p>
                    </button>
                  ))}
                </div>

                {/* Right Content */}
                <div className="md:col-span-8 overflow-y-auto p-5 space-y-4 max-h-[480px]">
                  {ORDERKING_PARTNER_AGREEMENT_SECTIONS[modalSectionIdx] && (
                    <>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {ORDERKING_PARTNER_AGREEMENT_SECTIONS[modalSectionIdx].statutoryBasis}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 mt-1.5">
                          Section {ORDERKING_PARTNER_AGREEMENT_SECTIONS[modalSectionIdx].sectionNumber}:{" "}
                          {ORDERKING_PARTNER_AGREEMENT_SECTIONS[modalSectionIdx].title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          {ORDERKING_PARTNER_AGREEMENT_SECTIONS[modalSectionIdx].summary}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 font-mono text-[11px] text-slate-700 leading-relaxed whitespace-pre-line max-h-[220px] overflow-y-auto">
                        {ORDERKING_PARTNER_AGREEMENT_SECTIONS[modalSectionIdx].fullLegalText}
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                          Operational Safeguards &amp; Statutory Terms:
                        </span>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {ORDERKING_PARTNER_AGREEMENT_SECTIONS[modalSectionIdx].keyHighlights.map((hl, i) => (
                            <li
                              key={i}
                              className="p-2 rounded-lg border border-slate-200 bg-white flex items-start gap-1.5"
                            >
                              <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0 mt-0.5" />
                              <span className="text-slate-700 text-[11px]">{hl}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5 bg-slate-50/70">
                <button
                  type="button"
                  onClick={() => {
                    const md = getFullAgreementLegalMarkdown({
                      partnerName: rider?.fullName,
                      phone: rider?.phone,
                      pan: panNumber,
                      aadhaarLast4: aadhaarLast4,
                      contractId: `OK-AGMT-CSS2020-${rider?.id || Date.now()}`,
                    });
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      void navigator.clipboard.writeText(md);
                      setCopiedAgreement(true);
                      setTimeout(() => setCopiedAgreement(false), 2500);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                >
                  {copiedAgreement ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" />
                      <span>Copied Full Agreement</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-slate-500" />
                      <span>Copy Full Agreement (13 Sections)</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAgreements({
                        serviceAgreement: true,
                        roadSafety: true,
                        foodHygiene: true,
                        privacyGps: true,
                      });
                      setShowAgreementModal(false);
                      toast.success("All 4 statutory undertakings accepted.");
                    }}
                    className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition shadow-2xs"
                  >
                    Accept &amp; Close Viewer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAgreementModal(false)}
                    className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 text-xs font-bold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
