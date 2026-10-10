import * as React from "react";
import { cn } from "@/lib/utils";
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";
export { Input };
