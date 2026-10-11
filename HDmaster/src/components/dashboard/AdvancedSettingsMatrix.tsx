import React, { useState } from 'react';
import { Save, Sliders, Palette, Box, Calculator, Zap } from 'lucide-react';

export function AdvancedSettingsMatrix() {
  const [settings, setSettings] = useState({
    primaryColor: '#E23744',
    secondaryColor: '#10B981',
    borderRadius: '8px',
    animationSpeed: '300ms',
    baseDeliveryFee: 40,
    surgeMultiplierCap: 2.5,
    riderMinimumPayout: 35,
    aiAutoRefundThreshold: 150
  });

  const handleChange = (key: string, value: string | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Integration point for UmarOS CMS payload
    alert('Authorized: Global settings successfully applied across Customer, Rider, and Partner ecosystems.');
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Advanced Settings Matrix</h1>
            <p className="text-sm text-slate-500 mt-1">Granular control over every UI, visual, and algorithmic variable in the ecosystem.</p>
          </div>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#E23744] hover:bg-red-700 text-white px-6 py-2.5 rounded-md font-semibold transition-colors"
          >
            <Save className="w-4 h-4" />
            Apply Changes Globally
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Theme & Branding */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <Palette className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-bold text-slate-900">Theme & Branding</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Primary Brand Color (Hex)</label>
                <div className="flex gap-3">
                  <input 
                    type="color" 
                    value={settings.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border border-slate-200"
                  />
                  <input 
                    type="text" 
                    value={settings.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Secondary Success Color (Hex)</label>
                <div className="flex gap-3">
                  <input 
                    type="color" 
                    value={settings.secondaryColor}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border border-slate-200"
                  />
                  <input 
                    type="text" 
                    value={settings.secondaryColor}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* UI Geometry & Motion */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <Box className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-bold text-slate-900">Geometry & Motion</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Global Border Radius (CSS Value)</label>
                <input 
                  type="text" 
                  value={settings.borderRadius}
                  onChange={(e) => handleChange('borderRadius', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-900 font-mono"
                  placeholder="e.g., 8px, 0px, 1rem"
                />
                <p className="text-xs text-slate-500 mt-1">Defines the roundness of all buttons, cards, and inputs.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Base Animation Speed (ms)</label>
                <input 
                  type="text" 
                  value={settings.animationSpeed}
                  onChange={(e) => handleChange('animationSpeed', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Financial Algorithms */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <Calculator className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-bold text-slate-900">Financial Algorithms</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Base Delivery Fee (₹)</label>
                <input 
                  type="number" 
                  value={settings.baseDeliveryFee}
                  onChange={(e) => handleChange('baseDeliveryFee', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Rain/Peak Surge Multiplier Cap (x)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={settings.surgeMultiplierCap}
                  onChange={(e) => handleChange('surgeMultiplierCap', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-900"
                />
                <p className="text-xs text-slate-500 mt-1">Maximum allowable price multiplication during high demand.</p>
              </div>
            </div>
          </div>

          {/* Ecosystem Variables */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <Zap className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-bold text-slate-900">Ecosystem Thresholds</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Rider Minimum Base Payout (₹)</label>
                <input 
                  type="number" 
                  value={settings.riderMinimumPayout}
                  onChange={(e) => handleChange('riderMinimumPayout', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">AI Auto-Refund Threshold (₹)</label>
                <input 
                  type="number" 
                  value={settings.aiAutoRefundThreshold}
                  onChange={(e) => handleChange('aiAutoRefundThreshold', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-900"
                />
                <p className="text-xs text-slate-500 mt-1">Maximum order value the AI is authorized to refund without human review.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
