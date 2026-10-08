export async function testApiRoute(method: string, url: string, payload?: any) {
  const start = Date.now();
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (payload && method !== 'GET' && method !== 'HEAD') {
    options.body = JSON.stringify(payload);
  }

  try {
    const response = await fetch(url, options);
    const duration = Date.now() - start;
    const status = response.status;
    
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      success: response.ok,
      status,
      duration,
      data,
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
