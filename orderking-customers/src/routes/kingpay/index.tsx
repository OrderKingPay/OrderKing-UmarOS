import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/kingpay/")({
  beforeLoad: () => {
    throw redirect({ to: "/account" });
  },
});
