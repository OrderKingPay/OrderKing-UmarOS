// @ts-ignore
import { createAPIFileRoute } from '@tanstack/react-start/api';

export const APIRoute = createAPIFileRoute('/api/bbps/pay-bill')({
  POST: async ({ request }: any) => {
    return Response.json({ error: "Real BBPS API not connected. Mock data disabled." }, { status: 501 });
  }
});
