import { useCartStore } from '@/lib/stores/cart';

interface FoodUpiCheckoutCardProps {
  className?: string;
  theme?: 'dark' | 'light';
}

/** Food checkout must start from actual cart items, never invented demonstration meals. */
export function FoodUpiCheckoutCard({ className = '', theme = 'dark' }: FoodUpiCheckoutCardProps) {
  const items = useCartStore((state) => state.items);
  const hasItems = items.length > 0;
  const isDark = theme === 'dark';
  return (
    <section className={`rounded-2xl border p-5 sm:p-6 ${isDark ? 'border-amber-400/30 bg-slate-950 text-white' : 'border-gray-200 bg-white text-gray-900'} ${className}`} aria-label="Food checkout">
      <h3 className="text-lg font-bold">Food checkout</h3>
      <p className="mt-2 text-sm opacity-80">
        {hasItems ? 'Review your actual cart items, delivery fees and final total before paying.' : 'Choose food from an available restaurant to begin an order.'}
      </p>
      <a href={hasItems ? '/cart' : '/'} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300">
        {hasItems ? 'Review cart' : 'Find restaurants'}
      </a>
      <p className="mt-3 text-xs opacity-70">Payment options appear at checkout only when a verified provider is available.</p>
    </section>
  );
}