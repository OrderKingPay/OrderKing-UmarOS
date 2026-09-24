export function OrderKingMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hd-ok-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D3B2E" />
          <stop offset="100%" stopColor="#051C16" />
        </linearGradient>
        <linearGradient id="hd-ok-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="40%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="hd-ok-sheen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Royal Shield / Squircle Base */}
      <rect width="32" height="32" rx="8" fill="url(#hd-ok-bg)" />
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="7.25"
        stroke="url(#hd-ok-gold)"
        strokeWidth="0.8"
        strokeOpacity="0.45"
      />
      <rect x="1" y="1" width="30" height="15" rx="7" fill="url(#hd-ok-sheen)" />

      {/* Royal Spire Jewels */}
      <circle cx="7.5" cy="11.5" r="1.2" fill="url(#hd-ok-gold)" />
      <circle cx="16" cy="8" r="1.5" fill="#FFFBEB" />
      <circle cx="16" cy="8" r="1.5" fill="url(#hd-ok-gold)" fillOpacity="0.7" />
      <circle cx="24.5" cy="11.5" r="1.2" fill="url(#hd-ok-gold)" />

      {/* Majestic Royal Crown Body */}
      <path
        d="M6.5 13.5L8.5 20.5C8.6 21 9 21.5 9.5 21.5H22.5C23 21.5 23.4 21 23.5 20.5L25.5 13.5L20.5 16.5L16 10L11.5 16.5L6.5 13.5Z"
        fill="url(#hd-ok-gold)"
      />
      {/* Crown Base Arch Band */}
      <path
        d="M9 22.5H23C23.6 22.5 24 23 24 23.5C24 24 23.6 24.5 23 24.5H9C8.4 24.5 8 24 8 23.5C8 23 8.4 22.5 9 22.5Z"
        fill="url(#hd-ok-gold)"
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

export function KingPayMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hd-kp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B1D16" />
          <stop offset="100%" stopColor="#050E0B" />
        </linearGradient>
        <linearGradient id="hd-kp-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#hd-kp-bg)" />
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="7.25"
        stroke="url(#hd-kp-gold)"
        strokeWidth="1"
      />
      <path
        d="M10.5 9.5L12 11.5L16 8L20 11.5L21.5 9.5L21 13H11L10.5 9.5Z"
        fill="url(#hd-kp-gold)"
      />
      <circle cx="10.5" cy="8.8" r="0.8" fill="#FEF08A" />
      <circle cx="16" cy="7.2" r="1.1" fill="#FFFFFF" />
      <circle cx="21.5" cy="8.8" r="0.8" fill="#FEF08A" />
      <path
        d="M9 14.5C9 14.2 9.2 14 9.5 14H12C12.55 14 13 14.45 13 15V24.5C13 24.8 12.8 25 12.5 25H9.5C9.2 25 9 24.8 9 24.5V14.5Z"
        fill="url(#hd-kp-gold)"
      />
      <path
        d="M13 14.5H17.8C19.8 14.5 21.2 15.7 21.2 17.3C21.2 18.9 19.8 20.1 17.8 20.1H15.2L18.8 24.8C19 25 18.8 25.4 18.5 25.4H15.8L13 21.8V14.5Z"
        fill="url(#hd-kp-gold)"
      />
      <path
        d="M17.2 15.5L14.5 19H17.5L15.8 23L20 18H17.2L18.2 15.5H17.2Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/** @deprecated Use OrderKingMark instead */
export const OrderKingMark = OrderKingMark;
