import { Link } from "@tanstack/react-router";
import { Plane, GraduationCap, Briefcase, Activity } from "lucide-react";

const SHORTCUTS = [
  { label: "Travel", to: "/travel", Icon: Plane },
  { label: "AI Tutor", to: "/tutor", Icon: GraduationCap },
  { label: "Jobs", to: "/tutor-jobs", Icon: Briefcase },
] as const;

/** Small, accessible discovery row; only available destinations are linked. */
export function ServiceShortcuts({ emphasizeAlternatives = false }: { emphasizeAlternatives?: boolean }) {
  return (
    <nav aria-label="More OrderKing services"
      className={emphasizeAlternatives
        ? "rounded-2xl border border-amber-400 bg-amber-50 px-1 py-1.5 shadow-sm"
        : "rounded-2xl border border-stone-200 bg-white px-1 py-1.5 shadow-sm"}>
      <ul role="list" className="grid grid-cols-4 gap-0.5">
        {SHORTCUTS.map(({label,to,Icon}) => (
          <li key={label} className="min-w-0">
            <Link to={to as any} preload="intent"
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl p-1 text-center text-stone-800 no-underline hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500">
              <Icon className="size-4.5 text-amber-700" aria-hidden="true" />
              <span className="w-full truncate text-[10px] font-extrabold leading-tight">{label}</span>
            </Link>
          </li>
        ))}
        <li className="flex min-w-0 min-h-14 flex-col items-center justify-center gap-1 rounded-xl p-1 text-center text-stone-400" aria-label="Signals not launched">
          <Activity className="size-4.5" aria-hidden="true" />
          <span className="w-full truncate text-[10px] font-bold leading-tight">Signals · Soon</span>
        </li>
      </ul>
    </nav>
  );
}
