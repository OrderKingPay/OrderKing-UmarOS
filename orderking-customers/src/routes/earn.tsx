import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/earn")({
  beforeLoad: () => {
    throw redirect({ to: "/kingpay/passbook" });
  },
  component: () => null,
});
