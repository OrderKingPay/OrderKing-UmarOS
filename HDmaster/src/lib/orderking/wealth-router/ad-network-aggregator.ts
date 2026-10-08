interface Bid {
  network: string;
  cpm: number;
}

export async function getHighestBid(endpoints: string[]): Promise<Bid | null> {
  try {
    const fetchPromises = endpoints.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: Bid = await response.json();
      return data;
    });

    const bids = await Promise.allSettled(fetchPromises);
    
    let highestBid: Bid | null = null;
    for (const result of bids) {
      if (result.status === 'fulfilled' && result.value && result.value.cpm !== undefined) {
        if (!highestBid || result.value.cpm > highestBid.cpm) {
          highestBid = result.value;
        }
      }
    }
    return highestBid;
  } catch (error) {
    console.error('Error fetching bids:', error);
    return null;
  }
}
