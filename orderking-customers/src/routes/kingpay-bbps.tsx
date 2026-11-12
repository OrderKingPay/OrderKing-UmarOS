import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/kingpay-bbps")({
  beforeLoad: () => {
    throw redirect({ to: "/account" });
  },
});
