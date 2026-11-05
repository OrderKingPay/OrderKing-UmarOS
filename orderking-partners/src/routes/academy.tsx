import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/academy")({
  component: () => <Navigate to="/kitchen" replace />,
});
