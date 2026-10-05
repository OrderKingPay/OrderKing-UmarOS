// @ts-ignore
import { createAPIFileRoute } from '@tanstack/react-start/api';

export const APIRoute = createAPIFileRoute('/api/loans/apply')({
  POST: async ({ request }: any) => {
    return Response.json({ error: "Real NBFC API not connected. Mock data disabled." }, { status: 501 });
  }
});
