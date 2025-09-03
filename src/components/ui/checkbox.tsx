"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface CheckboxProps
  extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  variant?: "checkbox" | "toggle";
}

function Checkbox({
  className,
  variant = "checkbox",
  ...props
}: CheckboxProps) {
  if (variant === "toggle") {
    return (
      <CheckboxPrimitive.Root
        data-slot="toggle"
        className={cn(
          // Base toggle background
          "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors",
          // Focus states
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 dark:focus-visible:ring-blue-800",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Background colors
          "bg-gray-200 dark:bg-gray-700",
          "data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-600",
          // Pseudo-element for the thumb using after
          "after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600",
          // Thumb movement and checked state
          "data-[state=checked]:after:translate-x-full data-[state=checked]:after:border-white",
          // RTL support
          "rtl:data-[state=checked]:after:-translate-x-full",
          // Invalid state
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          className
        )}
        {...props}
      >
        {/* No indicator needed as we use CSS pseudo-element */}
      </CheckboxPrimitive.Root>
    );
  }

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
