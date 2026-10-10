import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../cn";

// Adapted from the retained official shadcn/ui new-york Button registry source (MIT).
const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717] disabled:pointer-events-none disabled:bg-[#ebebeb] disabled:text-[#8f8f8f]",
  {
    variants: {
      variant: {
        default: "bg-[#006bff] text-white hover:bg-[#0059d1]",
        outline: "border border-[#d8d8d8] bg-white text-[#171717] hover:bg-[#f5f5f5]",
        secondary: "bg-[#f1f1f1] text-[#171717] hover:bg-[#e8e8e8]",
        ghost: "text-[#565656] hover:bg-[#f1f1f1] hover:text-[#171717]",
        danger: "border border-[#f1c4c8] bg-white text-[#b4232f] hover:bg-[#fff5f5]",
      },
      size: { default: "", sm: "min-h-9 px-3 text-xs", icon: "size-10 px-0" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return <Component ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  },
);
Button.displayName = "Button";
