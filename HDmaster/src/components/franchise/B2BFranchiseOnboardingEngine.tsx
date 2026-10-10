import React, { useState, useEffect } from "react";
import {
  FileText,
  Receipt,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Coins,
  FileSignature,
  Printer,
  Plus,
  RefreshCw,
  Search,
  Scale,
  CreditCard,
  Hash,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  UserCheck,
  Briefcase,
  Layers,
  Percent,
  Trash2,
} from "lucide-react";
import {
  getFranchiseOnboardingData,
  createFranchiseContract,
  recordFranchisePayment,
  executeContractSignature,
  deleteFranchiseContract,
  type B2BFranchiseContractRecord,
  type FranchiseSummaryMetrics,
  type ExistingRestaurantOption,
  type FranchiseTier,
  TIER_CONFIGS,
} from "@/lib/orderking/franchise-engine";

export function B2BFranchiseOnboardingEngine() {
  const [activeTab, setActiveTab] = useState<"ledger" | "generator" | "playbook">("ledger");
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<B2BFranchiseContractRecord[]>([]);
  const [metrics, setMetrics] = useState<FranchiseSummaryMetrics>({
    totalContracts: 0,
    totalCapitalCollectedInr: 0,
    pendingCapitalPipelineInr: 0,
    totalSetupFeeInvoicedInr: 0,
    executedContractsCount: 0,
    avgDealValueInr: 0,
  });
  const [restaurants, setRestaurants] = useState<ExistingRestaurantOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Selected modal / viewer states
  const [viewingContract, setViewingContract] = useState<B2BFranchiseContractRecord | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<B2BFranchiseContractRecord | null>(null);
  const [paymentModalContract, setPaymentModalContract] = useState<B2BFranchiseContractRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI_DIRECT");
  const [paymentReference, setPaymentReference] = useState("");
  const [signatureModalContract, setSignatureModalContract] = useState<B2BFranchiseContractRecord | null>(null);
  const [signatoryNameInput, setSignatoryNameInput] = useState("");
  const [signatoryTitleInput, setSignatoryTitleInput] = useState("Managing Partner / Proprietor");
  const [actionLoading, setActionLoading] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Form State for Generator
  const [formRestaurantId, setFormRestaurantId] = useState<string>("");
  const [formRestaurantName, setFormRestaurantName] = useState("");
  const [formLegalEntity, setFormLegalEntity] = useState("");
  const [formBrandName, setFormBrandName] = useState("");
  const [formSignatoryName, setFormSignatoryName] = useState("");
  const [formSignatoryTitle, setFormSignatoryTitle] = useState("Managing Partner / Managing Director");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formGstin, setFormGstin] = useState("");
  const [formPan, setFormPan] = useState("");
  const [formFssai, setFormFssai] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("Karimganj");
  const [formStateVal, setFormStateVal] = useState("Assam");
  const [formPincode, setFormPincode] = useState("788710");
  const [formTier, setFormTier] = useState<FranchiseTier>("PRIORITY_PARTNER");
  const [formSetupFee, setFormSetupFee] = useState<number>(25000);

  // Load real data
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getFranchiseOnboardingData();
      setContracts(data.contracts || []);
      setMetrics(data.metrics);
      setRestaurants(data.restaurants || []);
    } catch (err) {
      console.error("Failed to load franchise data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectExistingRestaurant = (rstId: string) => {
    setFormRestaurantId(rstId);
    const r = restaurants.find((item) => item.id === rstId);
    if (r) {
      setFormRestaurantName(r.name);
      setFormLegalEntity(r.legal_name || `${r.name} Hospitality Pvt Ltd`);
      setFormBrandName(r.name);
      if (r.address) {
        setFormAddress(r.address);
      }
    }
  };

  const handleTierChange = (t: FranchiseTier) => {
    setFormTier(t);
    setFormSetupFee(TIER_CONFIGS[t].baseFeeInr);
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRestaurantName.trim() || !formLegalEntity.trim() || !formSignatoryName.trim()) {
      alert("Please provide the Restaurant Name, Legal Entity Name, and Authorized Signatory.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await createFranchiseContract({
        data: {
          restaurantId: formRestaurantId || undefined,
          restaurantName: formRestaurantName,
          legalEntityName: formLegalEntity,
          brandName: formBrandName || formRestaurantName,
          signatoryName: formSignatoryName,
          signatoryTitle: formSignatoryTitle,
          contactEmail: formEmail || "partner@merchant.in",
          contactPhone: formPhone || "+91 98765 43210",
          gstin: formGstin || undefined,
          panNumber: formPan || undefined,
          fssaiLicense: formFssai || undefined,
          registeredAddress: formAddress || "Station Road, Commercial Ward No. 3",
          city: formCity,
          state: formStateVal,
          pincode: formPincode,
          tier: formTier,
          setupFeeInr: formSetupFee,
          paymentMethod: "UPI_NEFT_ESCROW",
        },
      });

      if (res.ok) {
        setBannerNotice(`Contract & Form GST INV-1 successfully issued for ${formRestaurantName}!`);
        await loadData();
        setActiveTab("ledger");
        setTimeout(() => setBannerNotice(null), 6000);
      } else {
        alert(res.error || "Failed to create franchise contract.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to generate contract.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentModalContract) return;
    if (!paymentReference.trim()) {
      alert("Please enter the UTR or Bank Settlement Reference Number.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await recordFranchisePayment({
        data: {
          contractId: paymentModalContract.id,
          paymentMethod,
          paymentReference: paymentReference.trim(),
        },
      });
      if (res.ok) {
        setBannerNotice(`Payment of ₹${Number(paymentModalContract.total_payable_inr).toLocaleString("en-IN")} recorded as SETTLED.`);
        setPaymentModalContract(null);
        setPaymentReference("");
        await loadData();
        setTimeout(() => setBannerNotice(null), 5000);
      } else {
        alert(res.error || "Failed to update payment status.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to settle payment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteSignature = async () => {
    if (!signatureModalContract) return;
    if (!signatoryNameInput.trim()) {
      alert("Please enter the Signatory Full Legal Name.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await executeContractSignature({
        data: {
          contractId: signatureModalContract.id,
          signatoryName: signatoryNameInput.trim(),
          signatoryTitle: signatoryTitleInput.trim(),
        },
      });
      if (res.ok) {
        setBannerNotice(`Master Agreement ${signatureModalContract.contract_number} digitally signed & executed!`);
        setSignatureModalContract(null);
        await loadData();
        setTimeout(() => setBannerNotice(null), 5000);
      } else {
        alert(res.error || "Failed to attest digital signature.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to attest digital signature.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteContract = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to void and remove contract for ${name}?`)) return;
    try {
      await deleteFranchiseContract({ data: { contractId: id } });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.legal_entity_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "ALL") return true;
    if (statusFilter === "PAID") return c.payment_status === "PAID" || c.payment_status === "SETTLED";
    if (statusFilter === "PENDING") return c.payment_status === "PENDING";
    if (statusFilter === "EXECUTED") return c.contract_status === "EXECUTED" || c.terms_accepted;
    return true;
  });

  return (
    <div className="w-full bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
      {/* Institutional Capital Acquisition Header */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                <Coins className="h-3.5 w-3.5 text-emerald-600" />
                Pre-Launch Capital Acquisition Engine
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                GST SAC 998314 Compliant
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              B2B Franchise Onboarding & Setup Fee Engine
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              Immediate pre-launch monetization terminal for the Founder. Generates legally enforceable
              <strong> Master Merchant Service Agreements (MMSA)</strong> and <strong>Form GST INV-1 Tax Invoices</strong> to
              charge restaurants an immediate upfront Priority Integration Fee (₹10,000 – ₹50,000) prior to public consumer app release.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setActiveTab("generator");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-all hover:shadow"
            >
              <Plus className="h-4 w-4" />
              Issue New Contract & Invoice
            </button>
            <button
              onClick={loadData}
              title="Refresh Records"
              className="rounded-xl border border-slate-300 bg-white hover:bg-slate-100 p-2.5 text-slate-700 transition-colors shadow-xs"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Global Live Capital Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
              <span>Realized Upfront Capital</span>
              <Coins className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-950">
              ₹{metrics.totalCapitalCollectedInr.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-emerald-700 mt-1 font-medium">
              Immediate non-dilutive founder runway
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
              <span>Invoiced Pipeline Inflow</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-950">
              ₹{metrics.pendingCapitalPipelineInr.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-amber-700 mt-1 font-medium">
              Issued invoices awaiting bank settlement
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1">
              <span>Executed Contracts</span>
              <FileSignature className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-950">
              {metrics.executedContractsCount} <span className="text-sm font-semibold text-blue-700">/ {metrics.totalContracts}</span>
            </div>
            <div className="text-xs text-blue-700 mt-1 font-medium">
              Cryptographically signed agreements
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              <span>Avg Franchise Ticket</span>
              <TrendingUp className="h-4 w-4 text-slate-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              ₹{metrics.avgDealValueInr.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Per-merchant onboarding monetization
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Notification Banner */}
      {bannerNotice && (
        <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{bannerNotice}</span>
          </div>
          <button onClick={() => setBannerNotice(null)} className="text-emerald-200 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation Ribbon */}
      <div className="border-b border-slate-200 bg-slate-100/80 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 py-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("ledger")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "ledger"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Receipt className="h-4 w-4 text-blue-600" />
            <span>Franchise Invoices & Contracts Ledger</span>
            <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-800 font-mono">
              {contracts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("generator")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "generator"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <FileSignature className="h-4 w-4 text-emerald-600" />
            <span>Generate Contract & Tax Invoice</span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 uppercase font-semibold">
              Live Tool
            </span>
          </button>

          <button
            onClick={() => setActiveTab("playbook")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "playbook"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Briefcase className="h-4 w-4 text-indigo-600" />
            <span>Founder Capital Acquisition Playbook</span>
            <span className="rounded-full bg-indigo-100 text-indigo-800 text-[9px] px-1.5 py-0.2 uppercase font-semibold">
              Strategy
            </span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-6 md:p-8 bg-slate-50/50">
        {/* ========================================================================= */}
        {/* TAB 1: LEDGER */}
        {/* ========================================================================= */}
        {activeTab === "ledger" && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by restaurant, legal entity, invoice #..."
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="ALL">All Records</option>
                  <option value="PAID">Paid / Settled Only</option>
                  <option value="PENDING">Pending Settlement</option>
                  <option value="EXECUTED">Digitally Executed</option>
                </select>
              </div>
            </div>

            {/* Zero Fake Data Honest Ledger */}
            {contracts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-2xl mx-auto shadow-xs space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Receipt className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">Zero Onboarding Contracts Invoiced Yet</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    This ledger reflects real records directly from PostgreSQL. Use the generator to issue your first
                    Master Merchant Franchise Agreement & Form GST INV-1 Tax Invoice to secure ₹10,000 – ₹50,000 upfront.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("generator")}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Issue First Franchise Contract
                </button>
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                No contracts match your search query: "{searchQuery}".
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-4">Agreement & Invoice #</th>
                        <th className="py-3.5 px-4">Restaurant & Legal Entity</th>
                        <th className="py-3.5 px-4">Tier Specification</th>
                        <th className="py-3.5 px-4">Upfront Fee + GST</th>
                        <th className="py-3.5 px-4">Payment Settlement</th>
                        <th className="py-3.5 px-4">Legal Attestation</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800 font-sans">
                      {filteredContracts.map((c) => {
                        const isPaid = c.payment_status === "PAID" || c.payment_status === "SETTLED";
                        const isExecuted = c.contract_status === "EXECUTED" || c.terms_accepted;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Agreement and Invoice # */}
                            <td className="py-4 px-4 align-top">
                              <div className="font-mono font-bold text-slate-900 text-[11px]">{c.contract_number}</div>
                              <div className="font-mono text-slate-500 text-[10px] mt-0.5">{c.invoice_number}</div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {new Date(c.created_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            </td>

                            {/* Restaurant & Entity */}
                            <td className="py-4 px-4 align-top">
                              <div className="font-bold text-slate-900 text-sm">{c.restaurant_name}</div>
                              <div className="text-slate-600 text-xs">{c.legal_entity_name}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Signatory: <strong>{c.signatory_name}</strong> ({c.signatory_title})
                              </div>
                              {c.gstin && (
                                <div className="font-mono text-[10px] text-slate-400 mt-0.5">GSTIN: {c.gstin}</div>
                              )}
                            </td>

                            {/* Tier */}
                            <td className="py-4 px-4 align-top">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  c.tier === "EXECUTIVE_FLAGSHIP"
                                    ? "bg-purple-100 text-purple-900 border border-purple-200"
                                    : c.tier === "PRIORITY_PARTNER"
                                    ? "bg-blue-100 text-blue-900 border border-blue-200"
                                    : "bg-slate-100 text-slate-900 border border-slate-200"
                                }`}
                              >
                                {c.tier === "EXECUTIVE_FLAGSHIP"
                                  ? "Sovereign Flagship (₹50k)"
                                  : c.tier === "PRIORITY_PARTNER"
                                  ? "Growth Partner (₹25k)"
                                  : "Standard Priority (₹10k)"}
                              </span>
                              <div className="text-[10px] text-slate-500 mt-1">
                                {TIER_CONFIGS[c.tier]?.tagline || "Onboarding Tier"}
                              </div>
                            </td>

                            {/* Upfront Fee + GST */}
                            <td className="py-4 px-4 align-top">
                              <div className="font-bold text-slate-900 text-sm">
                                ₹{Number(c.total_payable_inr).toLocaleString("en-IN")}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Base: ₹{Number(c.setup_fee_inr).toLocaleString("en-IN")} + 18% GST (₹
                                {Number(c.gst_amount_inr).toLocaleString("en-IN")})
                              </div>
                              <div className="text-[9px] font-mono text-slate-400 mt-0.5">SAC Code: 998314</div>
                            </td>

                            {/* Payment Settlement */}
                            <td className="py-4 px-4 align-top">
                              {isPaid ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="h-3 w-3" /> SETTLED
                                  </span>
                                  {c.payment_reference && (
                                    <div className="font-mono text-[9px] text-slate-600 truncate max-w-[120px]" title={c.payment_reference}>
                                      Ref: {c.payment_reference}
                                    </div>
                                  )}
                                  {c.paid_at && (
                                    <div className="text-[9px] text-slate-400">
                                      {new Date(c.paid_at).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                      })}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                                    <Clock className="h-3 w-3" /> PENDING
                                  </span>
                                  <button
                                    onClick={() => {
                                      setPaymentModalContract(c);
                                      setPaymentReference("");
                                    }}
                                    className="block text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                                  >
                                    Record Payment →
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Legal Attestation */}
                            <td className="py-4 px-4 align-top">
                              {isExecuted ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-300">
                                    <ShieldCheck className="h-3 w-3" /> EXECUTED
                                  </span>
                                  <div className="text-[9px] text-slate-500">
                                    Signed by {c.signatory_name}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                                    ISSUED
                                  </span>
                                  <button
                                    onClick={() => {
                                      setSignatureModalContract(c);
                                      setSignatoryNameInput(c.signatory_name);
                                      setSignatoryTitleInput(c.signatory_title);
                                    }}
                                    className="block text-[10px] font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                                  >
                                    Sign Contract →
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 align-top text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setViewingContract(c)}
                                  title="View Digital Agreement (MMSA)"
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs"
                                >
                                  <FileText className="h-3 w-3 text-blue-600" />
                                  <span>Contract</span>
                                </button>
                                <button
                                  onClick={() => setViewingInvoice(c)}
                                  title="View Form GST INV-1 Tax Invoice"
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs"
                                >
                                  <Receipt className="h-3 w-3 text-emerald-600" />
                                  <span>Invoice</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteContract(c.id, c.restaurant_name)}
                                  title="Void Contract"
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: GENERATOR */}
        {/* ========================================================================= */}
        {activeTab === "generator" && (
          <form onSubmit={handleCreateContract} className="space-y-8 max-w-5xl mx-auto">
            {/* Header info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">
                  Issue Master Merchant Agreement & Form GST INV-1
                </h2>
                <p className="text-xs text-slate-600">
                  Generate digital onboarding paperwork for upfront priority onboarding capital monetization.
                </p>
              </div>

              {/* Quick auto-fill from existing restaurants */}
              {restaurants.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                    Auto-Fill From Registered Restaurant:
                  </span>
                  <select
                    value={formRestaurantId}
                    onChange={(e) => handleSelectExistingRestaurant(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">-- Choose Merchant --</option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Step 1: Priority Setup Fee Tier Selection */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Select Upfront Priority Setup & Licensing Fee Tier (₹10,000 – ₹50,000)
                  </h3>
                </div>
                <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Immediate Founder Capital Inflow
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Tier 1 */}
                <div
                  onClick={() => handleTierChange("STANDARD_MERCHANT")}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all relative ${
                    formTier === "STANDARD_MERCHANT"
                      ? "border-slate-900 bg-slate-50/80 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Standard Priority
                    </span>
                    <span className="text-base font-black text-slate-900">₹10,000</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mb-3 leading-snug">
                    {TIER_CONFIGS.STANDARD_MERCHANT.tagline}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-200">
                    + 18% GST (₹1,800) = <strong>₹11,800 Total</strong>
                  </div>
                </div>

                {/* Tier 2 */}
                <div
                  onClick={() => handleTierChange("PRIORITY_PARTNER")}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all relative ${
                    formTier === "PRIORITY_PARTNER"
                      ? "border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="absolute -top-2.5 right-4 rounded-full bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 tracking-wider uppercase">
                    Most Popular
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Growth Franchise Partner
                    </span>
                    <span className="text-base font-black text-blue-950">₹25,000</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mb-3 leading-snug">
                    {TIER_CONFIGS.PRIORITY_PARTNER.tagline}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-blue-200">
                    + 18% GST (₹4,500) = <strong>₹29,500 Total</strong>
                  </div>
                </div>

                {/* Tier 3 */}
                <div
                  onClick={() => handleTierChange("EXECUTIVE_FLAGSHIP")}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all relative ${
                    formTier === "EXECUTIVE_FLAGSHIP"
                      ? "border-purple-600 bg-purple-50/50 shadow-sm ring-1 ring-purple-600"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Sovereign Flagship
                    </span>
                    <span className="text-base font-black text-purple-950">₹50,000</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mb-3 leading-snug">
                    {TIER_CONFIGS.EXECUTIVE_FLAGSHIP.tagline}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-purple-200">
                    + 18% GST (₹9,000) = <strong>₹59,000 Total</strong>
                  </div>
                </div>
              </div>

              {/* Deliverables preview based on selected tier */}
              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  Legally Contracted Deliverables ({TIER_CONFIGS[formTier].name}):
                </span>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
                  {TIER_CONFIGS[formTier].deliverables.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Step 2: Merchant Legal & Statutory Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                  2
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Merchant Enterprise & Statutory Profile
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Restaurant Trade Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formRestaurantName}
                    onChange={(e) => setFormRestaurantName(e.target.value)}
                    placeholder="e.g. Biryani House Express"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Legal Registered Entity Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formLegalEntity}
                    onChange={(e) => setFormLegalEntity(e.target.value)}
                    placeholder="e.g. Royal Bengal Hospitality Pvt. Ltd."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Authorized Signatory Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSignatoryName}
                    onChange={(e) => setFormSignatoryName(e.target.value)}
                    placeholder="e.g. Mohammed Farhan"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Signatory Corporate Designation
                  </label>
                  <input
                    type="text"
                    value={formSignatoryTitle}
                    onChange={(e) => setFormSignatoryTitle(e.target.value)}
                    placeholder="Managing Partner / Proprietor"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Contact Email
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="partner@restaurant.com"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GSTIN Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value)}
                    placeholder="18AAAAA0000A1Z5"
                    className="w-full font-mono rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    FSSAI License / Registration No. (Optional)
                  </label>
                  <input
                    type="text"
                    value={formFssai}
                    onChange={(e) => setFormFssai(e.target.value)}
                    placeholder="10321000000001"
                    className="w-full font-mono rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Commercial Address
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Holding #42, Main Road, Commercial Hub"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formStateVal}
                    onChange={(e) => setFormStateVal(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={formPincode}
                    onChange={(e) => setFormPincode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Financial & Tax Computation Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                  3
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Financial Invoice Computation (Form GST INV-1)
                </h3>
              </div>

              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">
                    Service Description (SAC 998314): Priority Setup & Digitization Fee
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{formSetupFee.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Goods and Services Tax (GST @ 18.00%):</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{Math.round(formSetupFee * 0.18).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-900">Total Upfront Amount Payable:</span>
                  <span className="font-mono text-base text-emerald-700">
                    ₹{(formSetupFee + Math.round(formSetupFee * 0.18)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("ledger")}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  <FileSignature className="h-4 w-4" />
                  {actionLoading ? "Issuing Contract..." : "Issue Master Agreement & Form GST INV-1"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PLAYBOOK */}
        {/* ========================================================================= */}
        {activeTab === "playbook" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    The Godfather of Capital Acquisition: Founder Pre-Launch Playbook
                  </h2>
                  <p className="text-xs text-slate-600">
                    How the Founder monetizes OrderKing via B2B restaurant setup fees before spending ₹1 on consumer ads.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-6 text-xs text-slate-700 leading-relaxed">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    The Core Philosophy: Collect From Restaurants First
                  </h4>
                  <p>
                    Typical food delivery founders spend millions of rupees running consumer ads while restaurants sit on the platform for free.
                    <strong> OrderKing flips this completely.</strong> By framing the platform as an elite, curated private fleet with zero surge pricing,
                    we charge restaurants an immediate <strong>₹10,000 to ₹50,000 Priority Onboarding Fee</strong>.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    The Mathematics of Instant Runway:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-slate-800">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-slate-500 text-[10px]">20 Restaurants @ ₹25k</div>
                      <div className="text-base font-bold text-emerald-700">₹5,00,000 Cash</div>
                      <div className="text-[10px] text-slate-500">Immediate operations capital</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-slate-500 text-[10px]">40 Restaurants @ ₹25k</div>
                      <div className="text-base font-bold text-emerald-700">₹10,00,000 Cash</div>
                      <div className="text-[10px] text-slate-500">Covers rider fleet initial float</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-slate-500 text-[10px]">10 Flagships @ ₹50k</div>
                      <div className="text-base font-bold text-emerald-700">₹5,00,000 Cash</div>
                      <div className="text-[10px] text-slate-500">Premium cloud brand revenue</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    The In-Person Pitch Script to Restaurant Owners
                  </h4>
                  <div className="rounded-xl bg-amber-50/60 border border-amber-200 p-4 text-amber-950 space-y-2 italic font-sans text-xs">
                    <p>
                      "Zomato and Swiggy charge you 28% to 32% on every single order, and during rainy or peak hours, they turn on surge fees and starve your kitchen of delivery riders.
                    </p>
                    <p>
                      OrderKing is our city’s native hyper-dedicated delivery network. We only accept <strong>25 handpicked restaurants</strong> for our official grand launch.
                      Because we limit spots, our rider fleet is physically stationed outside your outlet with guaranteed sub-8 minute pick-up.
                    </p>
                    <p>
                      Our Priority Setup Fee is ₹25,000. In return, you get professional food photography, VIP placement on day one, and we cap your commission at just 16.5%—saving you over ₹1.5 Lakhs every single year compared to Zomato."
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                      3
                    </span>
                    Enforceability & Compliance
                  </h4>
                  <p>
                    Every agreement generated through this terminal incorporates <strong>SAC Code 998314</strong> (Information Technology & Cataloguing Services),
                    is compliant with <strong>GST INV-1 standard</strong>, and binds both parties under the Arbitration and Conciliation Act, 1996 with jurisdiction in Assam, India.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW MASTER MERCHANT SERVICE AGREEMENT (MMSA) */}
      {/* ========================================================================= */}
      {viewingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full my-8 overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Master Merchant Franchise & Integration Agreement (MMSA)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <Printer className="h-3.5 w-3.5" /> Print / PDF
                </button>
                <button
                  onClick={() => setViewingContract(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto text-xs leading-relaxed font-serif bg-white text-slate-800">
              <div className="text-center border-b border-slate-200 pb-4 space-y-1">
                <div className="text-lg font-bold tracking-tight text-slate-900 font-sans uppercase">
                  OrderKing Technologies Private Limited
                </div>
                <div className="text-[11px] text-slate-600 font-sans">
                  Corporate Identification & Hyperlocal Cloud Commerce Operations • CIN: U72900AS2026PTC019823
                </div>
                <div className="text-[10px] font-mono text-slate-500 font-sans">
                  Agreement Reference: <strong>{viewingContract.contract_number}</strong> | Date:{" "}
                  {new Date(viewingContract.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p>
                  <strong>THIS MASTER MERCHANT SERVICE AGREEMENT (the “Agreement”)</strong> is entered into as of{" "}
                  {new Date(viewingContract.created_at).toLocaleDateString("en-IN")}, by and between:
                </p>
                <p>
                  <strong>ORDERKING TECHNOLOGIES PRIVATE LIMITED</strong>, an incorporated entity having its principal office at
                  Station Road, Commercial Ward 3, Karimganj, Assam 788710 (hereinafter referred to as the <strong>“Company”</strong>,
                  which expression shall include its successors and permitted assigns);
                </p>
                <p className="text-center font-bold font-sans text-slate-500 uppercase text-[10px]">AND</p>
                <p>
                  <strong>{viewingContract.legal_entity_name.toUpperCase()}</strong>, operating under the trade name{" "}
                  <strong>"{viewingContract.restaurant_name}"</strong>, with registered address at{" "}
                  {viewingContract.registered_address}, {viewingContract.city}, {viewingContract.state}{" "}
                  {viewingContract.pincode} (hereinafter referred to as the <strong>“Merchant Partner”</strong>, represented by its authorized signatory{" "}
                  <strong>{viewingContract.signatory_name}</strong>, {viewingContract.signatory_title}).
                </p>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 font-sans uppercase text-[11px] mb-1">
                    1. Upfront Priority Setup & Licensing Fee
                  </h4>
                  <p>
                    1.1 The Merchant Partner agrees to pay an upfront, one-time, non-refundable{" "}
                    <strong>Priority Setup and Digitization Fee</strong> of{" "}
                    <strong>₹{Number(viewingContract.setup_fee_inr).toLocaleString("en-IN")}</strong> (Rupees{" "}
                    {Number(viewingContract.setup_fee_inr).toLocaleString("en-IN")} only) plus applicable Goods and Services Tax
                    (GST @ 18%), totaling <strong>₹{Number(viewingContract.total_payable_inr).toLocaleString("en-IN")}</strong>.
                  </p>
                  <p className="mt-1">
                    1.2 The Priority Setup Fee covers digital catalog creation, high-resolution food photography ingestion, dedicated KDS terminal configuration, and VIP merchant network geofence priority.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 font-sans uppercase text-[11px] mb-1">
                    2. Enforceable Deliverables & Tier Specifications
                  </h4>
                  <p className="mb-2">
                    Under the <strong>{TIER_CONFIGS[viewingContract.tier]?.name || viewingContract.tier}</strong>, the Company covenants to deliver:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    {(viewingContract.deliverables || TIER_CONFIGS[viewingContract.tier]?.deliverables || []).map(
                      (d, i) => (
                        <li key={i}>{d}</li>
                      )
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 font-sans uppercase text-[11px] mb-1">
                    3. Commercial Commission & Settlement Escrow
                  </h4>
                  <p>
                    3.1 The Company shall levy a capped platform take-rate of{" "}
                    <strong>{TIER_CONFIGS[viewingContract.tier]?.recommendedTakeRatePct || 18.0}%</strong> on net food value.
                  </p>
                  <p className="mt-1">
                    3.2 All transaction proceeds processed via KingPay or integrated payment switches shall be held in compliant nodal escrow accounts and settled automatically on an automated T+1 cycle.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 font-sans uppercase text-[11px] mb-1">
                    4. Governing Law & Dispute Resolution
                  </h4>
                  <p>
                    This Agreement shall be governed by the laws of the Republic of India. Any disputes arising hereunder shall be resolved by binding arbitration under the Arbitration and Conciliation Act, 1996, with the seat of arbitration in Karimganj, Assam.
                  </p>
                </div>
              </div>

              {/* Signature Blocks */}
              <div className="border-t-2 border-slate-300 pt-6 grid grid-cols-2 gap-8 font-sans">
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500">For OrderKing Technologies Pvt Ltd:</div>
                  <div className="font-bold text-slate-900">Umar Farooq</div>
                  <div className="text-[10px] text-slate-500">Founder & Chief Executive Officer</div>
                  <div className="font-mono text-[9px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                    STATUS: DIGITALLY SEALED (OK-EXEC-AUTHORIZED)
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500">
                    For {viewingContract.legal_entity_name}:
                  </div>
                  <div className="font-bold text-slate-900">{viewingContract.signatory_name}</div>
                  <div className="text-[10px] text-slate-500">{viewingContract.signatory_title}</div>
                  {viewingContract.contract_status === "EXECUTED" || viewingContract.terms_accepted ? (
                    <div className="font-mono text-[9px] text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                      DIGITALLY ATTESTED & SIGNED
                      <div className="text-[8px] text-slate-500 truncate mt-0.5">
                        Hash: {viewingContract.digital_signature_hash}
                      </div>
                    </div>
                  ) : (
                    <div className="font-mono text-[9px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                      STATUS: PENDING MERCHANT COUNTERSIGNATURE
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW FORM GST INV-1 TAX INVOICE */}
      {/* ========================================================================= */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full my-8 overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Form GST INV-1 Tax Invoice (Priority Setup Fee)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <Printer className="h-3.5 w-3.5" /> Print / PDF
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Invoice Layout */}
            <div className="p-8 space-y-6 text-xs font-sans bg-white text-slate-900">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">TAX INVOICE</h1>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Under Section 31 of CGST Act, 2017</p>
                  <div className="mt-3 text-xs space-y-0.5">
                    <div className="font-bold text-slate-900">OrderKing Technologies Private Limited</div>
                    <div className="text-slate-600">Station Road, Ward No. 3, Karimganj, Assam - 788710</div>
                    <div className="font-mono text-slate-600">GSTIN: 18AABCO1982K1Z9 | PAN: AABCO1982K</div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                    {viewingInvoice.payment_status === "PAID" || viewingInvoice.payment_status === "SETTLED"
                      ? "PAID & SETTLED"
                      : "PAYMENT DUE"}
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-900 mt-2">
                    Invoice #: {viewingInvoice.invoice_number}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Date: {new Date(viewingInvoice.created_at).toLocaleDateString("en-IN")}
                  </div>
                  <div className="text-[10px] text-slate-400">SAC Code: 998314</div>
                </div>
              </div>

              {/* Billed To */}
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Billed To (Merchant Partner):
                </span>
                <div className="font-bold text-slate-900 text-sm">{viewingInvoice.legal_entity_name}</div>
                <div className="text-slate-700 text-xs">Trade Brand: {viewingInvoice.restaurant_name}</div>
                <div className="text-slate-600 text-xs">{viewingInvoice.registered_address}</div>
                <div className="text-slate-600 text-xs">
                  {viewingInvoice.city}, {viewingInvoice.state} - {viewingInvoice.pincode}
                </div>
                {viewingInvoice.gstin && (
                  <div className="font-mono text-xs text-slate-700 mt-1">Merchant GSTIN: {viewingInvoice.gstin}</div>
                )}
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">SAC</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                    <th className="py-2.5 px-3 text-right">CGST (9%)</th>
                    <th className="py-2.5 px-3 text-right">SGST (9%)</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        Priority Franchise Setup & Menu Digitization Fee
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {TIER_CONFIGS[viewingInvoice.tier]?.name || viewingInvoice.tier}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">998314</td>
                    <td className="py-3 px-3 font-mono text-right font-medium">
                      ₹{Number(viewingInvoice.setup_fee_inr).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 font-mono text-right text-slate-600">
                      ₹{Math.round(Number(viewingInvoice.setup_fee_inr) * 0.09).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 font-mono text-right text-slate-600">
                      ₹{Math.round(Number(viewingInvoice.setup_fee_inr) * 0.09).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 font-mono text-right font-bold text-slate-900">
                      ₹{Number(viewingInvoice.total_payable_inr).toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Settlement Instructions & Bank Details */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Bank / UPI Escrow Settlement Rails:
                  </div>
                  <div className="text-xs font-semibold text-slate-900">OrderKing Technologies Escrow</div>
                  <div className="text-[11px] text-slate-600">Bank: HDFC Bank Limited (Commercial Branch)</div>
                  <div className="font-mono text-[11px] text-slate-800">A/C: 50200088912345 | IFSC: HDFC0001234</div>
                  <div className="font-mono text-[11px] text-emerald-800 font-semibold">UPI VPA: orderking.nodal@hdfcbank</div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1 text-right">
                  <div className="text-xs text-slate-600">Grand Total Invoiced:</div>
                  <div className="text-2xl font-black text-emerald-950 font-mono">
                    ₹{Number(viewingInvoice.total_payable_inr).toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Payment Method: {viewingInvoice.payment_method || "UPI / NEFT Direct"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD PAYMENT SETTLEMENT */}
      {/* ========================================================================= */}
      {paymentModalContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Record Setup Fee Settlement</h3>
              </div>
              <button onClick={() => setPaymentModalContract(null)} className="text-slate-400 hover:text-slate-800">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>
                Merchant: <strong>{paymentModalContract.restaurant_name}</strong>
              </div>
              <div>Invoice #: {paymentModalContract.invoice_number}</div>
              <div className="text-sm font-bold text-emerald-700">
                Amount Payable: ₹{Number(paymentModalContract.total_payable_inr).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Rail</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="UPI_DIRECT">Instant UPI Direct (VPA Sweep)</option>
                  <option value="NEFT_IMPS">Bank NEFT / IMPS Wire Transfer</option>
                  <option value="CHEQUE_CLEARANCE">Commercial Cheque Clearance</option>
                  <option value="CASH_DIRECT">Official Cash Receipt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Reference / UTR Number *
                </label>
                <input
                  type="text"
                  required
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. UTR # 428910283921 or Bank Txn Ref"
                  className="w-full font-mono rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPaymentModalContract(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleRecordPayment}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {actionLoading ? "Recording..." : "Verify & Settle Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EXECUTE DIGITAL SIGNATURE */}
      {/* ========================================================================= */}
      {signatureModalContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Attest Digital Signature</h3>
              </div>
              <button onClick={() => setSignatureModalContract(null)} className="text-slate-400 hover:text-slate-800">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>Agreement #: {signatureModalContract.contract_number}</div>
              <div>Entity: {signatureModalContract.legal_entity_name}</div>
              <div className="font-mono text-[10px] text-slate-500 break-all">
                Hash: {signatureModalContract.digital_signature_hash}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Signatory Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={signatoryNameInput}
                  onChange={(e) => setSignatoryNameInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation / Authority
                </label>
                <input
                  type="text"
                  value={signatoryTitleInput}
                  onChange={(e) => setSignatoryTitleInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-[11px] text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  Legal Attestation Declaration
                </div>
                <p>
                  By confirming, you attest that the authorized signatory has reviewed and agreed to the Master Merchant Service Agreement terms under Indian Contract Act, 1872.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSignatureModalContract(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteSignature}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {actionLoading ? "Executing..." : "Execute & Attest Agreement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
