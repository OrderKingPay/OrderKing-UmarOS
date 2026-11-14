import { redirect, createFileRoute } from "@tanstack/react-router";
import { WalletPage } from "./wallet";

export const Route = createFileRoute("/cash")({
  beforeLoad: ({ context }) => {
    if (!context?.sessionUser) throw redirect({ to: "/login" });
  },
  component: WalletPage,
});
