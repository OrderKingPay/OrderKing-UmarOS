import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Save, Server, Sparkles, Languages, Settings2, Percent, Loader2, CheckCircle2, ShieldCheck, ArrowLeft, FileText, Cpu } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { EcosystemCMS } from '@/components/dashboard/EcosystemCMS';
import { PluginConnectors } from '@/components/dashboard/PluginConnectors';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('cms');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    fetch('/api/v1/admin/settings')
      .then(res => res.json())
      .then(data => {
        setConfig(data || {});
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load settings', err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (updates: Record<string, any>) => {
    setSaving(true);
    try {
      await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      setConfig(prev => ({ ...prev, ...updates }));
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 3000);
    } catch (e) {
      console.error('Failed to save', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mb-2" />
        <span className="font-mono text-xs uppercase tracking-widest">Loading Platform Settings...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
              <Settings2 className="h-9 w-9 text-emerald-400" />
              Platform Settings
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Global Platform Governance: Ecosystem CMS copy, integration switchboards, core applications, and fee structures.
            </p>
          </div>
          {savedStatus && (
            <div className="flex items-center gap-2 bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-4 py-2 rounded-xl font-bold font-mono text-xs">
              <CheckCircle2 className="h-4 w-4" /> Saved Successfully
            </div>
          )}
        </header>

        <div className="flex flex-col md:flex-row gap-6">
          <nav className="w-full md:w-64 flex flex-col gap-2 shrink-0">
            <TabButton id="cms" current={activeTab} set={setActiveTab} icon={FileText} label="Ecosystem CMS" />
            <TabButton id="connectors" current={activeTab} set={setActiveTab} icon={Cpu} label="Plugin Connectors" />
            <TabButton id="features" current={activeTab} set={setActiveTab} icon={Server} label="Feature Flags" />
            <TabButton id="fees" current={activeTab} set={setActiveTab} icon={Percent} label="Fees & Commissions" />
            <TabButton id="ai" current={activeTab} set={setActiveTab} icon={Sparkles} label="AI & Models" />
            <TabButton id="localization" current={activeTab} set={setActiveTab} icon={Languages} label="Localization" />
          </nav>

          <main className="flex-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 md:p-8">
            {activeTab === 'cms' && <EcosystemCMS />}
            {activeTab === 'connectors' && <PluginConnectors />}
            {activeTab === 'features' && <FeatureFlagsPanel config={config} onSave={handleSave} saving={saving} />}
            {activeTab === 'fees' && <FeesPanel config={config} onSave={handleSave} saving={saving} />}
            {activeTab === 'ai' && <AIPanel config={config} onSave={handleSave} saving={saving} />}
            {activeTab === 'localization' && <LocalizationPanel config={config} onSave={handleSave} saving={saving} />}
          </main>
        </div>
      </div>
    </div>
  );
}

function TabButton({ id, current, set, icon: Icon, label }: any) {
  const isActive = current === id;
  return (
    <button
      onClick={() => set(id)}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-semibold transition-all ${
        isActive 
          ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 shadow-md' 
          : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border border-transparent'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}

function FeatureFlagsPanel({ config, onSave, saving }: any) {
  const [flags, setFlags] = useState({
    viral_referrals_enabled: config.viral_referrals_enabled ?? true,
    dynamic_surge_enabled: config.dynamic_surge_enabled ?? true,
  });

  const toggle = (key: keyof typeof flags) => setFlags(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold text-white">Global Feature Flags</h2>
        <p className="text-xs text-slate-400 mt-1">Manage system-wide capability activation across all client applications.</p>
      </div>
      <ToggleRow 
        title="Viral WhatsApp Referrals" 
        description="Enable the multi-sided referral system for customers, riders, and restaurants." 
        isOn={flags.viral_referrals_enabled} 
        onToggle={() => toggle('viral_referrals_enabled')} 
      />
      <ToggleRow 
        title="Dynamic Surge Pricing" 
        description="Automatically increase delivery fees during peak hours or bad weather." 
        isOn={flags.dynamic_surge_enabled} 
        onToggle={() => toggle('dynamic_surge_enabled')} 
      />
      <SaveButton onClick={() => onSave(flags)} saving={saving} />
    </div>
  );
}

function FeesPanel({ config, onSave, saving }: any) {
  const [fees, setFees] = useState({
    restaurant_commission_pct: config.restaurant_commission_pct ?? 18,
    platform_fee_inr: config.platform_fee_inr ?? 4.00,
    base_delivery_fee_inr: config.base_delivery_fee_inr ?? 35.00,
    rider_payout_per_km_inr: config.rider_payout_per_km_inr ?? 8.00,
  });

  const update = (key: keyof typeof fees, val: string) => setFees(prev => ({ ...prev, [key]: Number(val) }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold text-white">Commission & Fee Engine</h2>
        <p className="text-xs text-slate-400 mt-1">Configure real-time financial tariffs, take rates, and delivery logistics compensation.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputRow title="Restaurant Commission (%)" value={fees.restaurant_commission_pct} onChange={(v: string) => update('restaurant_commission_pct', v)} />
        <InputRow title="Platform Fee (₹)" value={fees.platform_fee_inr} onChange={(v: string) => update('platform_fee_inr', v)} />
        <InputRow title="Base Delivery Fee (₹)" value={fees.base_delivery_fee_inr} onChange={(v: string) => update('base_delivery_fee_inr', v)} />
        <InputRow title="Rider Payout per KM (₹)" value={fees.rider_payout_per_km_inr} onChange={(v: string) => update('rider_payout_per_km_inr', v)} />
      </div>
      <SaveButton onClick={() => onSave(fees)} saving={saving} />
    </div>
  );
}

function AIPanel({ config, onSave, saving }: any) {
  const [aiRoutes, setAiRoutes] = useState({
    ai_support_provider: config.ai_support_provider ?? 'Google Gemini (1.5 Pro)',
    ai_menu_suggester: config.ai_menu_suggester ?? 'OpenAI (GPT-4o)',
    ai_tutor_provider: config.ai_tutor_provider ?? 'Google Gemini (1.5 Flash)',
  });

  const update = (key: keyof typeof aiRoutes, val: string) => setAiRoutes(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold text-white">AI Model Routing</h2>
        <p className="text-xs text-slate-400 mt-1">Multi-provider model routing for automated customer care and cognitive features.</p>
      </div>
      <p className="text-xs text-slate-500">
        Note: API Keys must be configured securely on the server via Cloudflare Secrets. If a key is missing, the provider will be automatically skipped.
      </p>
      
      <div className="space-y-4">
        <SelectRow title="Customer Support Chat" options={['OpenAI (GPT-4o)', 'Google Gemini (1.5 Pro)', 'Off']} value={aiRoutes.ai_support_provider} onChange={(v: string) => update('ai_support_provider', v)} />
        <SelectRow title="Mind-Reader (Menu Suggestions)" options={['OpenAI (GPT-4o)', 'Google Gemini (1.5 Flash)', 'Off']} value={aiRoutes.ai_menu_suggester} onChange={(v: string) => update('ai_menu_suggester', v)} />
        <SelectRow title="AI Tutor Mode" options={['OpenAI (GPT-4o)', 'Google Gemini (1.5 Flash)', 'Off']} value={aiRoutes.ai_tutor_provider} onChange={(v: string) => update('ai_tutor_provider', v)} />
      </div>

      <SaveButton onClick={() => onSave(aiRoutes)} saving={saving} />
    </div>
  );
}

function LocalizationPanel({ config, onSave, saving }: any) {
  const [localeConfig, setLocaleConfig] = useState({
    default_language: config.default_language ?? 'en',
    auto_detect_location: config.auto_detect_location ?? true,
    supported_locales: config.supported_locales ?? 'en,hi,kn,te,ta',
  });

  const update = (key: keyof typeof localeConfig, val: any) => setLocaleConfig(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold text-white">Localization & Regional Settings</h2>
        <p className="text-xs text-slate-400 mt-1">Regional language support and multi-lingual prompt translation preferences.</p>
      </div>
      <div className="space-y-4">
        <SelectRow 
          title="Default System Language" 
          options={['English (en)', 'Hindi (hi)', 'Kannada (kn)', 'Telugu (te)', 'Tamil (ta)']} 
          value={localeConfig.default_language === 'en' ? 'English (en)' : localeConfig.default_language} 
          onChange={(v: string) => update('default_language', v.includes('Hindi') ? 'hi' : v.includes('Kannada') ? 'kn' : v.includes('Telugu') ? 'te' : v.includes('Tamil') ? 'ta' : 'en')} 
        />
        <ToggleRow 
          title="Automatic Geo-Location Detection" 
          description="Detect user regional dialect and locale based on IP and GPS coordinates." 
          isOn={localeConfig.auto_detect_location} 
          onToggle={() => update('auto_detect_location', !localeConfig.auto_detect_location)} 
        />
      </div>
      <SaveButton onClick={() => onSave(localeConfig)} saving={saving} />
    </div>
  );
}

function ToggleRow({ title, description, isOn, onToggle }: any) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5">
      <div>
        <h3 className="font-semibold text-white text-sm">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <button 
        onClick={onToggle} 
        className={`w-14 h-7 rounded-full transition-colors relative p-1 ${
          isOn ? 'bg-emerald-500' : 'bg-slate-800 border border-white/10'
        }`}
        aria-label={`Toggle ${title}`}
      >
        <div className={`w-5 h-5 bg-slate-950 rounded-full transition-transform ${
          isOn ? 'translate-x-7' : 'translate-x-0'
        }`} />
      </button>
    </div>
  );
}

function InputRow({ title, value, onChange }: any) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">{title}</label>
      <input 
        type="number" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono transition-colors" 
      />
    </div>
  );
}

function SelectRow({ title, options, value, onChange }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-white/5">
      <h3 className="font-semibold text-white text-sm">{title}</h3>
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="border border-white/10 rounded-xl px-3.5 py-2 bg-slate-950 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
      >
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SaveButton({ onClick, saving }: any) {
  return (
    <button 
      onClick={onClick} 
      disabled={saving} 
      className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 transition-all shadow-md shadow-emerald-950/40"
    >
      {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>} 
      {saving ? 'Saving...' : 'Save Configuration'}
    </button>
  );
}
