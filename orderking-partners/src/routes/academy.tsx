import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/academy")({ component: AcademyPage });

function AcademyPage() {
  return <Navigate to="/support" replace />;
}
