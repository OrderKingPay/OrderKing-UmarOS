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
    if (!sessionUser?.id) {
      throw new Error('UNAUTHORIZED: Founder authentication required to execute platform administration commands.');
    }

    const userId = sessionUser.id;
    const { getAdminRole } = await import('@/lib/orderking/server/workspace.server');
    const userRole = (await getAdminRole(userId, sessionUser.email)) || 'USER';

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

