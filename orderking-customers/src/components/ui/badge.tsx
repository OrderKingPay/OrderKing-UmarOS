
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "primary" | "warn" | "danger" | "success" }) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    primary: "bg-primary/10 text-primary",
    warn: "bg-warn/15 text-warn",
    danger: "bg-danger/10 text-danger",
    success: "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
