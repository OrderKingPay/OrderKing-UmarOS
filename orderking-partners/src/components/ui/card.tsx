import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-2xl)] border border-white/10 bg-white/5 p-4 shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-xl text-white",
        className,
      )}
      {...props}
    />
  );
}
