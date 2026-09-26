import { useState } from "react";
import { Bus, Clock, MapPin, CheckCircle2, ShieldCheck, Star, Users, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/searchable-select";
import POPULAR_STATIONS from "./stations.json"; // We will reuse the major city codes from stations/airports

export type BusResult = {
  id: string;
  providerId: string;
  operator: string;
  busType: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  baseFare: number;
  seatsAvailable: number;
  rating: number;
  amenities: string[];
};

type Props = {
  walletBalance: number;
  onDeductWallet: (amount: number, description: string) => boolean;
};

// Map station names to distinct cities for buses
const MAJOR_CITIES = POPULAR_STATIONS.slice(0, 80).map(s => ({
  value: s.city,
  label: `${s.city} - Major Bus Terminals`
}));

export function BusBookingEngine({ walletBalance, onDeductWallet }: Props) {
  const [originCity, setOriginCity] = useState<string>("New Delhi");
  const [destinationCity, setDestinationCity] = useState<string>("Jaipur");
  const [departureDate, setDepartureDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]!
  );
  const [passengers, setPassengers] = useState<number>(1);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [busResults, setBusResults] = useState<BusResult[]>([]);
  const [selectedBus, setSelectedBus] = useState<BusResult | null>(null);
  const [isBooking, setIsBooking] = useState<boolean>(false);

  const handleSearch = async () => {
    if (originCity === destinationCity) {
      toast.error("Origin and destination cities cannot be the same.");
      return;
    }
    setIsSearching(true);
    setBusResults([]);

    try {
      const q = new URLSearchParams({
        mode: "BUS",
        originCode: originCity,
        destinationCode: destinationCity,
        departureDate,
        passengers: String(passengers),
      });

      const res = await fetch(`http://localhost:3004/v1/travel/search?${q}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();

      const mappedBuses = data.map((d: any) => ({
        id: d.id,
        providerId: d.providerId,
        operator: d.carrier.name,
        busType: d.rawProviderData.busType,
        departureCity: d.origin.name,
        arrivalCity: d.destination.name,
        departureTime: d.departureTime,
        arrivalTime: d.arrivalTime,
        duration: d.rawProviderData.duration,
        baseFare: d.price.amount,
        seatsAvailable: d.rawProviderData.seatsAvailable,
        rating: d.rawProviderData.rating,
        amenities: d.rawProviderData.amenities,
      }));

      setBusResults(mappedBuses);
      toast.success(`🚌 Found ${mappedBuses.length} buses matching your route!`);
    } catch (error) {
      toast.error("Failed to fetch bus routes from providers");
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookBus = async () => {
    if (!selectedBus) return;

    let totalAmount = selectedBus.baseFare * passengers;
    if (walletBalance < totalAmount) {
      toast.error(
        `Insufficient wallet balance. Total payable is ₹${totalAmount}. Please top up.`
      );
      return;
    }

    setIsBooking(true);
    try {
      const res = await fetch("http://localhost:3004/v1/travel/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultId: selectedBus.id,
          providerId: selectedBus.providerId,
          rawProviderData: {},
          passengerDetails: Array(passengers).fill({ name: "Passenger", age: 30 }),
        }),
      });

      if (!res.ok) throw new Error("Booking failed");
      const data = await res.json();

      const success = onDeductWallet(totalAmount, `Bus Booking: ${originCity} to ${destinationCity} (${selectedBus.operator})`);
      if (success) {
        toast.success(`Successfully booked bus ticket! PNR: ${data.pnr}`);
        setSelectedBus(null);
      }
    } catch (error) {
       toast.error("Failed to confirm booking with bus operator");
    } finally {
       setIsBooking(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl pb-24 space-y-6 pt-4">
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-fg flex items-center gap-2">
          <Bus className="size-6 text-primary" />
          Intercity Bus Booking
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase">From City:</label>
            <SearchableSelect
              options={MAJOR_CITIES}
              value={originCity}
              onChange={setOriginCity}
              placeholder="Search origin city..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase">To City:</label>
            <SearchableSelect
              options={MAJOR_CITIES}
              value={destinationCity}
              onChange={setDestinationCity}
              placeholder="Search destination city..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted uppercase">Date:</label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-bold text-fg focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="w-24 space-y-1">
              <label className="text-[11px] font-bold text-muted uppercase">Seats:</label>
              <select
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-bold text-fg focus:border-primary"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="flex-1 bg-primary text-white font-bold h-10 rounded-xl"
            >
              {isSearching ? "..." : "Search"}
            </Button>
          </div>
        </div>
      </div>

      {busResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold">Top Recommended Buses</h3>
          {busResults.map((bus) => (
            <div key={bus.id} className="rounded-2xl border border-border bg-surface p-4 flex flex-col md:flex-row gap-4 justify-between items-center hover:border-primary/50 transition">
              <div className="flex-1 w-full space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-fg">{bus.operator}</h4>
                    <p className="text-xs text-muted">{bus.busType}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-xs font-bold">
                    <Star className="size-3" /> {bus.rating}
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                   <div className="text-center">
                     <div className="font-mono text-lg font-bold">{bus.departureTime}</div>
                     <div className="text-xs text-muted">{bus.departureCity}</div>
                   </div>
                   <div className="flex-1 flex flex-col items-center px-4">
                     <div className="text-[10px] text-muted">{bus.duration}</div>
                     <div className="w-full h-px bg-border relative my-1">
                       <Navigation className="size-3 text-muted absolute -top-1.5 left-1/2 -translate-x-1/2 rotate-90" />
                     </div>
                   </div>
                   <div className="text-center">
                     <div className="font-mono text-lg font-bold">{bus.arrivalTime}</div>
                     <div className="text-xs text-muted">{bus.arrivalCity}</div>
                   </div>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {bus.amenities.map(amenity => (
                    <span key={amenity} className="text-[9px] uppercase border border-border rounded px-1.5 py-0.5 text-muted">{amenity}</span>
                  ))}
                  <span className="text-[9px] uppercase border border-primary/30 bg-primary/5 text-primary font-bold rounded px-1.5 py-0.5">{bus.seatsAvailable} Seats Left</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-4 min-w-[120px] text-center md:text-right w-full md:w-auto">
                 <div className="text-2xl font-black text-fg">₹{bus.baseFare}</div>
                 <Button onClick={() => setSelectedBus(bus)} className="w-full bg-primary text-white">Select Seats</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-surface border border-border shadow-2xl p-6 flex flex-col items-center text-center">
             <Bus className="size-10 text-primary mb-2" />
             <h3 className="font-bold text-lg">Confirm Bus Booking</h3>
             <p className="text-sm text-muted mb-4">{selectedBus.operator} • {originCity} to {destinationCity}</p>
             <div className="w-full bg-surface-2 p-4 rounded-xl space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Fare ({passengers}x)</span>
                  <span className="font-bold">₹{selectedBus.baseFare * passengers}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                  <span className="font-bold">Total Payable</span>
                  <span className="font-black text-primary text-lg">₹{selectedBus.baseFare * passengers}</span>
                </div>
             </div>
             <div className="flex w-full gap-2">
               <Button variant="outline" className="flex-1" onClick={() => setSelectedBus(null)}>Cancel</Button>
               <Button className="flex-1" onClick={handleBookBus} disabled={isBooking}>
                 {isBooking ? "Processing..." : "Pay Securely"}
               </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
