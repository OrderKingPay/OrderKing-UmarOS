import { createFileRoute } from '@tanstack/react-router';

export function createAPIFileRoute(path: string) {
  return (options: any) => {
    return createFileRoute(path as never)(options as never);
  };
}
