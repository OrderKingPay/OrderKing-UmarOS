declare function getSql(query: string, params?: any[]): Promise<any>;

export interface AdPayload {
  network: string;
  bidAmount: number;
  adContent: string;
}

export async function requestHighestAdBid(customerId: string): Promise<AdPayload | null> {
  // Retrieve the customer's order history to determine LTV
  const rows = await getSql('SELECT SUM(total_amount) as ltv FROM orders WHERE customer_id = ?', [customerId]);
  const ltv = rows[0]?.ltv || 0;

  // Prepare ad network endpoints
  const networks = [
    'https://adnetwork1.example.com/bid',
    'https://adnetwork2.example.com/bid',
    'https://adnetwork3.example.com/bid'
  ];

  // Setup timeout to drop bids taking > 200ms
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 200);

  // Ping multiple ad networks concurrently
  const bidPromises = networks.map(async (networkUrl) => {
    try {
      const response = await fetch(networkUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, ltv }),
        signal: controller.signal
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return {
        network: networkUrl,
        bidAmount: data.bidAmount || 0,
        adContent: data.adContent || ''
      } as AdPayload;
    } catch (err) {
      // Drop bid on timeout or network error
      return null;
    }
  });

  const results = await Promise.all(bidPromises);
  clearTimeout(timeoutId);

  // Select the highest bidding network
  let highestBid: AdPayload | null = null;
  for (const result of results) {
    if (result && (!highestBid || result.bidAmount > highestBid.bidAmount)) {
      highestBid = result;
    }
  }

  return highestBid;
}
