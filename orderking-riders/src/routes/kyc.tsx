import { redirect, createFileRoute } from "@tanstack/react-router";
import { RiderOnboardingPage } from "./onboarding";

export const Route = createFileRoute("/kyc")({
  beforeLoad: ({ context }) => {
    if (!context?.sessionUser) throw redirect({ to: "/login" });
  },
  component: RiderOnboardingPage,
});
