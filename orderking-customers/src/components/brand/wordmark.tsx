import { Link } from "@tanstack/react-router";
import { useBrand } from "@/components/providers";
import { cn } from "@/lib/utils";

export function OrderKingMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8 shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ok-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D3B2E" />
          <stop offset="100%" stopColor="#051C16" />
        </linearGradient>
        <linearGradient id="ok-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="40%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="ok-sheen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Royal Shield / Squircle Base */}
      <rect width="32" height="32" rx="8" fill="url(#ok-bg)" />
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="7.25"
        stroke="url(#ok-gold)"
        strokeWidth="0.8"
        strokeOpacity="0.45"
      />
      <rect x="1" y="1" width="30" height="15" rx="7" fill="url(#ok-sheen)" />

      {/* Royal Spire Jewels */}
      <circle cx="7.5" cy="11.5" r="1.2" fill="url(#ok-gold)" />
      <circle cx="16" cy="8" r="1.5" fill="#FFFBEB" />
      <circle cx="16" cy="8" r="1.5" fill="url(#ok-gold)" fillOpacity="0.7" />
      <circle cx="24.5" cy="11.5" r="1.2" fill="url(#ok-gold)" />

      {/* Majestic Royal Crown Body */}
      <path
        d="M6.5 13.5L8.5 20.5C8.6 21 9 21.5 9.5 21.5H22.5C23 21.5 23.4 21 23.5 20.5L25.5 13.5L20.5 16.5L16 10L11.5 16.5L6.5 13.5Z"
        fill="url(#ok-gold)"
      />
      {/* Crown Base Arch Band */}
      <path
        d="M9 22.5H23C23.6 22.5 24 23 24 23.5C24 24 23.6 24.5 23 24.5H9C8.4 24.5 8 24 8 23.5C8 23 8.4 22.5 9 22.5Z"
        fill="url(#ok-gold)"
      />
      {/* Embedded Diamond Jewels */}
      <circle cx="12" cy="23.5" r="0.7" fill="#FFFFFF" />
      <circle cx="16" cy="23.5" r="0.8" fill="#FFFFFF" />
      <circle cx="20" cy="23.5" r="0.7" fill="#FFFFFF" />

      {/* Dynamic Fast-Delivery Lightning Crest */}
      <path
        d="M14.5 16.5L16.2 13.5L15.9 16.5H18.5L14.8 20.5L15.2 17.5H14.5Z"
        fill="#FFFFFF"
        fillOpacity="0.95"
      />
    </svg>
  );
}

export function BrandMark({ className }: { className?: string }) {
  const { brand } = useBrand();
  if (brand.logoUrl) {
    return <img loading="lazy" src={brand.logoUrl} alt="" className={cn("h-8 w-8 object-contain", className)} />;
  }
  return <OrderKingMark className={className} />;
}

export function Wordmark({ className }: { className?: string }) {
  const { brand } = useBrand();
  return (
    <Link
      to="/"
      className={cn("flex items-center gap-2.5 text-fg no-underline", className)}
      aria-label={brand.appName}
    >
      <BrandMark className="h-8 w-8 rounded-lg shadow-sm" />
      <span className="font-display text-xl font-black tracking-tight">
        Order<span className="text-amber-500">King</span>
      </span>
    </Link>
  );
}
