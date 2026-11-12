import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/kingpay/passbook")({
  beforeLoad: () => {
    throw redirect({ to: "/account" });
  },
});
