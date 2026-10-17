import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/ping')({
  server: {
    handlers: {
      GET: async () => {
        return new Response('pong', {
          status: 200,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'no-store, no-cache, must-revalidate',
          },
        });
      },
      HEAD: async () => {
        return new Response(null, {
          status: 200,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'no-store, no-cache, must-revalidate',
          },
        });
      },
    },
  },
});
