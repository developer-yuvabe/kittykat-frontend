"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Copy } from "lucide-react";
import { PinIcon } from "@/components/ui/custom-icon";

// Skeleton CSS styles
const skeletonStyles = `
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }

  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%);
    background-size: 400px 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-text {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%);
    background-size: 400px 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: 4px;
    height: 1em;
  }
`;

export interface SubSectionCardProps {
  label: string;
  children?: React.ReactNode;
  isLoading?: boolean;
}

export const SubSectionCard: React.FC<SubSectionCardProps> = ({
  label,
  children,
  isLoading = false,
}) => {
  return (
    <>
      <style>{skeletonStyles}</style>
      <Card className="my-4 border border-gray-300">
        <CardHeader className="flex flex-row items-center justify-between">
          {isLoading ? (
            <div className="skeleton-text w-24 h-4"></div>
          ) : (
            <h4 className="font-medium text-sm">{label}</h4>
          )}
          {!isLoading && (
            <div className="flex justify-center space-x-2">
              <TooltipIconButton tooltip="Copy" side="top">
                <Copy size={16} />
              </TooltipIconButton>
              <TooltipIconButton tooltip="Pin" side="top">
                <PinIcon size={16} />
              </TooltipIconButton>
            </div>
          )}
        </CardHeader>
        <CardContent className="px-4">
          {isLoading ? (
            <div className="skeleton h-10 rounded-md" />
          ) : (
            <div className="bg-gray-100 h-10 rounded-md px-3 py-2 text-sm text-gray-600 flex items-center">
              {children}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
