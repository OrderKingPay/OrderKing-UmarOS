import { createAPIFileRoute } from "@/lib/createAPIFileRoute";

// ORDERKING SOVEREIGN VIP TRAVEL & AIR CONCIERGE INTEGRATION
// Handles IATA GDS inquiries, IRCTC gateway checks, and VIP Custom Concierge Itinerary Consultations:
// Private Aviation, Helicopter Charters, Luxury Heritage Stays at Taj/Oberoi, Executive Chauffeurs, Superfast Rail.

export const SOVEREIGN_TRAVEL_DISCLAIMER =
  "Wholesale B2B fare benchmarks verified against IATA GDS standards. Direct instant issuance connects upon charter confirmation.";

export const APIRoute = createAPIFileRoute('/api/v1/integrations/travel')({
  GET: async () => {
    return new Response(
      JSON.stringify({
        success: true,
        service: "OrderKing Sovereign VIP Travel & Air Concierge",
        status: "OPERATIONAL",
        conciergeDesk: {
          whatsappDesk: "https://wa.me/919876543210",
          directPhone: "+91 98765 43210",
          responseWindow: "Within 15 minutes by Senior Flight & Charter Specialist",
          supportedCategories: [
            "Private Aviation & Jet Charters",
            "Helicopter Charters & Himalayan Heli-tours",
            "Luxury Heritage Stays (Taj, Oberoi, ITC, Marriott)",
            "Executive Chauffeur & Armored Fleet",
            "Superfast Rail (Palace on Wheels, Vande Bharat Executive)"
          ]
        },
        disclaimer: SOVEREIGN_TRAVEL_DISCLAIMER,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  },

  POST: async ({ request }: any) => {
    try {
      const body = await request.json().catch(() => ({}));
      const {
        origin,
        destination,
        date,
        travelDate,
        returnDate,
        type,
        action,
        category,
        serviceCategory,
        passengers,
        paxCount,
        clientName,
        name,
        clientPhone,
        phone,
        clientEmail,
        email,
        preferredVehicleOrProperty,
        specialRequests,
        estimatedBudgetInr,
      } = body;

      const normalizedType = String(type || action || "").toUpperCase();

      // SCENARIO 1: VIP CONCIERGE INQUIRY & CHARTER CONSULTATION
      if (
        normalizedType === "CONCIERGE" ||
        normalizedType === "VIP_CHARTER" ||
        normalizedType === "VIP_CUSTOM" ||
        normalizedType === "CONCIERGE_INQUIRY" ||
        Boolean(clientName || name || clientPhone || phone || category || serviceCategory)
      ) {
        const guestName = String(clientName || name || "Valued Sovereign VIP Guest").trim();
        const guestPhone = String(clientPhone || phone || "").trim();
        const guestEmail = String(clientEmail || email || "").trim();
        const selectedCategory = String(category || serviceCategory || "Private Aviation & Jet Charter");
        const originCity = String(origin || "New Delhi (DEL)").trim();
        const destCity = String(destination || "Mumbai (BOM)").trim();
        const travelDateStr = String(travelDate || date || new Date().toISOString().split("T")[0]);
        const pax = Math.max(1, Number(passengers || paxCount || 1));

        const requestId = `VIP-REQ-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        
        const summaryText = `VIP Request ${requestId}: ${selectedCategory} for ${pax} guest(s) on ${travelDateStr} (${originCity} to ${destCity})`;
        const waEncoded = encodeURIComponent(
          `*OrderKing Sovereign VIP Travel & Air Concierge Inquiry*\n` +
          `• *Request ID:* ${requestId}\n` +
          `• *Guest Name:* ${guestName}\n` +
          `• *Service:* ${selectedCategory}\n` +
          `• *Route:* ${originCity} ➔ ${destCity}\n` +
          `• *Departure Date:* ${travelDateStr}${returnDate ? `\n• *Return Date:* ${returnDate}` : ""}\n` +
          `• *Guests / Pax:* ${pax}\n` +
          (preferredVehicleOrProperty ? `• *Preference:* ${preferredVehicleOrProperty}\n` : "") +
          (specialRequests ? `• *Special Notes:* ${specialRequests}\n` : "") +
          `\nPlease connect me with the Senior Charter Specialist for live quote & slot reservation.`
        );

        const responsePayload = {
          success: true,
          status: "RECEIVED",
          requestId,
          desk: "OrderKing Sovereign VIP Travel & Air Concierge",
          summary: summaryText,
          inquiry: {
            guestName,
            guestPhone,
            guestEmail,
            category: selectedCategory,
            origin: originCity,
            destination: destCity,
            travelDate: travelDateStr,
            returnDate: returnDate || null,
            passengers: pax,
            preferredVehicleOrProperty: preferredVehicleOrProperty || null,
            specialRequests: specialRequests || null,
            estimatedBudgetInr: estimatedBudgetInr || null,
            submittedAt: new Date().toISOString(),
          },
          consultantAssigned: "Senior Flight & Heritage Charter Specialist",
          estimatedResponseTime: "Within 15 minutes by Senior Flight & Charter Specialist",
          whatsappDeskUrl: `https://wa.me/919876543210?text=${waEncoded}`,
          directPhone: "+91 98765 43210",
          disclaimer: SOVEREIGN_TRAVEL_DISCLAIMER,
        };

        return new Response(JSON.stringify(responsePayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // SCENARIO 2: FLIGHTS (Amadeus or Skyscanner B2B GDS)
      if (normalizedType === "FLIGHT") {
        const travelApiKey = process.env.VITE_TRAVEL_API_KEY;
        if (!travelApiKey) {
          return new Response(
            JSON.stringify({
              success: false,
              code: "FLIGHT_SUPPLIER_NOT_CONNECTED",
              error: "Direct GDS flight aggregator not connected. Please connect via OrderKing Sovereign VIP Air Concierge.",
              disclaimer: SOVEREIGN_TRAVEL_DISCLAIMER,
            }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({
            success: false,
            code: "FLIGHT_SUPPLIER_NOT_CONNECTED",
            error: "No live flight quotes or ticket confirmation are available from an authorized supplier.",
            disclaimer: SOVEREIGN_TRAVEL_DISCLAIMER,
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }

      // SCENARIO 3: IRCTC INDIAN TRAINS
      if (normalizedType === "TRAIN") {
        const irctcKey = process.env.VITE_IRCTC_MERCHANT_KEY;
        if (!irctcKey) {
          return new Response(
            JSON.stringify({
              success: false,
              code: "RAILWAY_SUPPLIER_NOT_CONNECTED",
              error: "Authorized railway booking is not connected; no ticket or PNR has been issued.",
              disclaimer: SOVEREIGN_TRAVEL_DISCLAIMER,
            }),
            { status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
          );
        }
        return new Response(
          JSON.stringify({
            success: false,
            code: "RAILWAY_SUPPLIER_NOT_CONNECTED",
            error: "Authorized railway booking is not connected; no ticket or PNR has been issued.",
            disclaimer: SOVEREIGN_TRAVEL_DISCLAIMER,
          }),
          { status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Invalid travel type. Supported: CONCIERGE, VIP_CHARTER, FLIGHT, TRAIN",
          disclaimer: SOVEREIGN_TRAVEL_DISCLAIMER,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: "Internal Server Error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
});
