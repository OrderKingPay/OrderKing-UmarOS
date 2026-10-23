import { createServerFn } from '@tanstack/react-start';

/**
 * The previous command interpreter returned hardcoded live-infrastructure
 * successes and invented telemetry. Keep the endpoint contract while denying
 * non-existent actions; no external API is modified by a chat instruction.
 */
export const executeOmniCommand = createServerFn({ method: 'POST' })
  .validator((data: { command: string }) => data)
  .handler(async () => ({
    status: 'ERROR' as const,
    message: 'This command is unavailable because no verified infrastructure action is connected.',
  }));
