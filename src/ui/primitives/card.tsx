import * as React from "react";
import { cn } from "../cn";

// Adapted from the retained official shadcn/ui new-york Card registry source (MIT).
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <section ref={ref} className={cn("rounded-xl border border-[#e5e5e5] bg-white", className)} {...props} />,
);
Card.displayName = "Card";

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
  <div className={cn("space-y-1 border-b border-[#ededed] px-5 py-4 sm:px-6", className)} {...props} />;
export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) =>
  <h2 className={cn("text-base font-semibold tracking-tight text-[#171717]", className)} {...props} />;
export const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) =>
  <p className={cn("text-sm leading-6 text-[#686868]", className)} {...props} />;
export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
  <div className={cn("px-5 py-5 sm:px-6", className)} {...props} />;
