import { createFileRoute } from '@tanstack/react-router';
import { getSql, getDatabaseUrl } from '@/lib/db';

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      HEAD: async () => {
        return new Response(null, {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'cache-control': 'no-store, no-cache, must-revalidate',
          },
        });
      },
      GET: async () => {
        try {
          // An absent/invalid secret must report degraded health, not expose connection details.
          let dbUrl: string | null = null;
          try { dbUrl = getDatabaseUrl(); } catch { dbUrl = null; }
          let dbStatus = 'unconfigured';

          if (dbUrl) {
            try {
              const sqlPromise = (async () => {
                const sql = await getSql();
                await sql.query('SELECT 1');
                return 'connected';
              })();
              let timerId: ReturnType<typeof setTimeout> | undefined;
              const timeoutPromise = new Promise<'timeout'>((resolve) => {
                timerId = setTimeout(() => resolve('timeout'), 1500);
              });
              try {
                dbStatus = await Promise.race([sqlPromise, timeoutPromise]);
              } finally {
                if (timerId) clearTimeout(timerId);
              }
            } catch {
              dbStatus = 'unavailable';
            }
          }

          const checks = {
            database: dbStatus,
            secrets: {
              auth: !!process.env.BETTER_AUTH_SECRET,
              db: !!dbUrl || !!process.env.VITE_PG_LITE_URL,
            },
          };

          const isHealthy = checks.database === 'connected' && checks.secrets.auth && checks.secrets.db;

          return new Response(
            JSON.stringify({
              status: isHealthy ? 'healthy' : 'degraded',
              ...checks,
              timestamp: new Date().toISOString(),
            }),
            {
              status: isHealthy ? 200 : 503,
              headers: {
                'content-type': 'application/json',
                'cache-control': 'no-store, no-cache, must-revalidate',
              },
            }
          );
        } catch {
          return new Response(
            JSON.stringify({
              status: 'unhealthy',
              error: 'Health check failed',
              timestamp: new Date().toISOString(),
            }),
            {
              status: 503,
              headers: {
                'content-type': 'application/json',
                'cache-control': 'no-store, no-cache, must-revalidate',
              },
            }
          );
        }
      },
    },
  },
});
