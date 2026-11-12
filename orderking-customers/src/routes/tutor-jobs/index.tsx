import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/tutor-jobs/")({
  beforeLoad: () => {
    throw redirect({ to: "/account" });
  },
});
