import { createServerFn, createMiddleware } from '@tanstack/react-start';
const authMiddleware = createMiddleware().server(async ({ next }) => next({ context: { userId: '1' } }));
export const testFn = createServerFn({ method: 'GET' }).validator((input: { id: string }) => input).middleware([authMiddleware]).handler(async ({ data, context }) => { return { data, context }; });