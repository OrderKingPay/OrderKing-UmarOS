// @ts-ignore
import { createAPIFileRoute } from '@tanstack/react-start/api';

export const APIRoute = createAPIFileRoute('/api/escrow/status')({
  GET: async () => {
    return Response.json({ error: "Real Escrow API not connected. Mock data disabled." }, { status: 501 });
  }
});
