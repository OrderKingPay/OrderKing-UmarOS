import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/kingpay-wallet")({
  beforeLoad: () => {
    throw redirect({ to: "/account" });
  },
});
