"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import ZoomableImage from "@/components/ui/zoomable-image";

interface AskKittykatImageSectionProps {
  item: {
    asset_url?: string;
    asset_title?: string;
  };
  onAddVersion?: () => void;
}

export const AskKittykatImageSection: React.FC<
  AskKittykatImageSectionProps
> = ({ item, onAddVersion }) => {
  return (
    <div className="flex-1 bg-gray-50 flex items-center justify-center p-6 relative">
      <div className="relative">
        <ZoomableImage
          src={item.asset_url}
          key={item.asset_url}
          className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg"
        />
      </div>

      <div className="absolute bottom-6 left-6 text-sm text-gray-600">
        Version 1 | Version 2 |{" "}
        <Button
          variant="ghost"
          size="sm"
          className="p-0 h-auto"
          onClick={onAddVersion}
        >
          +
        </Button>
      </div>
    </div>
  );
};
