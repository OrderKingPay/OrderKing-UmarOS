import { useState, useEffect } from "react";
import { Car, MapPin, Navigation, Star, Clock, UserCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/searchable-select";
import POPULAR_STATIONS from "./stations.json"; 

export type CabResult = {
  id: string;
  providerId: string;
  category: "Mini" | "Sedan" | "SUV" | "Premium";
  model: string;
  driverName: string;
  rating: number;
  etaMins: number;
  estimatedFare: number;
  pnr?: string;
};

type Props = {
  walletBalance: number;
  onDeductWallet: (amount: number, description: string) => boolean;
};

const CITY_AREAS = [
  { value: "Airport Terminal 1", label: "Airport Terminal 1" },
  { value: "Airport Terminal 2", label: "Airport Terminal 2" },
  { value: "Main Railway Station", label: "Main Railway Station" },
  { value: "City Center Mall", label: "City Center Mall" },
  { value: "Tech Park", label: "Tech Park" },
  { value: "Downtown Square", label: "Downtown Square" },
  { value: "Residential Complex Alpha", label: "Residential Complex Alpha" },
];

export function CabBookingEngine({ walletBalance, onDeductWallet }: Props) {
  const [pickup, setPickup] = useState<string>("Airport Terminal 1");
  const [drop, setDrop] = useState<string>("Tech Park");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [cabResults, setCabResults] = useState<CabResult[]>([]);
  const [selectedCab, setSelectedCab] = useState<CabResult | null>(null);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [bookingStatus, setBookingStatus] = useState<"none" | "searching" | "driver_assigned">("none");

  const handleSearch = async () => {
    if (pickup === drop) {
      toast.error("Pickup and Drop locations cannot be the same.");
      return;
    }
    setIsSearching(true);
    setCabResults([]);

    try {
      const q = new URLSearchParams({
        mode: "CAB",
        originCode: pickup,
        destinationCode: drop,
        departureDate: new Date().toISOString().split('T')[0],
        passengers: "1",
      });

      const res = await fetch(`http://localhost:3004/v1/travel/search?${q}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();

      const mappedCabs = data.map((d: any) => ({
        id: d.id,
        providerId: d.providerId,
        category: d.rawProviderData.category,
        model: d.rawProviderData.model,
        driverName: d.rawProviderData.driverName,
        rating: d.rawProviderData.rating,
        etaMins: d.rawProviderData.etaMins,
        estimatedFare: d.price.amount,
      }));

      setCabResults(mappedCabs);
    } catch (error) {
      toast.error("Failed to fetch cab options");
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookCab = async () => {
    if (!selectedCab) return;

    if (walletBalance < selectedCab.estimatedFare) {
      toast.error(`Insufficient wallet balance. Total payable is ₹${selectedCab.estimatedFare}. Please top up.`);
      return;
    }

    setIsBooking(true);
    
    try {
      const res = await fetch("http://localhost:3004/v1/travel/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultId: selectedCab.id,
          providerId: selectedCab.providerId,
          rawProviderData: {},
          passengerDetails: [{ name: "Passenger" }],
        }),
      });

      if (!res.ok) throw new Error("Booking failed");
      const data = await res.json();

      const success = onDeductWallet(selectedCab.estimatedFare, `Cab Ride: ${pickup} to ${drop}`);
      if (success) {
        setSelectedCab({ ...selectedCab, pnr: data.pnr });
        setBookingStatus("driver_assigned");
      }
    } catch (error) {
      toast.error("Failed to confirm booking with cab aggregator");
    } finally {
      setIsBooking(false);
    }
  };

  if (bookingStatus === "driver_assigned" && selectedCab) {
    return (
      <div className="mx-auto w-full max-w-md pb-24 pt-8">
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-2xl text-center flex flex-col items-center">
          <div className="size-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-4 animate-pulse">
            <Car className="size-10" />
          </div>
          <h2 className="text-2xl font-black text-fg mb-1">Driver Assigned!</h2>
          <p className="text-muted text-sm mb-6">Your {selectedCab.category} is on the way.</p>
          
          <div className="w-full bg-surface-2 border border-border rounded-xl p-4 text-left space-y-3 mb-6">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className="size-12 bg-bg rounded-full flex items-center justify-center border border-border">
                   <UserCheck className="size-6 text-primary" />
                 </div>
                 <div>
                   <h4 className="font-bold text-fg">{selectedCab.driverName}</h4>
                   <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                     <Star className="size-3" /> {selectedCab.rating}
                   </div>
                 </div>
               </div>
               <div className="text-right">
                 <div className="text-xl font-black">{selectedCab.pnr || "4582"}</div>
                 <div className="text-[10px] uppercase text-muted font-bold tracking-widest">OTP / PNR</div>
               </div>
            </div>
            <div className="border-t border-border pt-3 mt-3 flex justify-between">
              <span className="text-sm font-bold">{selectedCab.model}</span>
              <span className="text-sm font-bold bg-amber-500/20 text-amber-600 px-2 rounded">KA {Math.floor(10 + Math.random() * 90)} HG {Math.floor(1000 + Math.random() * 9000)}</span>
            </div>
          </div>
          
          <Button className="w-full" onClick={() => { setBookingStatus("none"); setSelectedCab(null); setCabResults([]); }}>
            Finish Ride
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl pb-24 pt-4 space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-fg flex items-center gap-2">
          <Car className="size-6 text-primary" />
          City Cab Rides
        </h2>
        
        <div className="space-y-4 relative">
          <div className="absolute left-[15px] top-8 bottom-8 w-0.5 bg-border z-0 hidden md:block"></div>
          
          <div className="flex flex-col md:flex-row gap-3 md:items-center relative z-10">
             <div className="size-8 bg-surface border border-border rounded-full flex items-center justify-center shrink-0 hidden md:flex">
               <div className="size-2.5 bg-emerald-500 rounded-full"></div>
             </div>
             <div className="flex-1 space-y-1 w-full">
               <label className="text-[11px] font-bold text-muted uppercase">Pickup Location:</label>
               <SearchableSelect options={CITY_AREAS} value={pickup} onChange={setPickup} placeholder="Select pickup..." />
             </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:items-center relative z-10">
             <div className="size-8 bg-surface border border-border rounded-full flex items-center justify-center shrink-0 hidden md:flex">
               <MapPin className="size-4 text-rose-500" />
             </div>
             <div className="flex-1 space-y-1 w-full">
               <label className="text-[11px] font-bold text-muted uppercase">Drop Location:</label>
               <SearchableSelect options={CITY_AREAS} value={drop} onChange={setDrop} placeholder="Select drop..." />
             </div>
          </div>
          
          <Button onClick={handleSearch} disabled={isSearching} className="w-full h-12 text-md font-bold mt-4 shadow-lg shadow-primary/20">
             {isSearching ? "Finding nearby cabs..." : "Search Cabs"}
          </Button>
        </div>
      </div>

      {cabResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-sm font-bold text-muted uppercase tracking-wider px-2">Available Rides</h3>
          {cabResults.map((cab) => (
            <div 
              key={cab.id} 
              onClick={() => setSelectedCab(cab)}
              className={`rounded-2xl border p-4 flex justify-between items-center cursor-pointer transition-all ${selectedCab?.id === cab.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-surface hover:border-primary/40'}`}
            >
              <div className="flex items-center gap-4">
                <div className="size-12 bg-surface-2 rounded-xl border border-border flex items-center justify-center text-primary">
                  <Car className="size-6" />
                </div>
                <div>
                  <h4 className="font-bold text-fg flex items-center gap-2">
                    {cab.category} 
                    <span className="text-[10px] bg-bg border border-border px-1.5 py-0.5 rounded text-muted flex items-center gap-1">
                      <UserCheck className="size-3" /> {cab.etaMins} mins
                    </span>
                  </h4>
                  <p className="text-xs text-muted mt-0.5">{cab.model}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-fg">₹{cab.estimatedFare}</div>
              </div>
            </div>
          ))}
          
          {selectedCab && (
            <div className="pt-4 animate-in slide-in-from-bottom-4">
              <Button onClick={handleBookCab} disabled={isBooking} className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/30 rounded-xl">
                 {isBooking ? "Confirming..." : `Book ${selectedCab.category} for ₹${selectedCab.estimatedFare}`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
