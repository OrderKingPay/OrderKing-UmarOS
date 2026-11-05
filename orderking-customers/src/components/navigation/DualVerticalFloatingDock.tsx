import React from 'react';
import {
  resolveDualVerticalFloatingDock,
  type ActiveVertical,
} from '../../lib/navigation/customer-zomato-kingpay-core';

export function DualVerticalFloatingDock({ activeVertical = 'orderking' }: { activeVertical?: ActiveVertical }) {
  const tabs = resolveDualVerticalFloatingDock(activeVertical);

  return (
    <nav
      aria-label="OrderKing Dual-Vertical Dock"
      className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur"
    >
      {tabs.map((tab) => (
        <a
          key={tab.id}
          href={tab.href}
          className={`rounded-full px-5 py-2 text-xs font-extrabold transition ${
            tab.isActive
              ? 'bg-emerald-500 text-slate-950 shadow'
              : 'text-slate-300 hover:bg-slate-900 hover:text-white'
          }`}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}

export default DualVerticalFloatingDock;