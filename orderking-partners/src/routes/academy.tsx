import { redirect, createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/academy")({
  beforeLoad: ({ context }) => {
    if (!context?.sessionUser) throw redirect({ to: "/login" });
  },
  component: AcademyPage
});

function AcademyPage() {
  return <Navigate to="/support" replace />;
}
