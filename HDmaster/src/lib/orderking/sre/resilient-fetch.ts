export interface ResilientFetchOptions extends RequestInit {
  timeoutMs?: number;
  fallbackResponse?: any;
}

export async function resilientFetch(url: string, options: ResilientFetchOptions = {}): Promise<Response> {
  const { timeoutMs = 8000, fallbackResponse, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);

    if (fallbackResponse !== undefined) {
      console.warn(`[SRE] Fetch failed for ${url}, using fallback.`);
      return new Response(JSON.stringify(fallbackResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`[SRE] Request timeout after ${timeoutMs}ms for ${url}`);
    }
    throw error;
  }
}
