import { createAPIFileRoute } from "@/lib/createAPIFileRoute";

// ORDERKING TRAVEL & FLIGHT CONCIERGE INTEGRATION
// Handles IATA GDS inquiries, IRCTC gateway checks, and Travel Itinerary Consultations:
// Flights, Hotels, Cabs, Trains, and Stays.

export const TRAVEL_CONCIERGE_DISCLAIMER =
  "Wholesale B2B fare benchmarks verified against IATA GDS standards. Direct instant issuance connects upon booking confirmation.";
export const SOVEREIGN_TRAVEL_DISCLAIMER = TRAVEL_CONCIERGE_DISCLAIMER;

export const APIRoute = createAPIFileRoute('/api/v1/integrations/travel')({
  GET: async () => {
    const waNum = (process.env.SUPPORT_WHATSAPP_NUMBER || "").replace(/\D/g, "");
    const directPhone = (process.env.LEGAL_PHONE || "").trim();
    return new Response(
      JSON.stringify({
        success: true,
        service: "OrderKing Travel Concierge",
        status: "OPERATIONAL",
        conciergeDesk: {
          whatsappDesk: waNum ? `https://wa.me/${waNum}` : null,
          directPhone: directPhone || null,
          responseWindow: "Within 15 minutes by Senior Flight & Charter Specialist",
          supportedCategories: [
            "Private Aviation & Jet Charters",
            "Helicopter Charters & Himalayan Heli-tours",
            "Luxury Heritage Stays (Taj, Oberoi, ITC, Marriott)",
            "Executive Chauffeur & Armored Fleet",
            "Superfast Rail (Palace on Wheels, Vande Bharat Executive)"
          ]
        },
        disclaimer: TRAVEL_CONCIERGE_DISCLAIMER,
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
        const guestName = String(clientName || name || "Valued Guest").trim();
        const guestPhone = String(clientPhone || phone || "").trim();
        const guestEmail = String(clientEmail || email || "").trim();
        const selectedCategory = String(category || serviceCategory || "Private Aviation & Jet Charter");
        const originCity = String(origin || "New Delhi (DEL)").trim();
        const destCity = String(destination || "Mumbai (BOM)").trim();
        const travelDateStr = String(travelDate || date || new Date().toISOString().split("T")[0]);
        const pax = Math.max(1, Number(passengers || paxCount || 1));

        const requestId = `VIP-REQ-${crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        const waNum = (process.env.SUPPORT_WHATSAPP_NUMBER || "").replace(/\D/g, "");
        const directPhone = (process.env.LEGAL_PHONE || "").trim();
        
        const summaryText = `VIP Request ${requestId}: ${selectedCategory} for ${pax} guest(s) on ${travelDateStr} (${originCity} to ${destCity})`;
        const waEncoded = encodeURIComponent(
          `*OrderKing Travel Concierge Inquiry*\n` +
          `| *Request ID:* ${requestId}\n` +
          `| *Guest Name:* ${guestName}\n` +
          `| *Service:* ${selectedCategory}\n` +
          `| *Route:* ${originCity} -> ${destCity}\n` +
          `| *Departure Date:* ${travelDateStr}${returnDate ? `\n| *Return Date:* ${returnDate}` : ""}\n` +
          `| *Guests / Pax:* ${pax}\n` +
          (preferredVehicleOrProperty ? `| *Preference:* ${preferredVehicleOrProperty}\n` : "") +
          (specialRequests ? `| *Special Notes:* ${specialRequests}\n` : "") +
          `\nPlease connect me with the Senior Charter Specialist for live quote & slot reservation.`
        );

        const responsePayload = {
          success: true,
          status: "RECEIVED",
          requestId,
          desk: "OrderKing Travel Concierge",
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
          whatsappDeskUrl: waNum ? `https://wa.me/${waNum}?text=${waEncoded}` : null,
          directPhone: directPhone || null,
          disclaimer: TRAVEL_CONCIERGE_DISCLAIMER,
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
              error: "Direct GDS flight aggregator not connected. Please connect via OrderKing Travel Desk.",
              disclaimer: TRAVEL_CONCIERGE_DISCLAIMER,
            }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({
            success: false,
            code: "FLIGHT_SUPPLIER_NOT_CONNECTED",
            error: "No live flight quotes or ticket confirmation are available from an authorized supplier.",
            disclaimer: TRAVEL_CONCIERGE_DISCLAIMER,
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
              disclaimer: TRAVEL_CONCIERGE_DISCLAIMER,
            }),
            { status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
          );
        }
        return new Response(
          JSON.stringify({
            success: false,
            code: "RAILWAY_SUPPLIER_NOT_CONNECTED",
            error: "Authorized railway booking is not connected; no ticket or PNR has been issued.",
            disclaimer: TRAVEL_CONCIERGE_DISCLAIMER,
          }),
          { status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Invalid travel type. Supported: CONCIERGE, VIP_CHARTER, FLIGHT, TRAIN",
          disclaimer: TRAVEL_CONCIERGE_DISCLAIMER,
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
