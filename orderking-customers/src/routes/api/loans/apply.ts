import { createAPIFileRoute } from '@tanstack/react-start/api';



// Mock NBFC API endpoint (e.g. FlexiLoans, Navi, Paisabazaar underwriting)
export const APIRoute = createAPIFileRoute('/api/loans/apply')({
  POST: async () => {
  try {
    const body = await request.json();
    const { panNumber, requestedAmount, income } = body;

    if (!panNumber) {
      return Response.json({ error: "Missing PAN Number" }, { status: 400 });
    }

    // Simulate underwriting process
    await new Promise(r => setTimeout(r, 2500));

    // Simple mock logic:
    // If income is too low, reject
    if (income < 15000) {
      return Response.json({ 
        approved: false, 
        message: "Income must be at least ₹15,000 for Insta-Cash." 
      });
    }

    // Approve the loan!
    const approvedAmount = Math.min(requestedAmount, income * 3); // Max 3x income
    
    return Response.json({
      approved: true,
      disbursedAmount: approvedAmount,
      interestRate: 11.9,
      tenureMonths: 12,
      emi: Math.round((approvedAmount + (approvedAmount * 0.119)) / 12),
      loanId: `LN-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
      message: `Loan of ₹${approvedAmount} approved and disbursed!`
    });
  } catch (err) {
    return Response.json({ error: "Underwriting engine error" }, { status: 500 });
  }
  }
});
