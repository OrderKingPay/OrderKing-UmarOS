import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/king-pay/assist")({
  beforeLoad: () => {
    throw redirect({ to: "/account" });
  },
});
