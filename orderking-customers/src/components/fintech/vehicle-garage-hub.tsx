
import { Car, FileText, Shield, AlertTriangle, ArrowRight, Zap, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VehicleGarageHubProps {
  walletBalance: number;
  onDeductWallet: (amount: number, description: string) => boolean;
  onOpenScanner: () => void;
}

export function VehicleGarageHub({ walletBalance, onDeductWallet, onOpenScanner }: VehicleGarageHubProps) {
  const handleFastag = () => window.open("https://paytm.com/fastag-recharge?utm_source=orderking_affiliate", "_blank");
  const handleInsurance = () => window.open("https://www.policybazaar.com/motor-insurance/?utm_source=orderking_affiliate", "_blank");
  const handleChallan = () => window.open("https://echallan.parivahan.gov.in/index/accused-challan", "_blank");
  const handlePuc = () => window.open("https://vahan.parivahan.gov.in/puc/", "_blank");

  return (
    <div className="space-y-6 text-white p-4 md:p-6">
      <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-surface to-bg p-6 sm:p-10 text-center shadow-xl">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-500 mb-6">
          <Car className="size-10" />
        </div>
        
        <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-xs font-black text-red-500 ring-1 ring-red-500/40 mb-4">
          <AlertTriangle className="size-4 animate-pulse" />
          <span>MoRTH Radar Active</span>
        </div>
        
        <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight mb-4">
          Vehicle Garage & RTO
        </h2>
        
        <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto mb-8">
          Manage your vehicles effortlessly. Check traffic e-challans, get 0-paperwork insurance renewals, track PUC expiry, and recharge FASTag instantly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <Button 
            onClick={handleFastag}
            className="w-full text-base py-6 rounded-2xl shadow-sm bg-white/5 hover:bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-2 border-transparent hover:border-indigo-500/30 text-white justify-start"
          >
            <Zap className="mr-3 size-5 text-yellow-500" />
            <div className="flex flex-col items-start">
              <span className="font-bold">FASTag Recharge</span>
              <span className="text-xs text-zinc-400 font-normal">All Banks Supported</span>
            </div>
          </Button>

          <Button 
            onClick={handleInsurance}
            className="w-full text-base py-6 rounded-2xl shadow-sm bg-white/5 hover:bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-2 border-transparent hover:border-indigo-500/30 text-white justify-start"
          >
            <Shield className="mr-3 size-5 text-emerald-500" />
            <div className="flex flex-col items-start">
              <span className="font-bold">Renew Insurance</span>
              <span className="text-xs text-zinc-400 font-normal">0-Paperwork Policy</span>
            </div>
          </Button>

          <Button 
            onClick={handleChallan}
            className="w-full text-base py-6 rounded-2xl shadow-sm bg-white/5 hover:bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-2 border-transparent hover:border-indigo-500/30 text-white justify-start"
          >
            <FileText className="mr-3 size-5 text-red-400" />
            <div className="flex flex-col items-start">
              <span className="font-bold">Pay E-Challans</span>
              <span className="text-xs text-zinc-400 font-normal">Traffic Police Fines</span>
            </div>
          </Button>

          <Button 
            onClick={handlePuc}
            className="w-full text-base py-6 rounded-2xl shadow-sm bg-white/5 hover:bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-2 border-transparent hover:border-indigo-500/30 text-white justify-start"
          >
            <Navigation className="mr-3 size-5 text-blue-400" />
            <div className="flex flex-col items-start">
              <span className="font-bold">Check PUC Status</span>
              <span className="text-xs text-zinc-400 font-normal">Pollution Control Info</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
