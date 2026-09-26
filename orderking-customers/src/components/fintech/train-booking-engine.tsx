import { useState } from "react";
import { Train, ChevronDown, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import POPULAR_STATIONS from "./stations.json";

export type TrainResult = {
  id: string;
  trainName: string;
  trainNumber: string;
  departureStation: string;
  arrivalStation: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  baseFare: number;
  classes: string[];
};

type Props = {
  walletBalance: number;
  onDeductWallet: (amount: number, description: string) => boolean;
};

function SearchableStationCombobox({ value, onChange, label, placeholder }: { value: string, onChange: (v: string) => void, label: string, placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const selectedStation = POPULAR_STATIONS.find(a => a.code === value);
  const filtered = search.trim().length > 0 
    ? POPULAR_STATIONS.filter(a => 
        a.name.toLowerCase().includes(search.toLowerCase()) || 
        a.city.toLowerCase().includes(search.toLowerCase()) || 
        a.code.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 40)
    : POPULAR_STATIONS.slice(0, 40);

  return (
    <div className="space-y-1 relative z-50">
      <label className="text-[11px] font-bold text-muted uppercase">{label}</label>
      <div 
        className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-bold text-fg cursor-pointer flex justify-between items-center focus-within:border-primary"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedStation ? `${selectedStation.city} (${selectedStation.code}) - ${selectedStation.name}` : placeholder}</span>
        <ChevronDown className="size-4 opacity-50 shrink-0" />
      </div>
      
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full rounded-xl border border-border bg-bg shadow-2xl overflow-hidden flex flex-col max-h-64 shadow-black/40">
          <div className="p-2 border-b border-border">
             <input 
               type="text"
               autoFocus
               placeholder="Search city, station name, or code..."
               className="w-full rounded-lg bg-surface-2 px-3 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
          <div className="overflow-y-auto flex-1 p-1">
             {filtered.map(a => (
               <div 
                 key={a.code}
                 className="px-3 py-2.5 text-sm hover:bg-surface-2 cursor-pointer rounded-lg truncate flex items-center gap-2"
                 onClick={() => { onChange(a.code); setIsOpen(false); setSearch(""); }}
               >
                 <span className="font-bold shrink-0">{a.city}</span> 
                 <span className="shrink-0 text-xs text-primary font-bold bg-primary/10 px-1 rounded">({a.code})</span>
                 <span className="text-muted text-xs truncate">{a.name}</span>
               </div>
             ))}
             {filtered.length === 0 && <div className="p-4 text-center text-xs text-muted">No stations found</div>}
          </div>
        </div>
      )}
      
      {isOpen && <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />}
    </div>
  );
}

