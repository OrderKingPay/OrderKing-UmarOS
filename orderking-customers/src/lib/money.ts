/** All money in this marketplace is integer paise. ₹1 = 100 paise. */

export const PAISE_PER_RUPEE = 100;

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * PAISE_PER_RUPEE);
}

export function applyBps(amountPaise: number, bps: number): number {
  if (bps <= 0 || amountPaise <= 0) return 0;
  return Math.floor((amountPaise * bps) / 10_000);
}

export function formatPaise(
  paise: number,
  opts?: { currency?: string; locale?: string; signed?: boolean; compact?: boolean },
): string {
  const currency = opts?.currency ?? "INR";
  // Enforce en-IN by default to ensure Indian numbering system (Lakhs, Crores)
  const locale = opts?.locale ?? "en-IN";
  const abs = Math.abs(paise) / PAISE_PER_RUPEE;
  
  const isCompact = opts?.compact && Math.abs(paise) % 100 === 0;

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: isCompact ? 0 : 2,
    maximumFractionDigits: isCompact ? 0 : 2,
  }).format(abs);

  if (paise < 0) return `−${formatted}`;
  if (opts?.signed && paise > 0) return `+${formatted}`;
  return formatted;
}

export function formatPaiseCompact(paise: number, locale = "en-IN"): string {
  return formatPaise(paise, { locale, compact: true });
}
