import { useState } from "react";
import { Settings, CreditCard, DollarSign } from "lucide-react";

export function CentralPricingSwitch() {
  const [pricingState, setPricingState] = useState({
    orderKing: 'standard',
    kingPay: 'standard',
    aiTutor: 'standard'
  });

  const pricingModels = [
    { id: 'standard', label: 'Standard' },
    { id: 'increase', label: 'Charge Increase' },
    { id: 'decrease', label: 'Charge Decrease' },
    { id: 'free', label: 'Free' },
    { id: 'trial', label: 'Trial' },
  ];

  const updatePricing = (product: string, model: string) => {
    setPricingState(prev => ({ ...prev, [product]: model }));
    // In a real application, this would make an API call to update the central configuration
  };

  const products = [
    { id: 'orderKing', name: 'OrderKing Core', description: 'Restaurant order management & delivery routing' },
    { id: 'kingPay', name: 'KingPay', description: 'Payment processing & settlements' },
    { id: 'aiTutor', name: 'AI Tutor', description: 'Intelligent support and training' },
  ];

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-sm w-full">
      <div className="p-5 border-b border-white/5 bg-slate-800/30 flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2 text-white">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          Pricing Configuration Control
        </h2>
        <span className="bg-emerald-900/30 text-emerald-400 text-xs font-medium px-2 py-1 rounded-md">
          Global Settings
        </span>
      </div>
      
      <div className="p-6">
        <p className="text-sm text-slate-400 mb-6">
          Configure the active pricing model for each core platform service.
        </p>

        <div className="grid gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-slate-800/30 rounded-xl p-5 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  {product.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{product.description}</p>
              </div>

              <div className="flex bg-slate-900 rounded-lg p-1 border border-white/10 overflow-x-auto w-full md:w-auto">
                {pricingModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => updatePricing(product.id, model.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                      pricingState[product.id as keyof typeof pricingState] === model.id
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    {model.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
