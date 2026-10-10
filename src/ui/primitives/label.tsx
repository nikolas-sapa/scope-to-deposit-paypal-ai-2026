"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../cn";

// Adapted from the retained official shadcn/ui new-york Label registry source (MIT).
export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn("block text-sm font-medium text-[#242424]", className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;
