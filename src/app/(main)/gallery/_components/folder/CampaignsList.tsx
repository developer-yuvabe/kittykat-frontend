"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Folder, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "../CampaignCard";
import { CreateCampaignDialog } from "@/components/gallery/CreateCampaignDialog";
import { useBrandStore } from "@/store/brand.store";

interface CampaignsListProps {
  selectedBrandId: string | null;
  onCampaignSelect: (campaignId: string) => void;
  onRefreshData?: () => void;
}

export function CampaignsList({
  selectedBrandId,
  onCampaignSelect,
  onRefreshData,
}: CampaignsListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { brands } = useBrandStore();

  const { campaigns, brandName } = useMemo(() => {
    const brand = brands.find((b) => b.id === selectedBrandId);

    return {
      campaigns: brand ? brand.campaigns : [],
      brandName: brand?.name ?? "Brand",
    };
  }, [brands]);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      return () => container.removeEventListener("scroll", updateScrollButtons);
    }
  }, [campaigns]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  if (!selectedBrandId) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {brandName} Campaigns
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {campaigns.length} campaigns
          </span>
          <CreateCampaignDialog
            brandId={selectedBrandId}
            brandName={brandName}
            onCampaignCreated={onCampaignSelect}
            onRefreshData={onRefreshData}
          />
        </div>
      </div>

      {campaigns.length > 0 ? (
        <div className="relative">
          {/* Left Arrow */}
          {canScrollLeft && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md hover:bg-gray-50 rounded-full h-8 w-8 p-0"
              onClick={scrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Right Arrow */}
          {canScrollRight && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md hover:bg-gray-50 rounded-full h-8 w-8 p-0"
              onClick={scrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {campaigns.map((campaign) => (
              <div key={`campaign-${campaign.id}`} className="flex-shrink-0">
                <CampaignCard campaign={campaign} onSelect={onCampaignSelect} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            No campaigns found for this brand
          </p>
          <CreateCampaignDialog
            brandId={selectedBrandId}
            brandName={brandName}
            onCampaignCreated={onCampaignSelect}
            onRefreshData={onRefreshData}
            trigger={
              <Button variant="outline" size="sm">
                Create Your First Campaign
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
