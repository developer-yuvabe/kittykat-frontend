"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CreateCampaignDialog } from "@/components/gallery/CreateCampaignDialog";

interface CampaignSidebarHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  brandId: string;
  brandName: string;
  onCampaignCreated: (campaignId: string) => void;
}

export function CampaignSidebarHeader({
  searchQuery,
  onSearchChange,
  brandId,
  brandName,
  onCampaignCreated,
}: CampaignSidebarHeaderProps) {
  return (
    <div className="p-3 border-b border-gray-200 flex justify-center items-center gap-2">
      <div className="relative w-2/3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search campaigns..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>
      <div className="w-1/3 flex justify-center">
        <CreateCampaignDialog
          brandId={brandId}
          brandName={brandName}
          onCampaignCreated={onCampaignCreated}
        />
      </div>
    </div>
  );
}
