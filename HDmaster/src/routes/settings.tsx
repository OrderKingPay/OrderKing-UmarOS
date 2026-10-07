import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Save, Server, Sparkles, Languages, Settings2, Percent, Loader2, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('features');
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
    return <div className="p-6 flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-slate-50">
      <header className="mb-8 border-b pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Settings2 className="h-8 w-8 text-emerald-600" />
            Platform Settings
          </h1>
          <p className="text-slate-500 mt-2">Maximum Founder Control: Configure all apps, fees, and AI features in real-time.</p>
        </div>
        {savedStatus && (
          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-bold">
            <CheckCircle2 className="h-5 w-5" /> Saved Successfully
          </div>
        )}
      </header>

      <div className="flex flex-col md:flex-row gap-6">
        <nav className="w-full md:w-64 flex flex-col gap-2">
          <TabButton id="features" current={activeTab} set={setActiveTab} icon={Server} label="Feature Flags" />
          <TabButton id="fees" current={activeTab} set={setActiveTab} icon={Percent} label="Fees & Commissions" />
          <TabButton id="ai" current={activeTab} set={setActiveTab} icon={Sparkles} label="AI & Models" />
          <TabButton id="localization" current={activeTab} set={setActiveTab} icon={Languages} label="Localization" />
        </nav>

        <main className="flex-1 bg-slate-900/50 backdrop-blur-md border-white/5 rounded-xl shadow-sm border border-white/10 p-6">
          {activeTab === 'features' && <FeatureFlagsPanel config={config} onSave={handleSave} saving={saving} />}
          {activeTab === 'fees' && <FeesPanel config={config} onSave={handleSave} saving={saving} />}
          {activeTab === 'ai' && <AIPanel config={config} onSave={handleSave} saving={saving} />}
        </main>
      </div>
    </div>
  );
}

function TabButton({ id, current, set, icon: Icon, label }: any) {
  const isActive = current === id;
  return (
    <button
      onClick={() => set(id)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left font-semibold transition-all ${
        isActive ? 'bg-emerald-50 text-emerald-400 border border-emerald-200' : 'text-slate-300 hover:bg-white/10 text-white'
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function FeatureFlagsPanel({ config, onSave, saving }: any) {
  const [flags, setFlags] = useState({
    daily_hub_enabled: config.daily_hub_enabled ?? false,
    viral_referrals_enabled: config.viral_referrals_enabled ?? true,
    dynamic_surge_enabled: config.dynamic_surge_enabled ?? true,
  });

  const toggle = (key: keyof typeof flags) => setFlags(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold border-b pb-2">Global Feature Flags</h2>
      <ToggleRow title="Customer Daily Hub" description="Show the Daily Hub (Gig jobs, Govt schemes) on the customer home page." isOn={flags.daily_hub_enabled} onToggle={() => toggle('daily_hub_enabled')} />
      <ToggleRow title="Viral WhatsApp Referrals" description="Enable the multi-sided referral system for customers, riders, and restaurants." isOn={flags.viral_referrals_enabled} onToggle={() => toggle('viral_referrals_enabled')} />
      <ToggleRow title="Dynamic Surge Pricing" description="Automatically increase delivery fees during peak hours or bad weather." isOn={flags.dynamic_surge_enabled} onToggle={() => toggle('dynamic_surge_enabled')} />
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
      <h2 className="text-xl font-bold border-b pb-2">Commission & Fee Engine</h2>
      <div className="grid grid-cols-2 gap-4">
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
      <h2 className="text-xl font-bold border-b pb-2">AI Model Routing</h2>
      <p className="text-sm text-slate-500 mb-4">Note: API Keys must be configured securely on the server via Cloudflare Secrets. If a key is missing, the provider will be automatically skipped.</p>
      
      <SelectRow title="Customer Support Chat" options={['OpenAI (GPT-4o)', 'Google Gemini (1.5 Pro)', 'Off']} value={aiRoutes.ai_support_provider} onChange={(v: string) => update('ai_support_provider', v)} />
      <SelectRow title="Mind-Reader (Menu Suggestions)" options={['OpenAI (GPT-4o)', 'Google Gemini (1.5 Flash)', 'Off']} value={aiRoutes.ai_menu_suggester} onChange={(v: string) => update('ai_menu_suggester', v)} />
      <SelectRow title="AI Tutor Mode" options={['OpenAI (GPT-4o)', 'Google Gemini (1.5 Flash)', 'Off']} value={aiRoutes.ai_tutor_provider} onChange={(v: string) => update('ai_tutor_provider', v)} />

      <SaveButton onClick={() => onSave(aiRoutes)} saving={saving} />
    </div>
  );
}

function ToggleRow({ title, description, isOn, onToggle }: any) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <h3 className="font-bold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <button onClick={onToggle} className={`w-12 h-6 rounded-full transition-colors relative ${isOn ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <div className={`w-4 h-4 bg-slate-900/50 backdrop-blur-md border-white/5 rounded-full absolute top-1 transition-transform ${isOn ? 'left-7' : 'left-1'}`}></div>
      </button>
    </div>
  );
}

function InputRow({ title, value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-300 mb-1">{title}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
    </div>
  );
}

function SelectRow({ title, options, value, onChange }: any) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100">
      <h3 className="font-bold text-slate-800">{title}</h3>
      <select value={value} onChange={e => onChange(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 bg-slate-50">
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SaveButton({ onClick, saving }: any) {
  return (
    <button onClick={onClick} disabled={saving} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50">
      {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>} 
      {saving ? 'Saving...' : 'Save Config'}
    </button>
  );
}
