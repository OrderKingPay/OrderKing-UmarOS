import { cn } from "@/lib/utils";

export function KingPayMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8 shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="kp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B1D16" />
          <stop offset="100%" stopColor="#050E0B" />
        </linearGradient>
        <linearGradient id="kp-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="kp-glow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Royal Medallion Shield Base */}
      <rect width="32" height="32" rx="8" fill="url(#kp-bg)" />
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="7.25"
        stroke="url(#kp-gold)"
        strokeWidth="1"
      />
      <rect x="1" y="1" width="30" height="15" rx="7" fill="url(#kp-glow)" />

      {/* Mini Crown over Payment Monogram */}
      <path
        d="M10.5 9.5L12 11.5L16 8L20 11.5L21.5 9.5L21 13H11L10.5 9.5Z"
        fill="url(#kp-gold)"
      />
      <circle cx="10.5" cy="8.8" r="0.8" fill="#FEF08A" />
      <circle cx="16" cy="7.2" r="1.1" fill="#FFFFFF" />
      <circle cx="21.5" cy="8.8" r="0.8" fill="#FEF08A" />

      {/* Bold Instant-Pay Lightning "KP" Chevron Glyph */}
      <path
        d="M9 14.5C9 14.2 9.2 14 9.5 14H12C12.55 14 13 14.45 13 15V24.5C13 24.8 12.8 25 12.5 25H9.5C9.2 25 9 24.8 9 24.5V14.5Z"
        fill="url(#kp-gold)"
      />
      <path
        d="M13 14.5H17.8C19.8 14.5 21.2 15.7 21.2 17.3C21.2 18.9 19.8 20.1 17.8 20.1H15.2L18.8 24.8C19 25 18.8 25.4 18.5 25.4H15.8L13 21.8V14.5Z"
        fill="url(#kp-gold)"
      />
      {/* Dynamic Pure White Fast-Pay Lightning Bolt */}
      <path
        d="M17.2 15.5L14.5 19H17.5L15.8 23L20 18H17.2L18.2 15.5H17.2Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function KingPayWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <KingPayMark className="h-7 w-7" />
      <span className="font-display text-lg font-black tracking-tight text-fg">
        King<span className="text-amber-500">Pay</span>
      </span>
    </div>
  );
}
