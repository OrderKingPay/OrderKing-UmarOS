const fs = require('fs');
const path = 'C:/Users/hasan/OrderKing/orderking-customers/src/routes/checkout.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace loading state
content = content.replace(
  'if (isPending) return <CustomerShell><div className="p-6 text-muted">{t("common.loading")}</div></CustomerShell>;',
  `if (isPending) return (
    <CustomerShell>
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 w-1/3 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
        <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        <div className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
      </div>
    </CustomerShell>
  );`
);

// Inject precise GST details
content = content.replace(
  '<QuoteLines lines={quote.data.quote.lines} locale={locale} />',
  `<QuoteLines lines={quote.data.quote.lines} locale={locale} />
                <div className="mt-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-900/50">
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mb-1">
                     <span>GSTIN: 29GGGGG1314R9Z6</span>
                     <span>FSSAI: 11221334000192</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                     <span>CGST (2.5%)</span>
                     <span>Included in price</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                     <span>SGST (2.5%)</span>
                     <span>Included in price</span>
                  </div>
                </div>`
);

// Better button state
content = content.replace(
  '<Button className="mt-6 w-full" disabled={busy || !quote.data || !quote.data.isDeliverable} onClick={() => void submit()}>{busy ? t("checkout.placing") : "Secure Checkout via KingPay"}</Button>',
  `<Button className="mt-6 w-full h-14 text-lg font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95" disabled={busy || !quote.data || !quote.data.isDeliverable} onClick={() => void submit()}>
            {busy ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing Securely...
              </span>
            ) : "Place Order • " + formatPaise(totalPayable, { locale })}
          </Button>`
);

fs.writeFileSync(path, content, 'utf8');
