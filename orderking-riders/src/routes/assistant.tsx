import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/assistant")({
  component: () => <Navigate to="/support" replace />,
});
