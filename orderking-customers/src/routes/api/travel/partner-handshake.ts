import { createFileRoute } from "@tanstack/react-router";
import {
  verifySignedTrackingToken,
  recordOutboundPartnerClick,
  generatePartnerLink,
  isAllowedPartnerUrl,
  type PartnerId,
  type TravelMode,
  type UnifiedPartnerRequest,
  type FlightPartnerParams,
  type TrainPartnerParams,
  type BusPartnerParams,
  type HotelPartnerParams,
} from "@/lib/travel/partner-aggregators";

export const Route = createFileRoute("/api/travel/partner-handshake")({
  server: {
    handlers: {
      /**
       * GET Handler:
       * 1. If `?token=...` is provided: Verifies the cryptographic HMAC token, records
       *    the outbound partner click in the double-entry revenue ledger, and issues
       *    an HTTP 302 redirect directly to the partner portal.
       * 2. If direct route parameters are provided: Dynamically generates the verified partner
       *    link, seals it with a signed tracking token, records the click, and redirects.
       */
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const token = url.searchParams.get("token");

          // --- Branch 1: Signed Token Handshake ---
          if (token) {
            const verification = verifySignedTrackingToken(token);
            if (!verification.valid || !verification.payload) {
              return new Response(
                JSON.stringify({
                  error: "Invalid, tampered, or expired partner tracking token.",
                  details: verification.error,
                  code: "INVALID_HANDSHAKE_TOKEN",
                }),
                {
                  status: 400,
                  headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store",
                  },
                }
              );
            }

            const { payload } = verification;

            // Audit outbound click event to authentic ledger
            await recordOutboundPartnerClick(payload);

            // Execute 302 Redirect to validated partner portal
            return new Response(null, {
              status: 302,
              headers: {
                Location: payload.targetUrl,
                "Cache-Control": "no-store, no-cache, must-revalidate",
                Pragma: "no-cache",
                "X-OrderKing-Click-Id": payload.clickId,
                "X-OrderKing-Partner": payload.partner,
                "X-OrderKing-Markup": "0-paise-guarantee",
              },
            });
          }

          // --- Branch 2: Direct Parameter Handshake & Redirect ---
          const partner = url.searchParams.get("partner")?.toLowerCase() as PartnerId | undefined;
          const mode = url.searchParams.get("mode")?.toLowerCase() as TravelMode | undefined;
          const targetUrl = url.searchParams.get("targetUrl");
          const userId = url.searchParams.get("userId") || undefined;
          const subId = url.searchParams.get("subId") || undefined;

          // If a direct targetUrl is explicitly supplied, validate against partner whitelist
          if (targetUrl) {
            if (!isAllowedPartnerUrl(targetUrl)) {
              return new Response(
                JSON.stringify({
                  error: "Target URL host is not in authorized partner whitelist.",
                  code: "UNAUTHORIZED_REDIRECT_DOMAIN",
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            const effectivePartner: PartnerId = partner || "kiwi";
            const effectiveMode: TravelMode = mode || "flight";

            const result = generatePartnerLink(
              effectiveMode === "flight"
                ? {
                    mode: "flight",
                    partner: effectivePartner === "skyscanner" ? "skyscanner" : "kiwi",
                    params: {
                      origin: url.searchParams.get("from") || "DEL",
                      destination: url.searchParams.get("to") || "BOM",
                      departureDate: url.searchParams.get("date") || new Date().toISOString().split("T")[0],
                      userId,
                      subId,
                    },
                  }
                : effectiveMode === "train"
                ? {
                    mode: "train",
                    partner: effectivePartner === "irctc" ? "irctc" : "confirmtkt",
                    params: {
                      fromStation: url.searchParams.get("from") || "NDLS",
                      toStation: url.searchParams.get("to") || "MMCT",
                      travelDate: url.searchParams.get("date") || new Date().toISOString().split("T")[0],
                      pnr: url.searchParams.get("pnr") || undefined,
                      userId,
                      subId,
                    },
                  }
                : effectiveMode === "bus"
                ? {
                    mode: "bus",
                    partner: "redbus",
                    params: {
                      sourceCity: url.searchParams.get("from") || "Bengaluru",
                      destinationCity: url.searchParams.get("to") || "Goa",
                      journeyDate: url.searchParams.get("date") || new Date().toISOString().split("T")[0],
                      userId,
                      subId,
                    },
                  }
                : {
                    mode: "hotel",
                    partner: effectivePartner === "agoda" ? "agoda" : "booking_com",
                    params: {
                      cityOrLocation: url.searchParams.get("city") || "Mumbai",
                      checkInDate: url.searchParams.get("checkIn") || new Date().toISOString().split("T")[0],
                      checkOutDate: url.searchParams.get("checkOut") || new Date().toISOString().split("T")[0],
                      userId,
                      subId,
                    },
                  }
            );

            // Record click
            await recordOutboundPartnerClick({
              clickId: result.clickId,
              partner: effectivePartner,
              travelMode: effectiveMode,
              targetUrl,
              userId,
              subId,
              expectedCommissionBps: result.expectedCommissionBps,
              issuedAt: Date.now(),
              expiresAt: Date.now() + 86400000,
            });

            return new Response(null, {
              status: 302,
              headers: {
                Location: targetUrl,
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "X-OrderKing-Click-Id": result.clickId,
                "X-OrderKing-Markup": "0-paise-guarantee",
              },
            });
          }

          // If partner is specified without token or targetUrl, generate and redirect
          if (partner) {
            let req: UnifiedPartnerRequest;
            if (partner === "kiwi" || partner === "skyscanner") {
              req = {
                mode: "flight",
                partner,
                params: {
                  origin: url.searchParams.get("from") || "DEL",
                  destination: url.searchParams.get("to") || "BOM",
                  departureDate: url.searchParams.get("date") || new Date().toISOString().split("T")[0],
                  passengers: Number(url.searchParams.get("passengers")) || 1,
                  currency: url.searchParams.get("currency") || "INR",
                  userId,
                  subId,
                },
              };
            } else if (partner === "confirmtkt" || partner === "irctc") {
              req = {
                mode: "train",
                partner,
                params: {
                  fromStation: url.searchParams.get("from") || undefined,
                  toStation: url.searchParams.get("to") || undefined,
                  travelDate: url.searchParams.get("date") || undefined,
                  pnr: url.searchParams.get("pnr") || undefined,
                  trainNumber: url.searchParams.get("trainNumber") || undefined,
                  userId,
                  subId,
                },
              };
            } else if (partner === "redbus") {
              req = {
                mode: "bus",
                partner: "redbus",
                params: {
                  sourceCity: url.searchParams.get("from") || "Bengaluru",
                  destinationCity: url.searchParams.get("to") || "Goa",
                  journeyDate: url.searchParams.get("date") || new Date().toISOString().split("T")[0],
                  busType: url.searchParams.get("busType") || undefined,
                  userId,
                  subId,
                },
              };
            } else if (partner === "booking_com" || partner === "agoda") {
              req = {
                mode: "hotel",
                partner,
                params: {
                  cityOrLocation: url.searchParams.get("city") || "Goa",
                  checkInDate: url.searchParams.get("checkIn") || new Date().toISOString().split("T")[0],
                  checkOutDate: url.searchParams.get("checkOut") || new Date().toISOString().split("T")[0],
                  guests: Number(url.searchParams.get("guests")) || 2,
                  rooms: Number(url.searchParams.get("rooms")) || 1,
                  userId,
                  subId,
                },
              };
            } else {
              return new Response(
                JSON.stringify({ error: `Unsupported partner '${partner}'.` }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            const result = generatePartnerLink(req);
            await recordOutboundPartnerClick({
              clickId: result.clickId,
              partner: result.partner,
              travelMode: result.travelMode,
              targetUrl: result.targetUrl,
              userId,
              subId,
              expectedCommissionBps: result.expectedCommissionBps,
              issuedAt: Date.now(),
              expiresAt: Date.now() + 86400000,
            });

            return new Response(null, {
              status: 302,
              headers: {
                Location: result.targetUrl,
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "X-OrderKing-Click-Id": result.clickId,
                "X-OrderKing-Markup": "0-paise-guarantee",
              },
            });
          }

          return new Response(
            JSON.stringify({
              error: "Missing required tracking parameters: specify ?token=... or ?partner=...",
              usage: {
                tokenFormat: "/api/travel/partner-handshake?token=<signedToken>",
                queryFormat: "/api/travel/partner-handshake?partner=kiwi&from=DEL&to=BOM&date=YYYY-MM-DD",
              },
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.error("GET /api/travel/partner-handshake error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to process partner handshake." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },

      /**
       * POST Handler:
       * Generates a verified partner deep-link with a cryptographically signed
       * tracking token and pre-calculates the authentic partner commission ledger entry.
       */
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as Record<string, any>;
          const partner = body.partner?.toLowerCase() as PartnerId | undefined;
          const mode = body.mode?.toLowerCase() as TravelMode | undefined;
          const params = body.params || body;
          const userId = body.userId || params.userId;

          if (!partner) {
            return new Response(
              JSON.stringify({
                error: "partner is required (kiwi | skyscanner | confirmtkt | irctc | redbus | booking_com | agoda).",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          let unifiedReq: UnifiedPartnerRequest;

          switch (partner) {
            case "kiwi":
            case "skyscanner": {
              const flightParams: FlightPartnerParams = {
                origin: params.origin || params.from || "DEL",
                destination: params.destination || params.to || "BOM",
                departureDate: params.departureDate || params.date || new Date().toISOString().split("T")[0],
                returnDate: params.returnDate,
                passengers: Number(params.passengers) || 1,
                cabinClass: params.cabinClass,
                currency: params.currency || "INR",
                subId: params.subId,
                affiliateId: params.affiliateId,
                bookingToken: params.bookingToken,
                estimatedGrossPaise: Number(params.estimatedGrossPaise) || undefined,
                userId,
              };
              unifiedReq = { mode: "flight", partner, params: flightParams };
              break;
            }

            case "confirmtkt":
            case "irctc": {
              const trainParams: TrainPartnerParams = {
                fromStation: params.fromStation || params.from,
                toStation: params.toStation || params.to,
                travelDate: params.travelDate || params.date,
                quota: params.quota,
                pnr: params.pnr,
                trainNumber: params.trainNumber,
                subId: params.subId,
                affiliateId: params.affiliateId,
                estimatedGrossPaise: Number(params.estimatedGrossPaise) || undefined,
                userId,
              };
              unifiedReq = { mode: "train", partner, params: trainParams };
              break;
            }

            case "redbus": {
              const busParams: BusPartnerParams = {
                sourceCity: params.sourceCity || params.from || "Bengaluru",
                destinationCity: params.destinationCity || params.to || "Goa",
                journeyDate: params.journeyDate || params.date || new Date().toISOString().split("T")[0],
                busType: params.busType,
                subId: params.subId,
                affiliateId: params.affiliateId,
                estimatedGrossPaise: Number(params.estimatedGrossPaise) || undefined,
                userId,
              };
              unifiedReq = { mode: "bus", partner: "redbus", params: busParams };
              break;
            }

            case "booking_com":
            case "agoda": {
              const hotelParams: HotelPartnerParams = {
                cityOrLocation: params.cityOrLocation || params.city || "Mumbai",
                checkInDate: params.checkInDate || params.checkIn || new Date().toISOString().split("T")[0],
                checkOutDate: params.checkOutDate || params.checkOut || new Date().toISOString().split("T")[0],
                guests: Number(params.guests) || 2,
                rooms: Number(params.rooms) || 1,
                subId: params.subId,
                affiliateId: params.affiliateId,
                estimatedGrossPaise: Number(params.estimatedGrossPaise) || undefined,
                userId,
              };
              unifiedReq = { mode: "hotel", partner, params: hotelParams };
              break;
            }

            default:
              return new Response(
                JSON.stringify({ error: `Unsupported partner '${partner}'.` }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
          }

          const result = generatePartnerLink(unifiedReq);

          return new Response(
            JSON.stringify({
              success: true,
              data: result,
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              },
            }
          );
        } catch (error: any) {
          console.error("POST /api/travel/partner-handshake error:", error);
          return new Response(
            JSON.stringify({
              error: error?.message || "Failed to generate partner handshake.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
