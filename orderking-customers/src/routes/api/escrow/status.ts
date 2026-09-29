import { createAPIFileRoute } from '@tanstack/react-start/api';

// Mock Nodal Account Escrow verification API (e.g. Yes Bank, ICICI)
export const APIRoute = createAPIFileRoute('/api/escrow/status')({
  GET: async () => {
  try {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1200));

    // Return the status of the pooled escrow account
    return Response.json({
      verified: true,
      bank: "Yes Bank Nodal Account",
      accountNumber: "YESB0000001",
      complianceStatus: "100% RBI Compliant",
      lastAudit: new Date().toISOString(),
      balance: "₹1,24,50,000.00 (Pooled Escrow)"
    });
  } catch (err) {
    return Response.json({ error: "Failed to verify escrow status" }, { status: 500 });
  }
  }
});
