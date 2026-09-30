import { createAPIFileRoute } from '@/lib/createAPIFileRoute';
import { auth } from "@/lib/auth/server";

export const APIRoute = createAPIFileRoute("/api/auth/$")({
  
  server: {
    handlers: {
      GET: ({ request }: any) => auth.handler(request),
      POST: ({ request }: any) => auth.handler(request),
    },
  },
});
