// @ts-nocheck
import { createFileRoute } from '@tanstack/react-router';
import { getSql } from '@/lib/db';

export const Route = createFileRoute('/api/health')({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async () => {
        try {
          const sql = await getSql();
          await sql.query('SELECT 1');
          
          const checks = {
            database: 'connected',
            secrets: {
              auth: !!process.env.BETTER_AUTH_SECRET,
              db: !!process.env.DATABASE_URL || !!process.env.VITE_PG_LITE_URL
            }
          };

          const isHealthy = checks.database === 'connected' && checks.secrets.auth && checks.secrets.db;

          return new Response(JSON.stringify({ 
            status: isHealthy ? 'healthy' : 'unhealthy',
            ...checks,
            timestamp: new Date().toISOString()
          }), {
            status: isHealthy ? 200 : 500,
            headers: { 'content-type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ 
            status: 'unhealthy',
            error: String(error)
          }), {
            status: 500,
            headers: { 'content-type': 'application/json' }
          });
        }
      }
    }
  }
});
