import { getSql } from '../../db';

export async function runHealthCheck(baseUrl: string = 'http://localhost:3000') {
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    const sql = await getSql();
    return {
      success: response.ok,
      status: response.status,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
}

export async function runSmokeTests(baseUrl: string = 'http://localhost:3000') {
  const endpoints = ['/api/orders', '/api/restaurants'];
  const results = [];
  
  const sql = await getSql();
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      results.push({
        endpoint,
        success: response.status === 200,
        status: response.status
      });
    } catch (error) {
      results.push({
        endpoint,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return results;
}
