export class PuppeteerAdapter {
  constructor(private browserWSEndpoint?: string) {}

  async fetchPage(url: string, options?: RequestInit): Promise<string> {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return await response.text();
  }
}
