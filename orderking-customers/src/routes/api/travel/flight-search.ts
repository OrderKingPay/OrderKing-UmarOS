import { createFileRoute } from "@tanstack/react-router";
import { searchFlightQuotes } from "@/lib/travel/in-app-booking-service";

export const Route = createFileRoute("/api/travel/flight-search")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const from = url.searchParams.get("from") || "New Delhi (DEL)";
          const to = url.searchParams.get("to") || "Mumbai (BOM)";
          const departureDate = url.searchParams.get("departureDate") || url.searchParams.get("date") || new Date().toISOString().split("T")[0];
          const rawCabin = url.searchParams.get("cabinClass") || "Economy";
          const cabinClass = (rawCabin === "Business" || rawCabin === "Premium Economy" ? rawCabin : "Economy") as "Economy" | "Premium Economy" | "Business";
          const passengers = Math.max(1, Math.min(9, parseInt(url.searchParams.get("passengers") || "1", 10) || 1));

          const quotes = searchFlightQuotes(from, to, departureDate, cabinClass);

          return new Response(
            JSON.stringify({
              success: true,
              from,
              to,
              departureDate,
              cabinClass,
              passengers,
              count: quotes.length,
              data: quotes,
              disclaimer: "0% OrderKing convenience fee applied. Pure airline inventory benchmark.",
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=60, s-maxage=120",
              },
            }
          );
        } catch {
          return new Response(
            JSON.stringify({ success: false, error: "Failed to process flight search query." }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
            }
          );
        }
      },
    },
  },
});
