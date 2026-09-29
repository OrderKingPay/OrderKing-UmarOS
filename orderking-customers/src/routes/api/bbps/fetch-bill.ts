

// Mock BBPS Fetch Bill Endpoint
// In production, this would call Setu/Decentro BBPS APIs.
export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { billerId, consumerNumber } = body;

    if (!billerId || !consumerNumber) {
      return Response.json({ error: "Missing billerId or consumerNumber" }, { status: 400 });
    }

    // Simulate network delay to BBPS
    await new Promise(r => setTimeout(r, 1200));

    // Mock response
    return Response.json({
      billerId,
      consumerNumber,
      customerName: "Mohammad Habibullah",
      billAmount: Math.floor(800 + Math.random() * 1500),
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
      billDate: new Date().toISOString(),
      billId: `BBPS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      status: "UNPAID"
    });
  } catch (err) {
    return Response.json({ error: "Failed to fetch bill from BBPS" }, { status: 500 });
  }
}
