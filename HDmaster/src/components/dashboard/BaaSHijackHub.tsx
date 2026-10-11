import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button"; // Or appropriate button component path
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Zap, Server, Activity } from 'lucide-react';

export function BaaSHijackHub() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [vpaHandle, setVpaHandle] = useState('@kingpay');
  const [isActive, setIsActive] = useState(false);

  const handleActivate = () => {
    setIsActive(true);
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
    </div>
  );
}
