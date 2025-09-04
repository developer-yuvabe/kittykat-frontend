"use client";

import { forwardRef } from "react";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface TooltipButtonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  tooltip: string;
  side?: "top" | "bottom" | "left" | "right";
  /** Icon component to render */
  icon: React.ReactNode;
  /** Size of the icon */
  size?: "sm" | "md" | "lg";
  /** Whether the icon is in active/filled state */
  isActive?: boolean;
  /** Color for normal state */
  normalColor?: string;
  /** Color for active/filled state */
  activeColor?: string;
}

export const TooltipButton = forwardRef<HTMLDivElement, TooltipButtonProps>(
  (
    {
      tooltip,
      side = "bottom",
      icon,
      size = "md",
      isActive = false,
      normalColor = "text-white hover:text-gray-300",
      activeColor = "text-red-500",
      className,
      onClick,
      ...rest
    },
    ref
  ) => {
    const iconSizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={ref}
              onClick={onClick}
              className={cn(
                "cursor-pointer transition-colors duration-200",
                isActive ? activeColor : normalColor,
                className
              )}
              {...rest}
            >
              <div className={cn(iconSizeClasses[size])}>{icon}</div>
              <span className="sr-only">{tooltip}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side={side}>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

TooltipButton.displayName = "TooltipButton";
