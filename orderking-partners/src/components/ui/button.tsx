import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[opacity,transform,background-color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-fuchsia-600 text-white hover:bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.4)] border border-fuchsia-400/50",
        secondary:
          "bg-white/5 text-white border border-white/10 hover:bg-white/10 shadow-inner shadow-white/5",
        outline:
          "bg-transparent text-white border border-white/20 hover:bg-white/5",
        ghost: "bg-transparent text-white hover:bg-white/10",
        danger: "bg-red-600/80 text-white border border-red-500/50 hover:bg-red-500/80 shadow-[0_0_15px_rgba(220,38,38,0.3)]",
        destructive: "bg-red-600/80 text-white border border-red-500/50 hover:bg-red-500/80 shadow-[0_0_15px_rgba(220,38,38,0.3)]",
        leaf: "bg-emerald-600/80 text-white border border-emerald-500/50 hover:bg-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]",
      },
      size: {
        sm: "h-9 min-h-9 px-3 text-xs rounded-[10px]",
        md: "h-11 min-h-11 px-4 text-sm rounded-[12px]",
        lg: "h-14 min-h-14 px-5 text-base rounded-[16px]",
        xl: "h-16 min-h-16 px-6 text-lg rounded-[20px]",
        icon: "size-11 rounded-[12px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
