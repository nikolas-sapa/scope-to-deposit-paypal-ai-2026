import * as React from "react";
import { cn } from "../cn";

// Adapted from the retained official shadcn/ui new-york Textarea registry source (MIT).
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn("field-control min-h-28 w-full px-3 py-2.5 leading-6", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";
