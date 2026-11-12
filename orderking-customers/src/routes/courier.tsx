import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/courier")({
  beforeLoad: () => {
    throw redirect({ to: "/account" });
  },
});
