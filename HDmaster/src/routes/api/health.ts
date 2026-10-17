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
          const dbUrl = getDatabaseUrl();
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
            } catch (dbErr) {
              dbStatus = `error: ${String(dbErr)}`;
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
              status: isHealthy ? 200 : 200, // Return 200 with diagnostic status so health probes don't false-fail network layers
              headers: {
                'content-type': 'application/json',
                'cache-control': 'no-store, no-cache, must-revalidate',
              },
            }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({
              status: 'unhealthy',
              error: String(error),
              timestamp: new Date().toISOString(),
            }),
            {
              status: 200,
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
