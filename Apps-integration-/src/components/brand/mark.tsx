export function OrderKingMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
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
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#ok-bg)" />
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7.25" stroke="url(#ok-gold)" strokeWidth="0.8" strokeOpacity="0.45" />
      <circle cx="7.5" cy="11.5" r="1.2" fill="url(#ok-gold)" />
      <circle cx="16" cy="8" r="1.5" fill="url(#ok-gold)" />
      <circle cx="24.5" cy="11.5" r="1.2" fill="url(#ok-gold)" />
      <path d="M6.5 13.5L8.5 20.5C8.6 21 9 21.5 9.5 21.5H22.5C23 21.5 23.4 21 23.5 20.5L25.5 13.5L20.5 16.5L16 10L11.5 16.5L6.5 13.5Z" fill="url(#ok-gold)" />
      <path d="M9 22.5H23C23.6 22.5 24 23 24 23.5C24 24 23.6 24.5 23 24.5H9C8.4 24.5 8 24 8 23.5C8 23 8.4 22.5 9 22.5Z" fill="url(#ok-gold)" />
      <path d="M14.5 16.5L16.2 13.5L15.9 16.5H18.5L14.8 20.5L15.2 17.5H14.5Z" fill="#FFFFFF" fillOpacity="0.95" />
    </svg>
  );
}
