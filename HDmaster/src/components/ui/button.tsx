import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import React, { type ButtonHTMLAttributes } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none select-none relative overflow-hidden",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:opacity-90 shadow-sm",
        default: "bg-primary text-primary-fg hover:opacity-90 shadow-sm",
        secondary: "bg-elevated text-fg border border-border hover:bg-surface shadow-sm",
        ghost: "text-fg hover:bg-elevated",
        danger: "bg-danger text-fg hover:opacity-90 shadow-sm",
        outline: "border border-border text-fg hover:bg-elevated",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-fg hover:bg-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-[8px]",
        md: "h-10 px-4 text-sm rounded-[10px]",
        lg: "h-12 px-5 text-base rounded-[12px]",
        icon: "size-10 rounded-[10px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "variant" | "size">,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
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
