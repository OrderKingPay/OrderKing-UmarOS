import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button"; // Or appropriate button component path
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Zap, Server, Activity, ArrowUp, ArrowDown, Network } from 'lucide-react';

export function BaaSHijackHub() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [vpaHandle, setVpaHandle] = useState('@kingpay');
  const [isActive, setIsActive] = useState(false);

  // Auto-Failover Matrix State
  const [failoverEnabled, setFailoverEnabled] = useState(true);
  const [providers, setProviders] = useState([
    { id: '1', name: 'Decentro', status: 'Active' },
    { id: '2', name: 'Setu', status: 'Standby' },
    { id: '3', name: 'RazorpayX', status: 'Standby' },
  ]);

  const handleActivate = () => {
    setIsActive(true);
  };

  const moveProvider = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newProviders = [...providers];
      [newProviders[index - 1], newProviders[index]] = [newProviders[index], newProviders[index - 1]];
      setProviders(newProviders);
    } else if (direction === 'down' && index < providers.length - 1) {
      const newProviders = [...providers];
      [newProviders[index + 1], newProviders[index]] = [newProviders[index], newProviders[index + 1]];
      setProviders(newProviders);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Zap className="h-8 w-8 text-yellow-400" />
            White-Label Banking Integration
          </h1>
          <p className="text-slate-400 mt-2">BaaS Interface to hijack existing banking licenses for instant KingPay rollout.</p>
        </div>
        <Badge variant={isActive ? "default" : "destructive"} className="text-lg py-1 px-4">
          {isActive ? "SYSTEM ACTIVE" : "SYSTEM OFFLINE"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription className="text-slate-400">Targeting Decentro / Setu APIs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Decentro / Setu Client ID</label>
              <Input 
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter Client ID"
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">BaaS Client Secret</label>
              <Input 
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Enter Client Secret"
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Custom VPA Handle (e.g., @kingpay)</label>
              <Input 
                value={vpaHandle}
                onChange={(e) => setVpaHandle(e.target.value)}
                placeholder="e.g., @kingpay"
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
            <Button 
              onClick={handleActivate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
            >
              INITIALIZE BANKING ENGINE
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              User VPA Generation Engine
            </CardTitle>
            <CardDescription className="text-slate-400">Real-time status dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-400" />
                Operational Logic
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                When active, every KingPay user gets an instant, legal UPI ID powered by the third-party bank. 
                The system automatically provisions virtual accounts and links them to the user's wallet profile, 
                enabling seamless P2P and merchant transactions under the {vpaHandle || '@kingpay'} handle.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Connection Status:</span>
                <span className={isActive ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                  {isActive ? "Connected to BaaS Provider" : "Disconnected"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Virtual Accounts Provisioned:</span>
                <span className="text-white font-mono">{isActive ? "14,239" : "0"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Transactions / Sec:</span>
                <span className="text-white font-mono">{isActive ? "284" : "0"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AUTO-FAILOVER MATRIX SECTION */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Network className="h-5 w-5 text-blue-400" />
                Auto-Failover Matrix
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Multi-Bank API routing to guarantee zero downtime.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 bg-slate-950 p-2 rounded border border-slate-800">
              <input 
                type="checkbox"
                id="failover-toggle"
                checked={failoverEnabled}
                onChange={(e) => setFailoverEnabled(e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-blue-600"
              />
              <label htmlFor="failover-toggle" className="text-sm font-medium text-slate-300 cursor-pointer">
                Enable Failover
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`p-4 mb-6 rounded-lg border ${failoverEnabled ? 'bg-blue-950/30 border-blue-900/50 text-blue-200' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
            <p className="text-sm font-medium leading-relaxed">
              If Primary Provider API fails or drops below 99% uptime, KingPay will automatically route P2P transactions to the Secondary Provider.
            </p>
          </div>
          
          <div className="space-y-3">
            {providers.map((provider, index) => (
              <div key={provider.id} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => moveProvider(index, 'up')}
                      disabled={index === 0}
                      className="text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => moveProvider(index, 'down')}
                      disabled={index === providers.length - 1}
                      className="text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 mb-1">Rank {index + 1}</div>
                    <div className="text-lg font-medium text-white">{provider.name}</div>
                  </div>
                </div>
                <div>
                  <Badge variant={index === 0 ? "default" : "outline"} className={index === 0 ? "bg-green-600 hover:bg-green-700" : "text-slate-400 border-slate-700"}>
                    {index === 0 ? "PRIMARY (ACTIVE)" : `STANDBY (RANK ${index + 1})`}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

