import React, { useState } from 'react';
import {
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  HeartPulse,
  Scale,
  Users,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Search,
  Lock,
  Bike,
  Sparkles,
  RefreshCw,
  Building2,
  FileText
} from 'lucide-react';
import {
  OFFICIAL_RIDER_SECTIONS,
  DigitalContractEngine,
  ContractResult
} from '@/lib/orderking/compliance/onboarding-contracts';

const contractEngine = new DigitalContractEngine();

export const GigWorkerComplianceCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'agreement_viewer'>('overview');
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number>(1); // Section 2 by default
  const [copiedText, setCopiedText] = useState(false);
  const [contractsList, setContractsList] = useState<ContractResult[]>([
    {
      contractId: 'OK-RIDER-AGMT-RIDER-78801-17290001',
      entityId: 'RIDER-78801',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      documentType: 'INDEPENDENT_CONTRACTOR_AGREEMENT',
      status: 'SIGNED',
      umarOsApprovalStatus: 'APPROVED',
      contentSummary: 'OrderKing Delivery Partner Agreement · CSS 2020 Compliant · Motorcycle Fleet',
      welfareFundRate: '1.5% allocated to Central Social Security Fund',
      accidentalInsuranceCover: 'INR 10,00,000 Death & Disability',
      hospitalizationCover: 'INR 1,00,000 Hospitalization'
    },
    {
      contractId: 'OK-RIDER-AGMT-RIDER-78802-17290002',
      entityId: 'RIDER-78802',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      documentType: 'INDEPENDENT_CONTRACTOR_AGREEMENT',
      status: 'SIGNED',
      umarOsApprovalStatus: 'PENDING',
      contentSummary: 'OrderKing Delivery Partner Agreement · CSS 2020 Compliant · Low-Speed EV (CMVR 2(u) Exempt)',
      welfareFundRate: '1.5% allocated to Central Social Security Fund',
      accidentalInsuranceCover: 'INR 10,00,000 Death & Disability',
      hospitalizationCover: 'INR 1,00,000 Hospitalization'
    },
    {
      contractId: 'OK-RIDER-AGMT-RIDER-78803-17290003',
      entityId: 'RIDER-78803',
      timestamp: new Date().toISOString(),
      documentType: 'INDEPENDENT_CONTRACTOR_AGREEMENT',
      status: 'PENDING_SIGNATURE',
      umarOsApprovalStatus: 'PENDING',
      contentSummary: 'OrderKing Delivery Partner Agreement · CSS 2020 Compliant · Bicycle Fleet',
      welfareFundRate: '1.5% allocated to Central Social Security Fund',
      accidentalInsuranceCover: 'INR 10,00,000 Death & Disability',
      hospitalizationCover: 'INR 1,00,000 Hospitalization'
    }
  ]);

  const handleApproveContract = (contractId: string) => {
    setContractsList(prev =>
      prev.map(c => {
        if (c.contractId === contractId) {
          const approved = contractEngine.finalizeOnboardingViaUmarOS({
            ...c,
            status: 'SIGNED'
          });
          return approved;
        }
        return c;
      })
    );
  };

  const handleSimulateNewRiderContract = () => {
    const randomId = `RIDER-${Math.floor(10000 + Math.random() * 90000)}`;
    const newContract = contractEngine.generateRiderAgreement(
      randomId,
      'XXXX-XXXX-4821',
      'ABCDE1234F'
    );
    // Simulate immediate partner signature via OTP
    const signed = contractEngine.signContract(newContract);
    setContractsList(prev => [signed, ...prev]);
  };

  const selectedSection = OFFICIAL_RIDER_SECTIONS[selectedSectionIndex];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
            <Scale className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Code on Social Security, 2020
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                UmarOS Compliance Center
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              Indian Delivery Partner Legal &amp; Welfare Compliance Hub
            </h2>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Statutory Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contracts')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'contracts'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Agreements Registry ({contractsList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('agreement_viewer')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'agreement_viewer'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            13-Section Contract Inspector
          </button>
        </div>
      </div>

      {/* TAB 1: STATUTORY OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Compliance Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Contractor Status</span>
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-base font-extrabold text-slate-900">Principal-to-Principal</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Chapter IX, Code on Social Security 2020. 100% schedule autonomy, non-exclusive multi-app freedom, and zero employee benefit liabilities.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Welfare Fund Contribution</span>
                <Building2 className="size-4 text-emerald-700" />
              </div>
              <p className="text-base font-extrabold text-emerald-950">1.5% Platform Turnover</p>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                Section 114, CSS 2020. OrderKing automatically allocates statutory aggregator cess into National Social Security Fund. Zero rider deduction.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">Group Accidental Insurance</span>
                <HeartPulse className="size-4 text-blue-700" />
              </div>
              <p className="text-base font-extrabold text-blue-950">₹10 Lakh Death / ₹1 Lakh Hosp.</p>
              <p className="text-[11px] text-blue-900 leading-relaxed">
                Zero premium cost to partner. Active duty coverage for death, permanent disability, and emergency in-patient hospitalization.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900">Dispute Resolution</span>
                <Scale className="size-4 text-purple-700" />
              </div>
              <p className="text-base font-extrabold text-purple-950">2-Tier Arbitration</p>
              <p className="text-[11px] text-purple-900 leading-relaxed">
                Tier-1 internal Grievance Officer conciliation (15 days), followed by binding Sole Arbitrator under Arbitration and Conciliation Act, 1996.
              </p>
            </div>
          </div>

          {/* Autonomous Compliance Safeguards */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-700" />
              <span>Automated Statutory Verification Safeguards in Delivery Fleet</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">UIDAI Aadhaar Masking</span>
                <p className="text-slate-600">
                  Strict redaction of initial 8 digits under Section 8A of Aadhaar Act. Only last 4 digits stored.
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">CMVR Rule 2(u) Exemption</span>
                <p className="text-slate-600">
                  Pedal bicycles and sub-25 km/h low-speed EVs are legally registered without DL/RC blockades.
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">FSSAI Thermal Bag Hygiene</span>
                <p className="text-slate-600">
                  Tamper-evident seal verification and sanitized insulated delivery bag SOP with hot/cold segregation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTRACTS REGISTRY */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Executed Independent Delivery Partner Agreements
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every delivery partner is legally bound under the Code on Social Security, 2020 via digital assent.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSimulateNewRiderContract}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <Sparkles className="size-3.5" />
              <span>Generate Sample Partner Agreement</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Contract Reference</th>
                  <th className="px-4 py-3">Partner Entity</th>
                  <th className="px-4 py-3">Statutory Framework</th>
                  <th className="px-4 py-3">Digital Assent</th>
                  <th className="px-4 py-3">UmarOS Legal Approval</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {contractsList.map((contract) => (
                  <tr key={contract.contractId} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      {contract.contractId}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {contract.entityId}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                        Code on Social Security, 2020
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          contract.status === 'SIGNED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {contract.status === 'SIGNED' ? (
                          <>
                            <CheckCircle2 className="size-3" />
                            <span>Signed (OTP)</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="size-3" />
                            <span>Pending Sign</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          contract.umarOsApprovalStatus === 'APPROVED'
                            ? 'bg-slate-900 text-white'
                            : 'bg-amber-50 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {contract.umarOsApprovalStatus === 'APPROVED'
                          ? 'Approved by UmarOS'
                          : 'Pending Audit Review'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {contract.umarOsApprovalStatus !== 'APPROVED' ? (
                        <button
                          type="button"
                          onClick={() => handleApproveContract(contract.contractId)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold transition text-[11px]"
                        >
                          Approve via UmarOS
                        </button>
                      ) : (
                        <span className="text-slate-400 font-semibold text-[11px]">
                          Audited &amp; Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: 13-SECTION CONTRACT INSPECTOR */}
      {activeTab === 'agreement_viewer' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Official OrderKing Delivery Partner Agreement (13 Statutory Sections)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Structured in accordance with Indian gig worker standards under the Code on Social Security, 2020.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const fullText = OFFICIAL_RIDER_SECTIONS.map(
                    s => `Section ${s.sectionNumber}: ${s.title}\n${s.fullLegalText}`
                  ).join('\n\n---\n\n');
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    void navigator.clipboard.writeText(fullText);
                    setCopiedText(true);
                    setTimeout(() => setCopiedText(false), 2500);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                {copiedText ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    <span>Copied 13 Sections</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 text-slate-500" />
                    <span>Copy Complete Agreement Text</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
            {/* Left Section List Navigation */}
            <div className="lg:col-span-4 space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {OFFICIAL_RIDER_SECTIONS.map((sec, idx) => (
                <button
                  key={sec.sectionNumber}
                  type="button"
                  onClick={() => setSelectedSectionIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    selectedSectionIndex === idx
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        selectedSectionIndex === idx ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      Section {sec.sectionNumber}
                    </span>
                    <ChevronRight
                      className={`size-3.5 ${
                        selectedSectionIndex === idx ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                  </div>
                  <p className="font-bold text-xs mt-0.5 truncate">{sec.title}</p>
                  <p
                    className={`text-[11px] mt-1 line-clamp-1 ${
                      selectedSectionIndex === idx ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {sec.summary}
                  </p>
                </button>
              ))}
            </div>

            {/* Right Section Details */}
            <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedSection.statutoryBasis}
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-1.5">
                  Section {selectedSection.sectionNumber}: {selectedSection.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1">{selectedSection.summary}</p>
              </div>

              {/* Full Legal Text */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 max-h-[260px] overflow-y-auto font-mono text-[11px] text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedSection.fullLegalText}
              </div>

              {/* Operational Highlights */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Key Legal Highlights:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedSection.keyHighlights.map((hl, i) => (
                    <li
                      key={i}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-start gap-2"
                    >
                      <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <span className="text-slate-700">{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GigWorkerComplianceCenter;
