import { createAPIFileRoute } from '@/lib/createAPIFileRoute';

export const Route = createAPIFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        const p = '@/lib/auth/server';
        const { auth } = await import(/* @vite-ignore */ p);
        return auth.handler(request);
      },
      POST: async ({ request }: any) => {
        const p = '@/lib/auth/server';
        const { auth } = await import(/* @vite-ignore */ p);
        return auth.handler(request);
      },
    },
  },
});
