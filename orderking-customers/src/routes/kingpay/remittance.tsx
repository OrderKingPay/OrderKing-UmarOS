import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/kingpay/remittance")({
  beforeLoad: () => {
    throw redirect({ to: "/account" });
  },
});
