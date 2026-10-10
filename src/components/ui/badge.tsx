import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-destructive/20 bg-destructive/15 text-destructive dark:bg-destructive/25 dark:text-red-300",
        outline: "text-foreground border-border",
        success:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300",
        warning:
          "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:bg-amber-500/25 dark:text-amber-300",
        info:
          "border-blue-500/30 bg-blue-500/15 text-blue-700 dark:bg-blue-500/25 dark:text-blue-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
