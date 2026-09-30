
// @ts-ignore
import { createAPIFileRoute } from '@tanstack/react-start/api';



// Mock BBPS Pay Bill Endpoint
// In production, this would hit Setu/Decentro BBPS to clear the bill.
export const APIRoute = createAPIFileRoute('/api/bbps/pay-bill')({
  POST: async ({ request }: any) => {
  try {
    const body = await request.json();
    const { billId, amount, paymentMethod } = body;

    if (!billId || !amount) {
      return Response.json({ error: "Missing billId or amount" }, { status: 400 });
    }

    // Simulate network delay to BBPS
    await new Promise(r => setTimeout(r, 1500));

    // Mock response
    return Response.json({
      success: true,
      transactionId: `BBPS-TXN-${Date.now()}`,
      billId,
      amount,
      paymentMethod,
      billerReferenceNumber: Math.random().toString().slice(2, 12),
      status: "SUCCESS",
      message: "Bill paid successfully via BBPS"
    });
  } catch (err) {
    return Response.json({ error: "Failed to process BBPS payment" }, { status: 500 });
  }
  }
});
