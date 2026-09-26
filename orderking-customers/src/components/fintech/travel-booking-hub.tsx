import { useState } from "react";
import { Plane, Train, Bus, Car } from "lucide-react";
import { FlightBookingEngine } from "./flight-booking-engine";
import { TrainBookingEngine } from "./train-booking-engine";
import { BusBookingEngine } from "./bus-booking-engine";
import { CabBookingEngine } from "./cab-booking-engine";

export type TravelTab = "flights" | "trains" | "buses" | "cabs";

type Props = {
  walletBalance: number;
  onDeductWallet: (amount: number, description: string) => boolean;
  defaultTab?: TravelTab;
};

export function TravelBookingHub({ walletBalance, onDeductWallet, defaultTab = "flights" }: Props) {
  const [activeTab, setActiveTab] = useState<TravelTab>(defaultTab);

  return (
    <div className="w-full flex flex-col min-h-[70vh]">
      <div className="flex gap-2 overflow-x-auto p-4 border-b border-border bg-surface hide-scrollbar">
        <button 
          onClick={() => setActiveTab("flights")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition whitespace-nowrap \${activeTab === "flights" ? "bg-primary text-white" : "bg-bg text-muted hover:text-fg"}`}
        >
          <Plane className="size-4" /> Flights
        </button>
        <button 
          onClick={() => setActiveTab("trains")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition whitespace-nowrap \${activeTab === "trains" ? "bg-primary text-white" : "bg-bg text-muted hover:text-fg"}`}
        >
          <Train className="size-4" /> Trains (IRCTC)
        </button>
        <button 
          onClick={() => setActiveTab("buses")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition whitespace-nowrap \${activeTab === "buses" ? "bg-primary text-white" : "bg-bg text-muted hover:text-fg"}`}
        >
          <Bus className="size-4" /> Buses
        </button>
        <button 
          onClick={() => setActiveTab("cabs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition whitespace-nowrap \${activeTab === "cabs" ? "bg-primary text-white" : "bg-bg text-muted hover:text-fg"}`}
        >
          <Car className="size-4" /> Cabs
        </button>
      </div>

      <div className="flex-1 w-full bg-bg">
        {activeTab === "flights" && (
          <FlightBookingEngine walletBalance={walletBalance} onDeductWallet={onDeductWallet} />
        )}
        
        {activeTab === "trains" && (
          <TrainBookingEngine walletBalance={walletBalance} onDeductWallet={onDeductWallet} />
        )}

        {activeTab === "buses" && (
          <BusBookingEngine walletBalance={walletBalance} onDeductWallet={onDeductWallet} />
        )}

        {activeTab === "cabs" && (
          <CabBookingEngine walletBalance={walletBalance} onDeductWallet={onDeductWallet} />
        )}
      </div>
    </div>
  );
}
