import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Save, Server, Sparkles, Languages, Settings2, Percent } from 'lucide-react';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('features');

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-slate-50">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
          <Settings2 className="h-8 w-8 text-emerald-600" />
          Platform Settings
        </h1>
        <p className="text-slate-500 mt-2">Maximum Founder Control: Configure all apps, fees, and AI features in real-time.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-6">
        <nav className="w-full md:w-64 flex flex-col gap-2">
          <TabButton id="features" current={activeTab} set={setActiveTab} icon={Server} label="Feature Flags" />
          <TabButton id="fees" current={activeTab} set={setActiveTab} icon={Percent} label="Fees & Commissions" />
          <TabButton id="ai" current={activeTab} set={setActiveTab} icon={Sparkles} label="AI & Models" />
          <TabButton id="localization" current={activeTab} set={setActiveTab} icon={Languages} label="Localization" />
        </nav>

        <main className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {activeTab === 'features' && <FeatureFlagsPanel />}
          {activeTab === 'fees' && <FeesPanel />}
          {activeTab === 'ai' && <AIPanel />}
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
        isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function FeatureFlagsPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold border-b pb-2">Global Feature Flags</h2>
      <ToggleRow title="Customer Daily Hub" description="Show the Daily Hub (Gig jobs, Govt schemes) on the customer home page." defaultOn={false} />
      <ToggleRow title="Viral WhatsApp Referrals" description="Enable the multi-sided referral system for customers, riders, and restaurants." defaultOn={true} />
      <ToggleRow title="Dynamic Surge Pricing" description="Automatically increase delivery fees during peak hours or bad weather." defaultOn={true} />
      <button className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"><Save className="h-4 w-4"/> Save Changes</button>
    </div>
  );
}

function FeesPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold border-b pb-2">Commission & Fee Engine</h2>
      <div className="grid grid-cols-2 gap-4">
        <InputRow title="Restaurant Commission (%)" defaultValue="18" />
        <InputRow title="Platform Fee (₹)" defaultValue="4.00" />
        <InputRow title="Base Delivery Fee (₹)" defaultValue="35.00" />
        <InputRow title="Rider Payout per KM (₹)" defaultValue="8.00" />
      </div>
      <button className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"><Save className="h-4 w-4"/> Save Config</button>
    </div>
  );
}

function AIPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold border-b pb-2">AI Model Routing</h2>
      <p className="text-sm text-slate-500 mb-4">Note: API Keys must be configured securely on the server via Cloudflare Secrets. If a key is missing, the provider will be automatically skipped.</p>
      
      <SelectRow title="Customer Support Chat" options={['OpenAI (GPT-4o)', 'Google Gemini (1.5 Pro)', 'Off']} defaultVal="Google Gemini (1.5 Pro)" />
      <SelectRow title="Mind-Reader (Menu Suggestions)" options={['OpenAI (GPT-4o)', 'Google Gemini (1.5 Flash)', 'Off']} defaultVal="OpenAI (GPT-4o)" />
      <SelectRow title="AI Tutor Mode" options={['OpenAI (GPT-4o)', 'Google Gemini (1.5 Flash)', 'Off']} defaultVal="Google Gemini (1.5 Flash)" />

      <button className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"><Save className="h-4 w-4"/> Save AI Config</button>
    </div>
  );
}

function ToggleRow({ title, description, defaultOn }: any) {
  const [isOn, setIsOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <h3 className="font-bold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <button onClick={() => setIsOn(!isOn)} className={`w-12 h-6 rounded-full transition-colors relative ${isOn ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isOn ? 'left-7' : 'left-1'}`}></div>
      </button>
    </div>
  );
}

function InputRow({ title, defaultValue }: any) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">{title}</label>
      <input type="number" defaultValue={defaultValue} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
    </div>
  );
}

function SelectRow({ title, options, defaultVal }: any) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100">
      <h3 className="font-bold text-slate-800">{title}</h3>
      <select defaultValue={defaultVal} className="border border-slate-300 rounded-lg px-3 py-2 bg-slate-50">
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
