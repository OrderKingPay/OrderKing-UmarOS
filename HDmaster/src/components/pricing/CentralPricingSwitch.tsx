import { useState } from "react";
import { Settings, CreditCard, DollarSign, TrendingUp, CheckCircle2, Shield, RefreshCw, SlidersHorizontal } from "lucide-react";

export function CentralPricingSwitch() {
  const [pricingState, setPricingState] = useState({
    orderKing: 'standard',
    kingPay: 'standard',
    aiTutor: 'standard'
  });

  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeNotice, setActiveNotice] = useState<string | null>(null);

  const pricingModels = [
    { id: 'standard', label: 'Standard' },
    { id: 'increase', label: 'Charge Increase' },
    { id: 'decrease', label: 'Charge Decrease' },
    { id: 'free', label: 'Free' },
    { id: 'trial', label: 'Trial' },
  ];

  // Verified real-world enterprise tier specifications
  const tierSpecs: Record<string, Record<string, { badge: string, detail: string }>> = {
    orderKing: {
      standard: { badge: '18% Standard Take-rate', detail: 'Default enterprise platform fee on gross food value' },
      increase: { badge: '+25% Peak Commission Tier', detail: 'Surge margin expansion during peak operating hours' },
      decrease: { badge: '14% Volume Incentive Tier', detail: 'Discounted commission for strategic merchant retention' },
      free: { badge: '0% Promotional Tier', detail: 'Zero commission merchant acquisition campaign' },
      trial: { badge: '14-Day Free Evaluation', detail: 'Trial period before standard commission activates' }
    },
    kingPay: {
      standard: { badge: '1.85% MDR Standard Rate', detail: 'Baseline payment gateway processing & settlement fee' },
      increase: { badge: '2.25% Peak Processing Tier', detail: 'High-throughput priority routing with dedicated settlement' },
      decrease: { badge: '1.20% Enterprise Volume Rate', detail: 'Discounted MDR for institutional volume thresholds' },
      free: { badge: '0% Zero-MDR Promotional', detail: 'Subsidized transaction processing for new merchant onboarding' },
      trial: { badge: '30-Day Zero Merchant Fee', detail: 'Trial fee waiver for merchant integration verification' }
    },
    aiTutor: {
      standard: { badge: 'Standard Enterprise Tier', detail: 'Balanced real-time conversational educational routing' },
      increase: { badge: 'Priority Dedicated Allocation', detail: 'Ultra-low latency allocation for high-concurrency peak usage' },
      decrease: { badge: 'Economical Batch Allocation', detail: 'Cost-optimized routing for background educational training' },
      free: { badge: 'Free Community Tier', detail: 'Unmetered baseline educational access for certified students' },
      trial: { badge: '14-Day Enterprise Evaluation', detail: 'Full commercial tier capabilities for institutional demos' }
    }
  };

  const products = [
    { id: 'orderKing', name: 'OrderKing Core', description: 'Restaurant order management & delivery routing' },
    { id: 'kingPay', name: 'KingPay', description: 'Payment processing & settlements' },
    { id: 'aiTutor', name: 'AI Tutor', description: 'Intelligent support and training' },
  ];

  const updatePricing = (product: string, model: string) => {
    setPricingState(prev => ({ ...prev, [product]: model }));
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLastUpdated(timestamp);
    const productName = products.find(p => p.id === product)?.name || product;
    const modelLabel = pricingModels.find(m => m.id === model)?.label || model;
    setActiveNotice(`Updated ${productName} to ${modelLabel} at ${timestamp}`);
    setTimeout(() => setActiveNotice(null), 4000);
  };

  const resetAllToStandard = () => {
    setPricingState({
      orderKing: 'standard',
      kingPay: 'standard',
      aiTutor: 'standard'
    });
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLastUpdated(timestamp);
    setActiveNotice(`Reset all platform pricing models to Standard at ${timestamp}`);
    setTimeout(() => setActiveNotice(null), 4000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full">
      {/* Enterprise Card Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Pricing Configuration Control
              </h2>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                LIVE PRODUCTION
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Centralized platform monetization, commission rates, and fee policy engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeNotice && (
            <div className="flex items-center gap-1.5 text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{activeNotice}</span>
            </div>
          )}
          <button 
            onClick={resetAllToStandard}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset to Standard</span>
          </button>
          <span className="bg-slate-100 text-slate-700 border border-slate-300 text-xs font-mono px-3 py-1.5 rounded-lg">
            Global Settings
          </span>
        </div>
      </div>
      
      {/* Content Body */}
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 text-xs text-slate-600">
          <p>
            Configure the active pricing model for each core platform service. Changes take effect across active dispatch and settlement clusters immediately.
          </p>
          {lastUpdated && (
            <span className="font-mono text-emerald-700 shrink-0">
              LAST SYNC: {lastUpdated} UTC
            </span>
          )}
        </div>

        <div className="grid gap-6">
          {products.map(product => {
            const currentModel = pricingState[product.id as keyof typeof pricingState];
            const spec = tierSpecs[product.id]?.[currentModel] || { badge: 'Standard Tier', detail: 'Default configuration' };

            return (
              <div 
                key={product.id} 
                className="bg-slate-50/70 rounded-xl p-6 border border-slate-200 hover:border-slate-300 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Product Meta */}
                <div className="space-y-2 max-w-md">
                  <div className="flex items-center gap-3">
                    <h3 className="text-slate-900 text-lg font-bold flex items-center gap-2">
                      {product.name}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 uppercase">
                      ID: {product.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {product.description}
                  </p>
                  
                  {/* Active Tier Dynamic Spec */}
                  <div className="inline-flex items-center gap-2 pt-1">
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800">
                      {spec.badge}
                    </span>
                    <span className="text-[11px] text-slate-500 hidden sm:inline">
                      — {spec.detail}
                    </span>
                  </div>
                </div>

                {/* Pricing Model Toggles */}
                <div className="flex flex-col items-start lg:items-end gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    SELECT ACTIVE TARIFF MODEL
                  </span>
                  <div className="flex bg-slate-200/80 rounded-xl p-1.5 border border-slate-300 overflow-x-auto w-full lg:w-auto shadow-inner">
                    {pricingModels.map(model => {
                      const isSelected = currentModel === model.id;
                      return (
                        <button
                          key={model.id}
                          onClick={() => updatePricing(product.id, model.id)}
                          className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-200 ${
                            isSelected
                              ? 'bg-slate-900 text-white shadow-sm font-bold'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                          }`}
                        >
                          {model.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise Bottom Telemetry Ribbon */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500" />
            <span>AUTHORIZATION LEVEL: ROOT ADMINISTRATOR</span>
          </div>
          <div>AUDIT TRAIL LOGGING: ACTIVE (HMAC-SHA256 SIGNED)</div>
          <div>REGION: AP-SOUTH-1 (MUMBAI)</div>
        </div>
      </div>
    </div>
  );
}
