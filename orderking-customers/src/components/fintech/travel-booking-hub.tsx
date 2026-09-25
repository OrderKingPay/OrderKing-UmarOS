import { useState } from "react";
import { Plane, TrainFront, BusFront, CarFront, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlightBookingEngine } from "@/components/fintech/flight-booking-engine";
import { TravelLocationPicker, type TravelLocation } from "./travel-location-picker";
import { toast } from "sonner";

export type TravelTab = "flights" | "trains" | "buses" | "cabs";

type Props = {
  walletBalance: number;
  onDeductWallet: (amount: number, description: string) => boolean;
  defaultTab?: TravelTab;
};

const TAB_META: Record<TravelTab, { label: string; icon: typeof Plane }> = {
  flights: { label: "Flights", icon: Plane },
  trains: { label: "Trains", icon: TrainFront },
  buses: { label: "Buses", icon: BusFront },
  cabs: { label: "Cabs", icon: CarFront },
};

export function TravelBookingHub({ walletBalance, onDeductWallet, defaultTab = "flights" }: Props) {
  const [activeTab, setActiveTab] = useState<TravelTab>(defaultTab);
  const [fromStation, setFromStation] = useState<TravelLocation | null>(null);
  const [toStation, setToStation] = useState<TravelLocation | null>(null);
  const [trainDate, setTrainDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]!
  );
  const [trainSearching, setTrainSearching] = useState(false);
  const [trainStatus, setTrainStatus] = useState<string | null>(null);
  const [trainResults, setTrainResults] = useState<any[]>([]);

  const searchTrains = async () => {
    if (!fromStation || !toStation) {
      toast.error("Select both origin and destination stations from the station search.");
      return;
    }

    if (fromStation.code === toStation.code) {
      toast.error("Origin and destination stations cannot be the same.");
      return;
    }

    setTrainSearching(true);
    setTrainStatus(null);
    setTrainResults([]);

    try {
      const baseUrl = (import.meta.env.VITE_HDMASTER_API_BASE_URL || "https://hdmaster.vercel.app").replace(/\/$/, "");
      const params = new URLSearchParams({
        mode: "TRAIN",
        origin: fromStation.code,
        destination: toStation.code,
        date: trainDate,
        passengers: "1",
      });
      const response = await fetch(`${baseUrl}/api/v1/travel/search?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.details || data?.error || `Train search failed (${response.status})`);
      }

      if (Array.isArray(data.results) && data.results.length > 0) {
        setTrainResults(data.results);
        setTrainStatus(`Live rail provider returned ${data.results.length} result(s).`);
      } else {
        const details = Array.isArray(data.errors) && data.errors.length
          ? data.errors.map((e: any) => e.details || e.error).filter(Boolean).join("; ")
          : "No live rail provider results are configured.";
        setTrainStatus(`No live train results. ${details}`);
      }
    } catch (error) {
      setTrainStatus(error instanceof Error ? error.message : "Live train search failed.");
    } finally {
      setTrainSearching(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(Object.keys(TAB_META) as TravelTab[]).map((tab) => {
          const Icon = TAB_META[tab].icon;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition ${
                activeTab === tab
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-muted hover:text-fg"
              }`}
            >
              <Icon className="size-4" />
              {TAB_META[tab].label}
            </button>
          );
        })}
      </div>

      {activeTab === "flights" && (
        <FlightBookingEngine walletBalance={walletBalance} onDeductWallet={onDeductWallet} />
      )}

      {activeTab === "trains" && (
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <div>
            <h3 className="font-display text-xl font-black text-fg">Search trains</h3>
            <p className="text-xs text-muted mt-1">
              Station search is connected to the HDmaster travel API. Results are shown only when an authorized live rail provider is configured.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <TravelLocationPicker
              mode="TRAIN"
              value={fromStation}
              onChange={setFromStation}
              label="From Station"
              placeholder="Search station, city or code"
            />
            <TravelLocationPicker
              mode="TRAIN"
              value={toStation}
              onChange={setToStation}
              label="To Station"
              placeholder="Search station, city or code"
            />
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted uppercase">Departure Date</label>
              <input
                type="date"
                value={trainDate}
                onChange={(e) => setTrainDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg"
                aria-label="Train departure date"
              />
            </div>
          </div>

          <Button
            onClick={searchTrains}
            disabled={trainSearching}
            className="w-full md:w-auto font-bold"
          >
            <Search className="size-4 mr-2" />
            {trainSearching ? "Checking live rail provider..." : "Search live trains"}
          </Button>

          {trainResults.length > 0 && (
            <div className="space-y-2">
              {trainResults.map((train) => {
                const raw = train?.rawProviderData || {};
                const platform = raw.platform ?? raw.boardingPlatform ?? raw.platformNumber ?? null;
                return (
                  <div key={train.id} className="rounded-xl border border-border bg-surface-2 p-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-fg">{train.carrier?.name || train.carrier?.code || "Rail provider"}</p>
                        <p className="text-muted">{train.origin?.code} → {train.destination?.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-fg">
                          {Number(train.price?.amount || 0).toLocaleString("en-IN", { style: "currency", currency: train.price?.currency || "INR" })}
                        </p>
                        {platform !== null && <p className="text-[10px] text-muted">Platform {String(platform)}</p>}
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-muted">
                      {train.departureTime ? new Date(train.departureTime).toLocaleString() : "Departure time supplied by provider"} · {train.providerId || "live provider"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {trainStatus && (
            <div className="rounded-xl border border-border bg-surface-2 p-3 text-xs text-muted flex items-start gap-2">
              <ShieldAlert className="size-4 shrink-0 text-primary" />
              <span>{trainStatus}</span>
            </div>
          )}
        </div>
      )}

      {(activeTab === "buses" || activeTab === "cabs") && (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center space-y-3">
          <ShieldAlert className="size-10 mx-auto text-muted" />
          <h3 className="font-display text-xl font-bold text-fg">
            {TAB_META[activeTab].label} provider not connected
          </h3>
          <p className="text-sm text-muted max-w-lg mx-auto">
            No live provider is currently connected for this mode. The UI will not fabricate vehicles, prices, availability or bookings.
          </p>
        </div>
      )}
    </div>
  );
}
