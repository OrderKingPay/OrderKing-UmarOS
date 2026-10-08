import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/command/widgets";

export function TravelPage() {
  const [mode, setMode] = useState<"FLIGHT" | "TRAIN">("FLIGHT");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [error, setError] = useState<string | null>(null);

  const search = useMutation({
    mutationFn: async () => {
      setError(null);
      const res = await fetch(`/api/v1/travel/search?mode=${mode}&origin=${origin}&destination=${destination}&date=${date}&passengers=${passengers}`);
      const data = await res.json();
      if (data.error || (data.errors && data.errors.length > 0)) {
        const blocked = data.errors?.find((e: any) => e.error === "EXTERNAL_PROVIDER_BLOCKED" || e.blocked) || (data.blocked ? data : null);
        if (blocked) {
          throw new Error(blocked.details || "BLOCKED BY EXTERNAL PROVIDER: Missing production API credentials.");
        }
        throw new Error(data.details || data.error || data.errors?.[0]?.details || "Search failed");
      }
      return data || [];
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    }
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Travel Provider Orchestration</h1>
        <p className="mt-1 text-sm text-muted">Founder Dashboard: Monitor Affiliate Commission Engine metrics in real-time.</p>
      </header>

      <div className="flex gap-2 border-b border-border pb-4">
        <Button variant={mode === "FLIGHT" ? "primary" : "secondary"} onClick={() => setMode("FLIGHT")}>
          Flights
        </Button>
        <Button variant={mode === "TRAIN" ? "primary" : "secondary"} onClick={() => setMode("TRAIN")}>
          Indian Rail
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
        <Field label="Origin">
          <Input placeholder="Code (e.g. DEL)" value={origin} onChange={(e: any) => setOrigin(e.target.value)} />
        </Field>
        <Field label="Destination">
          <Input placeholder="Code (e.g. BOM)" value={destination} onChange={(e: any) => setDestination(e.target.value)} />
        </Field>
        <Field label="Date">
          <Input type="date" value={date} onChange={(e: any) => setDate(e.target.value)} />
        </Field>
        <Field label="Passengers">
          <Input type="number" min="1" max="9" value={passengers} onChange={(e: any) => setPassengers(e.target.value)} />
        </Field>
        <Button 
          disabled={search.isPending || !origin || !destination || !date} 
          onClick={() => search.mutate()}
        >
          {search.isPending ? "Searching..." : "Orchestrate"}
        </Button>
      </div>

      {error ? (
        <div className="rounded-[16px] border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center gap-2 text-red-500 font-semibold mb-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>INTEGRATION STATUS</span>
          </div>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : null}

      {!error && search.data ? (
        <div className="space-y-4">
          <h2 className="font-display text-2xl">Orchestration Results</h2>
          {search.data.length === 0 ? (
            <p className="text-muted text-sm">No inventory found for this route/date.</p>
          ) : (
            <div className="grid gap-4">
              {search.data.map((r: any, idx: number) => (
                <div key={idx} className="rounded-[12px] border border-border bg-elevated/50 p-4 space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <div>
                      <h3 className="font-bold">{r.type.toUpperCase()} - {r.inventoryId}</h3>
                      <p className="text-xs text-muted">Best Provider: {r.bestOffer.providerId}</p>
                    </div>
                    <Badge className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20">
                      ${r.bestOffer.founderRevenue.toFixed(2)} Profit
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="p-2 rounded bg-surface border border-border">
                      <p className="text-xs text-muted">Gross Price</p>
                      <p className="font-mono font-semibold">${r.bestOffer.grossPrice.toFixed(2)}</p>
                    </div>
                    <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      <p className="text-xs">Customer Price</p>
                      <p className="font-mono font-semibold">${r.bestOffer.customerPrice.toFixed(2)}</p>
                    </div>
                    <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                      <p className="text-xs">Affiliate Commission</p>
                      <p className="font-mono font-semibold">${r.bestOffer.affiliateCommission.toFixed(2)}</p>
                    </div>
                    <div className="p-2 rounded bg-green-500/10 border border-green-500/20 text-green-500">
                      <p className="text-xs">Founder Revenue</p>
                      <p className="font-mono font-semibold">${r.bestOffer.founderRevenue.toFixed(2)}</p>
                    </div>
                  </div>

                  {r.alternativeOffers && r.alternativeOffers.length > 0 && (
                    <div className="pt-3 border-t border-border mt-3">
                      <p className="text-xs text-muted mb-2">Alternative Providers Evaluated:</p>
                      <ul className="space-y-1">
                        {r.alternativeOffers.map((alt: any, altIdx: number) => (
                          <li key={altIdx} className="flex justify-between text-xs p-1.5 bg-surface rounded">
                            <span className="font-semibold">{alt.providerId}</span>
                            <span className="font-mono text-muted">
                              Cust: ${alt.customerPrice.toFixed(2)} | Rev: ${alt.founderRevenue.toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
