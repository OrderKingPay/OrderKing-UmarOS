import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getSessionUser, authConfigured } from '@/lib/auth/verify.server';
import { conversationalControl } from '../../../../lib/orderking/ai/founder-conversational-control.server';
import { registerFounderTools } from '../../../../lib/orderking/ai/tool-registry.server';
import { getSql } from '@/lib/db';

export const executeConversationalCommand = createServerFn({ method: 'POST' })
  .validator((d: { command: string }) => d)
  .handler(async ({ data }) => {
    const sessionUser = await getSessionUser();
    let userId: string;
    let userRole: string = 'USER';

    if (sessionUser?.id) {
      userId = sessionUser.id;
      if ((sessionUser as any).role) {
        userRole = String((sessionUser as any).role).toUpperCase();
      }
      try {
        const sql = await getSql();
        const rows = await sql`SELECT role FROM "user" WHERE id = ${userId} LIMIT 1`;
        if (rows.length > 0 && (rows[0] as any).role) {
          userRole = String((rows[0] as any).role).toUpperCase();
        }
      } catch (dbErr) {
        console.warn('[executeConversationalCommand] User role query fallback:', dbErr);
      }
    } else {
      // In development/test environment without live auth configured, allow local dev fallback
      const isDev = process.env.NODE_ENV !== 'production' || !authConfigured;
      if (isDev) {
        userId = 'dev-founder';
        userRole = 'FOUNDER';
      } else {
        throw new Error('UNAUTHORIZED: Founder authentication required to execute sovereign commands.');
      }
    }

    if (userRole !== 'FOUNDER' && userRole !== 'SUPER_ADMIN') {
      throw new Error('FORBIDDEN: Insufficient privileges. Founder or Super Admin authority required.');
    }
    
    registerFounderTools();
    const context = {
      userId,
      role: userRole,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    const result = await conversationalControl.interpretAndExecute(data.command, context);
    return result;
  });

