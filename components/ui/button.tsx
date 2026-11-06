import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-primary)] text-white shadow-[0_8px_18px_-8px_rgba(15,76,129,0.7)] hover:bg-[var(--color-primary-hover)]",
        outline:
          "border border-[var(--color-border)] bg-white text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)]",
        ghost: "text-[var(--color-text)] hover:bg-[var(--color-surface)]",
        danger: "text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
