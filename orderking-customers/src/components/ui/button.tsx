import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import React, { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[opacity,transform,background-color] duration-[var(--motion-fast,250ms)] ease-[var(--ease-smooth-out,cubic-bezier(0.22,1,0.36,1))] disabled:pointer-events-none disabled:opacity-50 min-h-11 relative overflow-hidden",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:opacity-92 shadow-sm",
        secondary: "bg-surface-2 text-fg hover:bg-surface shadow-sm",
        outline: "border border-border bg-surface text-fg hover:bg-surface-2",
        ghost: "text-fg hover:bg-surface-2",
        danger: "bg-danger text-primary-fg hover:opacity-92 shadow-sm",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-fg hover:bg-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]",
      },
      size: {
        md: "rounded-[var(--radius-md)] px-4 text-sm",
        lg: "rounded-[var(--radius-lg)] px-5 text-base",
        sm: "min-h-9 rounded-[var(--radius-sm)] px-3 text-sm",
        icon: "size-11 rounded-full p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "variant" | "size" | "asChild">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size }), className)}
          ref={ref as any}
          {...(props as any)}
        />
      );
    }
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
