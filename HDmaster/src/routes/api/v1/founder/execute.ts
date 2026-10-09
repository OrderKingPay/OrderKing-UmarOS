import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/verify.server';
import { conversationalControl } from '../../../../lib/orderking/ai/founder-conversational-control.server';
import { registerFounderTools } from '../../../../lib/orderking/ai/tool-registry.server';
import { getSql } from '@/lib/db';



export const executeConversationalCommand = createServerFn({ method: 'POST' })
  .validator((d: { command: string }) => d)
  .handler(async ({ data }) => {
    const session = await getSessionUser();
    if (!session?.id) throw new Error('UNAUTHORIZED');
    
    // FETCH REAL ROLE
    const sql = await getSql();
    const rows = await sql`SELECT role FROM users WHERE id = ${session.id}`;
    const userRole = rows.length > 0 ? (rows[0] as any).role : 'USER';
    
    registerFounderTools();
    const context = {
      userId: session.id,
      role: userRole,
      requestId: `req_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    const result = await conversationalControl.interpretAndExecute(data.command, context);
    return result;
  });
