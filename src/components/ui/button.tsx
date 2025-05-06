import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  loading = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <div>
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
        {loading && (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              <rect x="11" y="1" width="2" height="5" opacity=".14" />
              <rect
                x="11"
                y="1"
                width="2"
                height="5"
                transform="rotate(30 12 12)"
                opacity=".29"
              />
              <rect
                x="11"
                y="1"
                width="2"
                height="5"
                transform="rotate(60 12 12)"
                opacity=".43"
              />
              <rect
                x="11"
                y="1"
                width="2"
                height="5"
                transform="rotate(90 12 12)"
                opacity=".57"
              />
              <rect
                x="11"
                y="1"
                width="2"
                height="5"
                transform="rotate(120 12 12)"
                opacity=".71"
              />
              <rect
                x="11"
                y="1"
                width="2"
                height="5"
                transform="rotate(150 12 12)"
                opacity=".86"
              />
              <rect
                x="11"
                y="1"
                width="2"
                height="5"
                transform="rotate(180 12 12)"
              />
              <animateTransform
                attributeName="transform"
                type="rotate"
                calcMode="discrete"
                dur="0.75s"
                values="0 12 12;30 12 12;60 12 12;90 12 12;120 12 12;150 12 12;180 12 12;210 12 12;240 12 12;270 12 12;300 12 12;330 12 12;360 12 12"
                repeatCount="indefinite"
              />
            </g>
          </svg>
        )}
      </Comp>
    </div>
  );
}

export { Button, buttonVariants };
