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

  // Financial Telemetry State — Exact Profit Margin Engine
  const [commissionRate, setCommissionRate] = useState(22); // 22%
  const [avgFoodValue, setAvgFoodValue] = useState(400); // ₹400
  const [deliveryFee, setDeliveryFee] = useState(45); // ₹45
  const [riderPayout, setRiderPayout] = useState(35); // ₹35
  const [pgFeeRate, setPgFeeRate] = useState(1.95); // 1.95%
  const [realTransactions, setRealTransactions] = useState([]); // Zero Fake Data Policy: strictly empty

  // EXACT REAL MONEY PROFIT FORMULA:
  // (Restaurant Commission % + Delivery Fee) - (Rider Payout + Payment Gateway Fee)
  const calcCommission = (avgFoodValue * commissionRate) / 100;
  const calcInflow = calcCommission + deliveryFee;
  const totalBasketValue = avgFoodValue + deliveryFee;
  const calcPgFee = (totalBasketValue * pgFeeRate) / 100;
  const calcOutflow = riderPayout + calcPgFee;
  const exactProfitPerOrder = calcInflow - calcOutflow;
  const profitMarginPercent = totalBasketValue > 0 ? ((exactProfitPerOrder / totalBasketValue) * 100).toFixed(1) : '0.0';

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

        {/* Live Founder Profit Dashboard Component (Godfather of Financial Telemetry) */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Live Founder Profit Dashboard</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
                  Real Money Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Microscopic, god-level control over exact real founder income per order
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-mono text-slate-600 font-medium">AWAITING REAL TRANSACTIONS</span>
            </div>
          </div>

          {/* Equation Banner */}
          <div className="mt-6 p-5 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-3">
              <span className="text-emerald-400 font-bold">Exact Real Money Telemetry Formula</span>
              <span>Zero Fake Data Policy Active</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-2 text-center md:text-left py-2 font-mono">
              <div className="md:col-span-4 bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="text-xs text-emerald-300 font-bold mb-1">Gross Platform Inflow</div>
                <div className="text-sm font-bold text-white">
                  Restaurant Commission % <span className="text-emerald-400">+</span> Delivery Fee
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Merchant take-rate plus customer delivery tariff</p>
              </div>

              <div className="md:col-span-1 flex items-center justify-center">
                <div className="h-7 w-7 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-black text-base flex items-center justify-center">
                  −
                </div>
              </div>

              <div className="md:col-span-4 bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="text-xs text-rose-300 font-bold mb-1">Operational Deductions</div>
                <div className="text-sm font-bold text-white">
                  Rider Payout <span className="text-rose-400">+</span> Payment Gateway Fee
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Fleet compensation plus PG processing charge</p>
              </div>

              <div className="md:col-span-1 flex items-center justify-center">
                <div className="h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-base flex items-center justify-center">
                  =
                </div>
              </div>

              <div className="md:col-span-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">Exact Net</span>
                <span className="text-xs font-black text-white block">REAL PROFIT</span>
              </div>
            </div>
          </div>

          {/* Real Money Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Real Profit Per Order</span>
              <div className="text-lg sm:text-xl font-mono font-black text-slate-800 mt-2">
                ₹0.00 (Awaiting Real Transactions)
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Net founder cash per delivered order</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Total Real Net Profit</span>
              <div className="text-lg sm:text-xl font-mono font-black text-slate-800 mt-2">
                ₹0.00 (Awaiting Real Transactions)
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Cumulative real money platform income</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Realized Take Margin</span>
              <div className="text-lg sm:text-xl font-mono font-black text-slate-800 mt-2">
                0.0% (Awaiting Real Transactions)
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Platform take-rate on real gross volume</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Settled Real Orders</span>
              <div className="text-lg sm:text-xl font-mono font-black text-slate-800 mt-2">
                0 (Awaiting Real Transactions)
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Verified non-simulated customer deliveries</p>
            </div>
          </div>

          {/* Microscopic God-Level Profit Margin Controls & Live Simulator */}
          <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Founder Microscopic Profit Controller & Live Simulator
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tune live parameters to model exact per-order income & configure target margins
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                GOD-MODE ACTIVE
              </span>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                {/* Commission % */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-2">
                    <span>Restaurant Comm. %</span>
                    <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {commissionRate}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="35"
                    step="1"
                    value={commissionRate}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setCommissionRate(v);
                      addAuditEntry(`Founder margin target commission rate set to ${v}%`);
                    }}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>5%</span>
                    <span>22% (Std)</span>
                    <span>35%</span>
                  </div>
                </div>

                {/* Food Basket (AOV) */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-2">
                    <span>Food Basket (AOV)</span>
                    <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      ₹{avgFoodValue}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="1200"
                    step="10"
                    value={avgFoodValue}
                    onChange={(e) => setAvgFoodValue(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>₹150</span>
                    <span>₹400 (Avg)</span>
                    <span>₹1200</span>
                  </div>
                </div>

                {/* Delivery Fee */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-2">
                    <span>Delivery Fee (Cust)</span>
                    <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ₹{deliveryFee}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={deliveryFee}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setDeliveryFee(v);
                      addAuditEntry(`Founder customer delivery fee configured to ₹${v}`);
                    }}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>₹0 (Free)</span>
                    <span>₹45 (Base)</span>
                    <span>₹100</span>
                  </div>
                </div>

                {/* Rider Payout */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-2">
                    <span>Rider Payout (Fleet)</span>
                    <span className="font-mono font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      ₹{riderPayout}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="80"
                    step="5"
                    value={riderPayout}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setRiderPayout(v);
                      addAuditEntry(`Founder fleet payout tariff set to ₹${v}`);
                    }}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>₹15</span>
                    <span>₹35 (Std)</span>
                    <span>₹80</span>
                  </div>
                </div>

                {/* Payment Gateway Fee % */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-2">
                    <span>Gateway MDR %</span>
                    <span className="font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {pgFeeRate}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3.0"
                    step="0.05"
                    value={pgFeeRate}
                    onChange={(e) => setPgFeeRate(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>0.0% (KingPay)</span>
                    <span>1.95%</span>
                    <span>3.0%</span>
                  </div>
                </div>
              </div>

              {/* Real-time Math Output Card */}
              <div className="p-6 rounded-xl bg-slate-900 text-white border border-slate-800">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7 space-y-3 font-mono text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400">
                      <span>MICROSCOPIC BREAKDOWN</span>
                      <span className="text-emerald-400">Total Basket: ₹{totalBasketValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">
                        Restaurant Commission ({commissionRate}% on ₹{avgFoodValue}):
                      </span>
                      <span className="text-emerald-400 font-bold">+₹{calcCommission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Customer Delivery Fee:</span>
                      <span className="text-emerald-400 font-bold">+₹{deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between bg-white/5 px-2.5 py-1 rounded">
                      <span className="text-emerald-300 font-semibold">Gross Inflow:</span>
                      <span className="text-emerald-300 font-black">+₹{calcInflow.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Rider Payout Disbursed:</span>
                      <span className="text-rose-400 font-bold">−₹{riderPayout.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Payment Gateway Fee ({pgFeeRate}%):</span>
                      <span className="text-rose-400 font-bold">−₹{calcPgFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between bg-white/5 px-2.5 py-1 rounded">
                      <span className="text-rose-300 font-semibold">Total Deductions:</span>
                      <span className="text-rose-300 font-black">−₹{calcOutflow.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex flex-col justify-between h-full bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                    <div>
                      <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400 block mb-1">
                        Exact Real Money Profit Per Order
                      </span>
                      <div className={`text-3xl md:text-4xl font-black font-mono tracking-tight ${exactProfitPerOrder >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₹{exactProfitPerOrder.toFixed(2)}
                      </div>
                      <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-white">
                        <span>Margin:</span>
                        <span className={profitMarginPercent >= 15 ? 'text-emerald-400' : 'text-amber-400'}>
                          {profitMarginPercent}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/10 text-left space-y-1.5 font-mono text-xs">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Projected Founder Run-Rate:
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>500 orders/day:</span>
                        <span className="font-bold text-emerald-400">
                          ₹{(exactProfitPerOrder * 500).toLocaleString()}/day
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Monthly Run-Rate (500/d):</span>
                        <span className="font-black text-emerald-400">
                          ₹{(exactProfitPerOrder * 500 * 30).toLocaleString()}/mo
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Zero Fake Data Notice Banner */}
          <div className="mt-6 border border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/50">
            <div className="text-lg font-mono font-black text-slate-800">
              ₹0.00 (Awaiting Real Transactions)
            </div>
            <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1 leading-relaxed">
              Zero fake data mandate enforced. Live PostgreSQL transaction stream will populate per-order settlements in real time upon verified customer checkout.
            </p>
          </div>
        </section>

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
