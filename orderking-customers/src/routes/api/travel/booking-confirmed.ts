import { createFileRoute } from "@tanstack/react-router";
import {
  dispatchBookingConfirmationTelecom,
  type TravelBookingNotificationPayload,
} from "@/lib/server/sms-gateway";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/travel/booking-confirmed")({
  server: {
    handlers: {
      /**
       * GET Handler: Verification and health query
       */
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const bookingId = url.searchParams.get("bookingId");
        const pnr = url.searchParams.get("pnr");

        return new Response(
          JSON.stringify({
            status: "HEALTHY",
            service: "OrderKing Travel PNR & WhatsApp/SMS Dispatch Engine",
            gstin: "18AFXPH9838M1Z9",
            supportedChannels: [
              "Meta WhatsApp Cloud API v21.0",
              "Fast2SMS DLT",
              "Fast2SMS Smart OTP",
            ],
            query: { bookingId, pnr },
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          },
        );
      },

      /**
       * POST Handler:
       * Trigger automated outbound WhatsApp e-ticket + Fast2SMS DLT PNR confirmation upon payment.
       */
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as Partial<TravelBookingNotificationPayload> & {
            phone?: string;
          };

          const recipientPhone = body.recipientPhone || body.phone;
          if (!recipientPhone) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Missing mandatory recipient phone number.",
                code: "MISSING_PHONE",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          if (!body.bookingId) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Missing mandatory bookingId.",
                code: "MISSING_BOOKING_ID",
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const payload: TravelBookingNotificationPayload = {
            recipientPhone,
            customerName: body.customerName || "Valued Passenger",
            bookingId: body.bookingId,
            pnr: body.pnr || `OK${Date.now().toString().slice(-6)}`,
            serviceType: body.serviceType || "FLIGHT",
            carrierName: body.carrierName || "Carrier Partner",
            serviceNumber: body.serviceNumber,
            origin: body.origin || "Origin Hub",
            destination: body.destination || "Destination Hub",
            departureTime: body.departureTime || "10:00 AM",
            travelDate: body.travelDate || new Date().toISOString().split("T")[0],
            totalPaidPaise: body.totalPaidPaise || 0,
            pdfVoucherUrl: body.pdfVoucherUrl,
            timeoutMs: body.timeoutMs || 5000,
          };

          // 1. Dispatch telecom notifications with automated fail-closed fallback
          const result = await dispatchBookingConfirmationTelecom(payload);

          // 2. Audit to CRM communications ledger if db available
          try {
            const sql = await getSql();
            await sql`
              INSERT INTO crm_communications (channel, recipient, status, metadata, sent_at)
              VALUES (
                ${result.channelUsed},
                ${payload.recipientPhone},
                ${result.success ? "sent" : "failed"},
                ${JSON.stringify({
                  bookingId: payload.bookingId,
                  pnr: payload.pnr,
                  messageId: result.messageId,
                  pdfVoucherUrl: result.pdfVoucherUrl,
                })},
                NOW()
              )
            `;
          } catch {
            /* DB logging is resilient and non-blocking */
          }

          return new Response(
            JSON.stringify({
              success: true,
              data: result,
              timestamp: new Date().toISOString(),
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              },
            },
          );
        } catch (err: any) {
          console.error("[Travel Booking Telecom Dispatch Error]:", err);
          return new Response(
            JSON.stringify({
              success: false,
              error:
                err?.message ||
                "Failed to dispatch booking telecom notification.",
              code: "DISPATCH_FAILED",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
