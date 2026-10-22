/**
 * Keep the legacy import contract while wallet funding is not authorized.
 * Never open a payment intent, collect funds or show an unverified credit.
 * A future implementation must obtain an authenticated server-side order,
 * verify the gateway's signed capture, and post an idempotent server ledger.
 */
interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentBalancePaise: number;
  onSuccess: (addedPaise: number) => void;
}

export function AddMoneyModal(_props: Props) {
  return null;
}
