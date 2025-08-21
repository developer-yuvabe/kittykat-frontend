"use client";

import React from "react";
import { Folder } from "lucide-react";
import { CampaignCard } from "../CampaignCard";
import type { BrandCampaignListResponse } from "@/types/gallery.types";

interface CampaignsListProps {
  selectedBrand: BrandCampaignListResponse["brands"][number] | null;
  onCampaignSelect: (campaignId: string) => void;
}

export function CampaignsList({
  selectedBrand,
  onCampaignSelect,
}: CampaignsListProps) {
  if (!selectedBrand) {
    return null;
  }

  const campaigns = selectedBrand.campaigns || [];

  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedBrand.brand_name} Campaigns
          </h3>
          <p className="text-sm text-gray-500">{campaigns.length} campaigns</p>
        </div>
        {campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={`campaign-${campaign.id}`}
                campaign={campaign}
                onSelect={onCampaignSelect}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No campaigns found for this brand</p>
          </div>
        )}
      </div>
    </div>
  );
}
