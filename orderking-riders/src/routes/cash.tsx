import { createFileRoute } from "@tanstack/react-router";
import { WalletPage } from "./wallet";

export const Route = createFileRoute("/cash")({
  component: WalletPage,
});
