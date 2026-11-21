export function OrderKingMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#E23744" />
      {/* Clean Restaurant Cutlery Emblem */}
      <path
        d="M10 8V14C10 15.1 10.9 16 12 16V24H14V16C15.1 16 16 15.1 16 14V8H14.5V12.5H13.5V8H12.5V12.5H11.5V8H10Z"
        fill="white"
      />
      <path
        d="M20 8C18.3 8 17 9.8 17 12C17 13.8 18 15.3 19.3 15.8V24H21.3V15.8C22.6 15.3 23.6 13.8 23.6 12C23.6 9.8 22.3 8 20 8Z"
        fill="white"
      />
    </svg>
  );
}

/** @deprecated Use OrderKingMark instead */


