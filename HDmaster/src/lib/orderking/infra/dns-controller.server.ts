export interface CloudflareDnsRecord {
  id: string;
  zone_id: string;
  zone_name: string;
  name: string;
  type: 'A' | 'CNAME' | 'TXT';
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  locked: boolean;
  meta: Record<string, any>;
  comment: string;
  tags: string[];
  created_on: string;
  modified_on: string;
}

export interface CloudflareApiResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    total_pages: number;
    count: number;
    total_count: number;
  };
}

export class DnsController {
  private readonly baseUrl = 'https://api.cloudflare.com/client/v4';
  private readonly zoneId = 'fc53b6fd613df944a3a46606cfbf21d0'; // orderkingpay.com

  constructor(private readonly apiToken: string) {
    if (!apiToken) {
      throw new Error('Cloudflare API token is required for DnsController.');
    }
  }

  private get headers(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  async listRecords(type?: 'A' | 'CNAME' | 'TXT', name?: string): Promise<CloudflareDnsRecord[]> {
    const url = new URL(`${this.baseUrl}/zones/${this.zoneId}/dns_records`);
    if (type) {
      url.searchParams.append('type', type);
    }
    if (name) {
      url.searchParams.append('name', name);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to list DNS records: ${response.statusText}`);
    }

    const data: CloudflareApiResponse<CloudflareDnsRecord[]> = await response.json();
    if (!data.success) {
      throw new Error(`Cloudflare API error: ${JSON.stringify(data.errors)}`);
    }

    return data.result;
  }

  async createRecord(
    type: 'A' | 'CNAME' | 'TXT',
    name: string,
    content: string,
    options: { ttl?: number; proxied?: boolean; comment?: string } = {}
  ): Promise<CloudflareDnsRecord> {
    const url = `${this.baseUrl}/zones/${this.zoneId}/dns_records`;

    const body = {
      type,
      name,
      content,
      ttl: options.ttl ?? 1, // 1 = automatic
      proxied: options.proxied ?? false,
      comment: options.comment,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to create DNS record: ${response.statusText}`);
    }

    const data: CloudflareApiResponse<CloudflareDnsRecord> = await response.json();
    if (!data.success) {
      throw new Error(`Cloudflare API error: ${JSON.stringify(data.errors)}`);
    }

    return data.result;
  }

  async deleteRecord(recordId: string): Promise<{ id: string }> {
    const url = `${this.baseUrl}/zones/${this.zoneId}/dns_records/${recordId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete DNS record: ${response.statusText}`);
    }

    const data: CloudflareApiResponse<{ id: string }> = await response.json();
    if (!data.success) {
      throw new Error(`Cloudflare API error: ${JSON.stringify(data.errors)}`);
    }

    return data.result;
  }
}
