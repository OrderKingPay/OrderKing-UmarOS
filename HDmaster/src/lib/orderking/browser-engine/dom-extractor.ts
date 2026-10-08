export interface ExtractedData {
  pricing: number | null;
  competitors: string[];
  textContent: string;
}

export class DomExtractor {
  extractData(html: string): ExtractedData {
    const priceMatch = html.match(/\$\s*(\d+(?:\.\d{2})?)/);
    const pricing = priceMatch ? parseFloat(priceMatch[1]) : null;

    const competitors: string[] = [];
    const htmlLower = html.toLowerCase();
    if (htmlLower.includes('amazon')) competitors.push('Amazon');
    if (htmlLower.includes('walmart')) competitors.push('Walmart');

    const textContent = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

    return {
      pricing,
      competitors,
      textContent
    };
  }
}
