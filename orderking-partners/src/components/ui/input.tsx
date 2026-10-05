import type { HTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[var(--radius-xl)] border border-white/10 bg-white/5 px-3 text-base text-white placeholder:text-zinc-500 shadow-inner shadow-white/5 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none transition-all",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-[var(--radius-xl)] border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder:text-zinc-500 shadow-inner shadow-white/5 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none transition-all",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: HTMLAttributes<HTMLLabelElement> & { htmlFor?: string }) {
  return (
    <label className={cn("mb-1 block text-sm font-medium text-zinc-400", className)} {...props} />
  );
}
