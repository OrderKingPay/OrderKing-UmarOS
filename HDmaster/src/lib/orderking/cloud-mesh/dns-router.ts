export async function createSubdomain(zoneId: string, apiToken: string, restaurantName: string, ipAddress: string): Promise<any> {
    const sanitizedName = restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({
            type: 'A',
            name: sanitizedName,
            content: ipAddress,
            ttl: 3600,
            proxied: true
        })
    });

    if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Cloudflare API error: ${response.statusText} - ${errorDetails}`);
    }

    return await response.json();
}
