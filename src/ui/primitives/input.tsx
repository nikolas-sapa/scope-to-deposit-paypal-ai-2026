import * as React from "react";
import { cn } from "../cn";

// Adapted from the retained official shadcn/ui new-york Input registry source (MIT).
export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn("field-control h-11 w-full px-3", className)} {...props} />
  ),
);
Input.displayName = "Input";
