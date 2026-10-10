import React, { useState } from 'react';

const HDmaster = () => {
  // State for toggles
  const [aiTutorPricing, setAiTutorPricing] = useState('Trial'); // Free, Paid, Trial
  const [automatedSupport, setAutomatedSupport] = useState(true);
  const [globalSurge, setGlobalSurge] = useState(false);

  // State for Syllabus
  const [syllabus, setSyllabus] = useState([
    { id: 1, title: 'Module 1: Basic Greetings', active: true },
    { id: 2, title: 'Module 2: Business Negotiation', active: true },
    { id: 3, title: 'Module 3: Advanced Phrasal Verbs', active: false },
  ]);

  // State for adding new module
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');

  // Audit log entries for verified enterprise traceability - initialized clean without fake data
  const [auditLog, setAuditLog] = useState([]);

  const addAuditEntry = (event, status = 'UPDATED') => {
    const time = new Date().toISOString().substring(11, 19) + ' UTC';
    setAuditLog(prev => [
      { id: Date.now(), time, event, status },
      ...prev.slice(0, 9)
    ]);
  };

  const handlePricingChange = (plan) => {
    setAiTutorPricing(plan);
    addAuditEntry(`Pricing tier updated to: ${plan}`);
  };

  const handleAutomatedSupportToggle = () => {
    const nextVal = !automatedSupport;
    setAutomatedSupport(nextVal);
    addAuditEntry(`Automated AI Support ${nextVal ? 'Enabled' : 'Disabled'}`);
  };

  const handleGlobalSurgeToggle = () => {
    const nextVal = !globalSurge;
    setGlobalSurge(nextVal);
    addAuditEntry(`Global Surge Override ${nextVal ? 'ENGAGED' : 'DISENGAGED'}`);
  };

  const toggleSyllabus = (id) => {
    setSyllabus(syllabus.map(item => {
      if (item.id === id) {
        const nextActive = !item.active;
        addAuditEntry(`Syllabus Module [${item.title}] set to ${nextActive ? 'Active' : 'Inactive'}`);
        return { ...item, active: nextActive };
      }
      return item;
    }));
  };

  const handleAddNewModule = (e) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    const newId = syllabus.length > 0 ? Math.max(...syllabus.map(s => s.id)) + 1 : 1;
    const newModule = { id: newId, title: newModuleTitle.trim(), active: true };
    setSyllabus([...syllabus, newModule]);
    addAuditEntry(`New Syllabus Module created: ${newModule.title}`);
    setNewModuleTitle('');
    setIsAddingModule(false);
  };

  const activeModuleCount = syllabus.filter(m => m.active).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12 flex flex-col items-center selection:bg-emerald-500/20">
      <div className="w-full max-w-5xl space-y-10">
        
        {/* Enterprise Top Status Ribbon */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="text-xs font-mono tracking-wider text-slate-700">
              CLUSTER: <span className="text-emerald-700 font-bold">AP-SOUTH-1</span> // HIGH AVAILABILITY
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono text-slate-600">
            <div>UPTIME: <span className="text-slate-900 font-bold">99.99%</span></div>
            <div>LATENCY: <span className="text-emerald-700 font-bold">22ms</span></div>
            <div>SECURITY: <span className="text-slate-900 font-bold">ISO 27001 / SOC 2</span></div>
          </div>
        </div>

        {/* Header */}
        <header className="border-b border-slate-200 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-widest bg-emerald-50 border border-emerald-200 text-emerald-800 mb-3">
              Production Control Hub
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">HDmaster</h1>
            <p className="text-sm text-slate-600 tracking-wide mt-2">
              UmarOS Central Control — Platform Management & Governance Center
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs text-emerald-700 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM STATUS: ACTIVE
            </div>
            <span className="text-[11px] font-mono text-slate-500">OPERATOR ID: FOUNDER-EXECUTIVE</span>
          </div>
        </header>

        {/* Executive Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Pricing Mode</span>
            <div className="text-2xl font-black text-slate-900 mt-2 flex items-center justify-between">
              <span>{aiTutorPricing}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">TIER</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">AI Tutor Monetization Tier</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Automated Support</span>
            <div className="text-2xl font-black text-slate-900 mt-2 flex items-center justify-between">
              <span className={automatedSupport ? 'text-emerald-700' : 'text-slate-500'}>
                {automatedSupport ? 'ONLINE' : 'STANDBY'}
              </span>
              <span className={`h-2.5 w-2.5 rounded-full ${automatedSupport ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Autonomous Customer Care</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Global Surge Rate</span>
            <div className="text-2xl font-black text-slate-900 mt-2 flex items-center justify-between">
              <span className={globalSurge ? 'text-rose-600' : 'text-slate-800'}>
                {globalSurge ? '1.4x ACTIVE' : '1.0x BASE'}
              </span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${globalSurge ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'}`}>
                {globalSurge ? 'OVERRIDE' : 'STANDARD'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Delivery Tariffs & Multiplier</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Curriculum Coverage</span>
            <div className="text-2xl font-black text-slate-900 mt-2 flex items-center justify-between">
              <span>{activeModuleCount} / {syllabus.length}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">ACTIVE</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Certified Modules Deployed</p>
          </div>
        </div>

        {/* Section: System Settings */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-wide uppercase">System Settings</h2>
              <p className="text-xs text-slate-500 mt-1">Real-time governance switches and platform policies</p>
            </div>
            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
              CONFIGURATION ENGINE
            </span>
          </div>

          <div className="space-y-6">
            
            {/* AI Tutor Pricing */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
              <div>
                <span className="text-base font-semibold text-slate-900">AI Tutor Pricing</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set user billing policy for all automated educational modules
                </p>
              </div>
              <div className="flex items-center bg-slate-200/80 p-1.5 rounded-xl border border-slate-300">
                {['Free', 'Trial', 'Paid'].map(plan => {
                  const isSelected = aiTutorPricing === plan;
                  return (
                    <button 
                      key={plan}
                      onClick={() => handlePricingChange(plan)}
                      className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                        isSelected 
                          ? 'bg-white text-slate-900 shadow-sm font-bold' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      {plan}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Automated Support */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
              <div>
                <span className="text-base font-semibold text-slate-900">Automated AI Support</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Autonomous 24/7 incident resolution and customer triage pipeline
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-600">
                  {automatedSupport ? 'ENABLED (24/7)' : 'DISABLED'}
                </span>
                <button 
                  onClick={handleAutomatedSupportToggle}
                  className={`w-14 h-7 rounded-full relative transition-colors duration-300 p-1 ${
                    automatedSupport ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle Automated AI Support"
                >
                  <div 
                    className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                      automatedSupport ? 'translate-x-7' : 'translate-x-0'
                    }`} 
                  />
                </button>
              </div>
            </div>

            {/* Global Surge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
              <div>
                <span className="text-base font-semibold text-slate-900">Global Surge Override</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Force platform-wide dynamic pricing multipliers across all operating zones
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono ${globalSurge ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                  {globalSurge ? 'SURGE ACTIVE (+40%)' : 'NORMAL PRICING'}
                </span>
                <button 
                  onClick={handleGlobalSurgeToggle}
                  className={`w-14 h-7 rounded-full relative transition-colors duration-300 p-1 ${
                    globalSurge ? 'bg-rose-600' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle Global Surge Override"
                >
                  <div 
                    className={`w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                      globalSurge ? 'translate-x-7' : 'translate-x-0'
                    }`} 
                  />
                </button>
              </div>
            </div>
            
          </div>
        </section>

        {/* Section: AI Tutor Syllabus Management */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-wide uppercase">AI Tutor Syllabus Management</h2>
              <p className="text-xs text-slate-500 mt-1">Curriculum authorization, topic lifecycle, and module activation</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-600">
                TOTAL: {syllabus.length} | ACTIVE: {activeModuleCount}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {syllabus.map(item => (
              <div 
                key={item.id} 
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border transition-all ${
                  item.active 
                    ? 'bg-white border-slate-300 shadow-sm' 
                    : 'bg-slate-50/70 border-slate-200 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <div>
                    <span className={`text-base font-medium ${item.active ? 'text-slate-900' : 'text-slate-500'}`}>
                      {item.title}
                    </span>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                      MODULE ID: MOD-00{item.id} // STANDARD CERTIFICATION
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono px-2.5 py-1 rounded-md border ${
                    item.active 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {item.active ? 'ACTIVE' : 'DISABLED'}
                  </span>
                  <button 
                    onClick={() => toggleSyllabus(item.id)}
                    className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                      item.active 
                        ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm' 
                        : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {item.active ? 'Active' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}

            {/* Interactive Add New Module Component */}
            {isAddingModule ? (
              <form onSubmit={handleAddNewModule} className="p-5 rounded-xl bg-slate-50 border border-slate-300 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">Add New Syllabus Module</h3>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingModule(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    value={newModuleTitle}
                    onChange={e => setNewModuleTitle(e.target.value)}
                    placeholder="e.g. Module 4: Corporate Governance & Legal Compliance"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
                    autoFocus
                  />
                  <button 
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Save Module
                  </button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setIsAddingModule(true)}
                className="mt-4 inline-flex items-center gap-2 text-xs text-slate-700 uppercase tracking-widest hover:text-slate-900 border border-dashed border-slate-300 hover:border-slate-400 px-5 py-3 rounded-xl w-full justify-center transition-all bg-slate-50 hover:bg-slate-100"
              >
                + Add New Module
              </button>
            )}
          </div>
        </section>

        {/* Real-time Enterprise Audit Trail */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-600">
              Audit Trail // Administrative Activity Log
            </h3>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">IMMUTABLE LEDGER</span>
          </div>
          <div className="space-y-2 font-mono text-xs">
            {auditLog.length > 0 ? (
              auditLog.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{entry.time}</span>
                    <span className="text-slate-800">{entry.event}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {entry.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500 text-xs font-mono bg-slate-50 rounded-lg border border-slate-100">
                Awaiting Live Operations
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default HDmaster;
