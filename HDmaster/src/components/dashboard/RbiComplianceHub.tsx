import React, { useState } from 'react';
import GigWorkerComplianceCenter from './GigWorkerComplianceCenter';
import { ShieldCheck, Building2, Scale } from 'lucide-react';

const RbiComplianceHub = () => {
  const [hubTab, setHubTab] = useState<'gig_worker' | 'rbi_fintech'>('gig_worker');

  const applications = [
    { id: 1, name: 'TPAP License', status: 'Pending' },
    { id: 2, name: 'Nodal Account Escrow', status: 'In Progress' },
    { id: 3, name: 'BBPS Agent Institution', status: 'Not Started' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Selector for Statutory Hubs */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">UmarOS Statutory &amp; Regulatory Compliance Center</h2>
            <p className="text-xs text-slate-500">
              Indian Code on Social Security 2020 gig worker agreements &amp; RBI escrow governance
            </p>
          </div>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setHubTab('gig_worker')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition ${
              hubTab === 'gig_worker'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-1.5 justify-center">
              <Scale className="size-3.5" />
              <span>Gig Worker Welfare (CSS 2020)</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setHubTab('rbi_fintech')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition ${
              hubTab === 'rbi_fintech'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-1.5 justify-center">
              <Building2 className="size-3.5" />
              <span>RBI FinTech &amp; Escrow</span>
            </span>
          </button>
        </div>
      </div>

      {/* View: Gig Worker Compliance */}
      {hubTab === 'gig_worker' && <GigWorkerComplianceCenter />}

      {/* View: RBI FinTech Escrow Hub (100% preservation of existing functionality) */}
      {hubTab === 'rbi_fintech' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-2xl font-bold mb-4">RBI Compliance Hub</h2>
          <p className="mb-4 text-gray-600">Legal Shield &amp; Compliance Tracker</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        app.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        app.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RbiComplianceHub;
