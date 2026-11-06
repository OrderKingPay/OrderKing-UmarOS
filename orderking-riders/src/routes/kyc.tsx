import { createFileRoute } from "@tanstack/react-router";
import { RiderOnboardingPage } from "./onboarding";

export const Route = createFileRoute("/kyc")({
  component: RiderOnboardingPage,
});
