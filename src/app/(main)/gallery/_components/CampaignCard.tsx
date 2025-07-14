"use client";

import type React from "react";

import type { Campaign } from "@/types/gallery.types";
import { ChevronDown, Folder } from "lucide-react";
import { useCallback } from "react";

// Campaign Card Component
export const CampaignCard = ({
  campaign,
  onSelect,
}: {
  campaign: Campaign;
  onSelect: (campaignId: string) => void;
}) => {
  // Memoize the click handler to prevent closure issues
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Campaign card clicked:", campaign.id, campaign.title); // Debug log
      onSelect(campaign.id);
    },
    [campaign.id, onSelect]
  );

  return (
    <div
      onClick={handleClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-purple-300 transition-all duration-200 cursor-pointer group"
      data-campaign-id={campaign.id}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
            <Folder className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-end">
          <div className="flex-1" />
          <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-700 mt-2">
            {campaign.title}
          </h3>
        </div>
        <div className="flex-shrink-0">
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors rotate-[-90deg]" />
        </div>
      </div>
    </div>
  );
};