export function TrainBookingEngine({ walletBalance, onDeductWallet }: Props) {
  const [originStation, setOriginStation] = useState<string>("NDLS");
  const [destinationStation, setDestinationStation] = useState<string>("CSMT");
  const [departureDate, setDepartureDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]!
  );
  const [passengers, setPassengers] = useState<number>(1);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [trainResults, setTrainResults] = useState<TrainResult[]>([]);

  // Modals
  const [selectedTrain, setSelectedTrain] = useState<TrainResult | null>(null);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [passengerName, setPassengerName] = useState<string>("");
  const [passengerAge, setPassengerAge] = useState<string>("");
  const [passengerGender, setPassengerGender] = useState<"Male" | "Female" | "Other">("Male");

  const [confirmedTicket, setConfirmedTicket] = useState<{
    pnr: string;
    train: TrainResult;
    passenger: string;
    totalPaid: number;
  } | null>(null);

  const handleSearch = async () => {
    if (originStation === destinationStation) {
      toast.error("Origin and destination stations cannot be the same.");
      return;
    }
    setIsSearching(true);
    setTrainResults([]);

    try {
      const params = new URLSearchParams({
        mode: "TRAIN",
        originCode: originStation,
        destinationCode: destinationStation,
        departureDate,
        passengers: String(passengers),
      });
      const baseUrl = import.meta.env.VITE_HDMASTER_URL || "https://hdmaster.vercel.app";
      const res = await fetch(`${baseUrl}/api/v1/travel/search?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json() as {
        results?: Array<{
          id: string;
          providerId: string;
          origin: { code: string };
          destination: { code: string };
          departureTime: string;
          arrivalTime: string;
          carrier: { code: string; name: string };
          price: { amount: number };
          rawProviderData: unknown;
        }>;
        errors?: Array<{ error?: string; blocked?: boolean; details?: string }>;
      };

      if (!res.ok) throw new Error(data.errors?.[0]?.details || "Train search failed");
      if (!data.results?.length) {
        const blocked = data.errors?.find((e) => e.blocked);
        throw new Error(
          blocked?.details ||
          "No live train availability was returned. No simulated trains are shown.",
        );
      }

      setTrainResults(data.results.map((r) => ({
        id: r.id,
        trainName: r.carrier.name,
        trainNumber: r.carrier.code,
        departureStation: r.origin.code,
        arrivalStation: r.destination.code,
        departureTime: new Date(r.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        arrivalTime: new Date(r.arrivalTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        duration: "See provider itinerary",
        baseFare: r.price.amount,
        classes: [],
      })));
      toast.success(`Found ${data.results.length} live train offers.`);
    } catch (err) {
      setTrainResults([]);
      toast.error(err instanceof Error ? err.message : "Live train search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookTrain = async () => {
    if (!selectedTrain) return;
    toast.error("This train result does not yet expose a licensed booking payload. No wallet deduction or fake confirmation will occur.");
  };

  return (
    <div className="mx-auto w-full max-w-4xl pb-24">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-black p-1 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="relative rounded-[1.4rem] bg-gradient-to-b from-indigo-950/40 to-black/60 p-4 sm:p-6 lg:p-8 backdrop-blur-md border border-white/10">
          
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="space-y-3 relative z-10 w-full">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                LIVE TRAIN SEARCH · LICENSED PROVIDER REQUIRED
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                <Train className="size-8 sm:size-10 text-indigo-400" strokeWidth={2.5} />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                  Train Booking
                </span>
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Search Console */}
      <div className="relative -mt-6 sm:-mt-8 z-20 px-3 sm:px-6">
        <div className="rounded-2xl border border-border bg-surface shadow-2xl p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <SearchableStationCombobox 
              label="From Station:"
              placeholder="Select Origin Station"
              value={originStation}
              onChange={setOriginStation}
            />

            <SearchableStationCombobox 
              label="To Station:"
              placeholder="Select Destination Station"
              value={destinationStation}
              onChange={setDestinationStation}
            />

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted uppercase">Departure Date:</label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-bold text-fg focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted uppercase">Passengers:</label>
              <select
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-bold text-fg focus:border-primary focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} Traveler{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-primary/25"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? "Checking live provider..." : "Search Live Trains"}
          </Button>
        </div>
      </div>

      {/* Train Results */}
      {trainResults.length > 0 && (
        <div className="mt-8 px-2 space-y-4">
          <h3 className="font-display text-lg font-bold">Live Train Results</h3>
          
          <div className="space-y-4">
            {trainResults.map((train) => (
              <div key={train.id} className="rounded-2xl border border-border bg-surface p-4 flex flex-col md:flex-row gap-4 justify-between items-center hover:border-indigo-500/50 transition-colors">
                <div className="flex-1 w-full space-y-3">
                   <div className="flex justify-between items-center border-b border-border pb-3">
                     <div className="font-bold text-indigo-400">{train.trainName} ({train.trainNumber})</div>
                     <div className="text-xs bg-bg px-2 py-1 rounded font-bold text-muted border border-border">
                       {train.duration}
                     </div>
                   </div>
                   <div className="flex justify-between items-center text-sm font-bold">
                     <div className="text-center w-1/3">
                       <div className="text-lg text-fg">{train.departureTime}</div>
                       <div className="text-muted text-xs">{train.departureStation}</div>
                     </div>
                     <div className="text-center flex-1 relative flex items-center justify-center text-muted">
                        <div className="h-px bg-border absolute w-full z-0"></div>
                        <Train className="size-4 z-10 bg-surface px-1 shrink-0" />
                     </div>
                     <div className="text-center w-1/3">
                       <div className="text-lg text-fg">{train.arrivalTime}</div>
                       <div className="text-muted text-xs">{train.arrivalStation}</div>
                     </div>
                   </div>
                   <div className="flex gap-2">
                     {train.classes.map(c => (
                       <span key={c} className="text-[10px] font-bold border border-border rounded px-1.5 py-0.5 text-muted">{c}</span>
                     ))}
                   </div>
                </div>

                <div className="flex flex-col gap-2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-4 min-w-[140px] text-center md:text-right w-full md:w-auto">
                   <div className="text-2xl font-black text-fg">
                      ₹{train.baseFare}
                   </div>
                   <Button onClick={() => setSelectedTrain(train)}>
                      Book Now
                   </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {selectedTrain && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 sm:zoom-in-95">
             <div className="p-4 border-b border-border flex justify-between items-center bg-surface-2">
               <h3 className="font-bold text-lg">Passenger Details</h3>
               <button onClick={() => setSelectedTrain(null)} className="p-1 hover:bg-bg rounded-full">
                 <X className="size-5" />
               </button>
             </div>
             
             <div className="p-5 overflow-y-auto space-y-4">
                <div className="bg-bg rounded-xl p-3 border border-border text-sm flex justify-between font-bold">
                   <span>{selectedTrain.departureStation} → {selectedTrain.arrivalStation}</span>
                   <span>{selectedTrain.trainName}</span>
                </div>
                
                <div className="space-y-3">
                   <div>
                     <label className="text-xs font-bold text-muted uppercase">Full Name</label>
                     <input type="text" value={passengerName} onChange={e => setPassengerName(e.target.value)} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm mt-1 focus:border-primary focus:outline-none" />
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="text-xs font-bold text-muted uppercase">Age</label>
                       <input type="number" value={passengerAge} onChange={e => setPassengerAge(e.target.value)} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm mt-1 focus:border-primary focus:outline-none" />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-muted uppercase">Gender</label>
                       <select value={passengerGender} onChange={e => setPassengerGender(e.target.value as any)} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm mt-1 focus:border-primary focus:outline-none">
                         <option>Male</option>
                         <option>Female</option>
                         <option>Other</option>
                       </select>
                     </div>
                   </div>
                </div>
             </div>

             <div className="p-5 border-t border-border bg-surface-2 flex justify-between items-center">
                <div>
                   <div className="text-xs font-bold text-muted uppercase">Total Payable</div>
                   <div className="text-2xl font-black">₹{selectedTrain.baseFare * passengers}</div>
                </div>
                <Button onClick={handleBookTrain} disabled={isBooking} className="px-8 shadow-lg shadow-primary/20">
                  {isBooking ? "Confirming..." : "Pay Securely"}
                </Button>
             </div>
          </div>
        </div>
      )}

      {/* Ticket Confirmation Modal */}
      {confirmedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-surface border border-border shadow-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95 relative overflow-hidden">
             
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
            
            <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-400">
              <CheckCircle2 className="size-8" />
            </div>
            
            <h3 className="font-display text-xl font-bold mb-1">Booking Confirmed!</h3>
            <p className="text-muted text-sm mb-6">Your IRCTC e-Ticket has been generated.</p>

            <div className="w-full border-t border-dashed border-border py-4 my-2 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted">PNR Number</span>
                <span className="text-sm font-bold tracking-wider text-emerald-400">{confirmedTicket.pnr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Train</span>
                <span className="text-sm font-bold">{confirmedTicket.train.trainName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Passenger</span>
                <span className="text-sm font-bold">{confirmedTicket.passenger}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="text-sm text-muted">Total Paid</span>
                <span className="text-sm font-bold">₹{confirmedTicket.totalPaid}</span>
              </div>
            </div>

            <Button onClick={() => setConfirmedTicket(null)} variant="outline" className="w-full mt-4">
              Close & Download Ticket
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
