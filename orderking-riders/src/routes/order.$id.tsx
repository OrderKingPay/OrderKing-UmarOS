import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/order/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/delivery/$id", params: { id: params.id } });
  },
  component: () => null,
});
