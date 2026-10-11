import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Key, RefreshCw, AlertCircle } from 'lucide-react';

interface GatewayConfig {
  id: string;
  name: string;
  description: string;
  keyLabel: string;
}

const gateways: GatewayConfig[] = [
  {
    id: 'setu_upi',
    name: 'Setu UPI / NPCI Switch',
    description: 'Required to process BharatQR scans and collect payments',
    keyLabel: 'Setu API Key'
  },
  {
    id: 'razorpayx',
    name: 'RazorpayX / Cashfree Payouts',
    description: 'Required for P2P transfers to phone numbers and vendors',
    keyLabel: 'Payouts API Key'
  },
  {
    id: 'bbps',
    name: 'BBPS (Bharat Bill Payment System)',
    description: 'Required to clear utility/rent bills and recurring payments',
    keyLabel: 'BBPS Auth Key'
  }
];

export const FintechGatewayConnectors = () => {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, 'missing' | 'saving' | 'connected'>>({
    setu_upi: 'missing',
    razorpayx: 'missing',
    bbps: 'missing'
  });

  const handleKeyChange = (id: string, value: string) => {
    setKeys(prev => ({ ...prev, [id]: value }));
  };

  const toggleVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConnect = (id: string) => {
    if (!keys[id]) return;
    setStatus(prev => ({ ...prev, [id]: 'saving' }));
    
    // Simulate API connection
    setTimeout(() => {
      setStatus(prev => ({ ...prev, [id]: 'connected' }));
    }, 1500);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Production API Gateway Connectors</h2>
            <p className="text-sm text-slate-500">Configure licensed banking keys for real money movement</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {gateways.map(gateway => (
          <div key={gateway.id} className="p-6 flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex-1">
              <h3 className="text-base font-medium text-slate-800 flex items-center">
                {gateway.name}
                {status[gateway.id] === 'connected' && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Connected</span>
                )}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{gateway.description}</p>
            </div>
            
            <div className="flex-1 max-w-md">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                {gateway.keyLabel}
              </label>
              
              <div className="flex space-x-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showKeys[gateway.id] ? "text" : "password"}
                    value={keys[gateway.id] || ''}
                    onChange={(e) => handleKeyChange(gateway.id, e.target.value)}
                    placeholder={status[gateway.id] === 'connected' ? "••••••••••••••••" : "Enter production key..."}
                    className="block w-full pl-10 pr-10 py-2 sm:text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 border outline-none"
                    disabled={status[gateway.id] === 'connected'}
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility(gateway.id)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={status[gateway.id] === 'connected'}
                  >
                    {showKeys[gateway.id] ? (
                      <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
                
                {status[gateway.id] === 'missing' && (
                  <button
                    onClick={() => handleConnect(gateway.id)}
                    disabled={!keys[gateway.id]}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Connect
                  </button>
                )}
                
                {status[gateway.id] === 'saving' && (
                  <button
                    disabled
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 opacity-75 cursor-wait"
                  >
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Verifying
                  </button>
                )}
                
                {status[gateway.id] === 'connected' && (
                  <button
                    onClick={() => {
                      setStatus(prev => ({ ...prev, [gateway.id]: 'missing' }));
                      setKeys(prev => ({ ...prev, [gateway.id]: '' }));
                    }}
                    className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Disconnect
                  </button>
                )}
              </div>
              
              {status[gateway.id] === 'missing' && (
                <div className="mt-2 flex items-center text-xs text-amber-600">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  <span>AWAITING PRODUCTION KEYS</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
