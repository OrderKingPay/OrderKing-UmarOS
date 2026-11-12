import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/king-pay")({
  beforeLoad: () => {
    throw redirect({ to: "/account" });
  },
});
