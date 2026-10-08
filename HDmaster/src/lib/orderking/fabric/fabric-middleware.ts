import { fabric } from './universal-fabric';

/**
 * Next.js App Router compatible Route Handler for the Universal Connector Fabric.
 * Catch-all route handler for `app/api/fabric/[...path]/route.ts`.
 */
export async function handleFabricRequest(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    let body: any = undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await request.json();
      } catch (e) {
        // Fallback for empty or non-JSON bodies
        body = undefined;
      }
    }

    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const fabricResponse = await fabric.dispatch({
      path,
      method,
      headers,
      body,
      query,
    });

    return new Response(
      JSON.stringify(
        fabricResponse.error
          ? { error: fabricResponse.error, details: fabricResponse.data }
          : { data: fabricResponse.data }
      ),
      {
        status: fabricResponse.status,
        headers: {
          'Content-Type': 'application/json',
          ...(fabricResponse.headers || {}),
        },
      }
    );
  } catch (error: any) {
    console.error('[Fabric Route Handler Error]', error);
    return new Response(
      JSON.stringify({ error: 'Critical Fabric Fault', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Ensure engines are loaded to register the routes
import './engines';
