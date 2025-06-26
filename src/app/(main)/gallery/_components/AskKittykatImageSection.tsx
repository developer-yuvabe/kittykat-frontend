"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";

interface AskKittykatImageSectionProps {
  item: {
    asset_url?: string;
    asset_title?: string;
  };
  onEdit?: () => void;
  onAddVersion?: () => void;
}

export const AskKittykatImageSection: React.FC<
  AskKittykatImageSectionProps
> = ({ item, onEdit, onAddVersion }) => {
  return (
    <div className="flex-1 bg-gray-50 flex items-center justify-center p-6 relative">
      <div className="relative">
        <img
          src={item.asset_url || "/placeholder.svg"}
          alt={item.asset_title || "Image"}
          className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
        />
        <Button
          size="sm"
          className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-700"
          onClick={onEdit}
        >
          <Edit3 className="w-4 h-4 mr-1" />
          Edit
        </Button>
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
