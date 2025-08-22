"use client";

import React, { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import { ITEMS_PER_PAGE, useGalleryQuery } from "@/hooks/useGallery";
import { MediaGrid } from "../MediaGrid";
import { MediaGalleryStatusDisplay } from "../MediaGalleryStatusDisplay";
import { MediaBulkActions } from "../MediaBulkActions";
import type {
  BrandCampaignListResponse,
  EnhancedSelectedFilters,
} from "@/types/gallery.types";

interface FolderGalleryViewProps {
  selectedBrand: BrandCampaignListResponse["brands"][number] | null;
  selectedCampaignId?: string;
  searchQuery?: string;
  favorites?: boolean;
  selectedFilters?: EnhancedSelectedFilters;
  activeTab?: string;
}

export function FolderGalleryView({
  selectedBrand,
  selectedCampaignId,
  searchQuery = "",
  favorites = false,
  selectedFilters,
  activeTab = "all-media",
}: FolderGalleryViewProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Use gallery hook with proper filters
  const galleryActions = useGalleryQuery(
    {
      assetType: activeTab,
      favorites,
      source: activeTab,
      creator: "Anyone",
      searchQuery,
      selectedFilters: {
        // Merge provided filters with brand/campaign filters
        ...(selectedFilters || {
          moodboards: [],
          product_categories: [],
          asset_types: [],
          asset_sources: [],
          media_format: [],
          aspect_ratio: [],
          workflow_status: [],
          has_product: undefined,
          has_people: undefined,
          has_lifestyle_context: undefined,
          is_favourite: undefined,
          is_archived: undefined,
        }),
        // Apply brand and campaign filters when available
        brands: selectedBrand ? [selectedBrand.brand_id] : (selectedFilters?.brands || []),
        campaigns: selectedCampaignId ? [selectedCampaignId] : (selectedFilters?.campaigns || []),
      },
    },
    ITEMS_PER_PAGE,
    true,
    "FolderGalleryView"
  );

  // Intersection observer for infinite scroll
  const { ref, inView } = useInView();

  // Clear selected items when brand or campaign changes
  useEffect(() => {
    setSelectedItems([]);
  }, [selectedBrand, selectedCampaignId]);

  // Fetch next page when in view
  useEffect(() => {
    if (
      inView &&
      galleryActions.hasNextPage &&
      !galleryActions.isFetchingNextPage
    ) {
      galleryActions.fetchNextPage();
    }
  }, [
    inView,
    galleryActions.hasNextPage,
    galleryActions.isFetchingNextPage,
    galleryActions.fetchNextPage,
  ]);

  // Get the actual selected items data
  const selectedItemsData = galleryActions
    .getGalleryItems()
    .filter((item) => selectedItems.includes(item.id));

  const handleSelect = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedItems((prev) => [...prev, id]);
    } else {
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const handleUnselectAll = () => {
    setSelectedItems([]);
  };

  return (
    <div className="space-y-6">
      <MediaGalleryStatusDisplay
        galleryStatus={galleryActions.galleryStatus}
        galleryItemsLength={galleryActions.getGalleryItems().length}
      />

      {galleryActions.galleryStatus === "success" &&
        galleryActions.getGalleryItems().length > 0 && (
          <div>
            <MediaGrid
              selectedItems={selectedItems}
              onSelect={handleSelect}
              galleryActions={galleryActions}
            />
            {/* Infinite scroll loading indicator */}
            {galleryActions.hasNextPage && (
              <div ref={ref} className="flex justify-center items-center py-8">
                {galleryActions.isFetchingNextPage ? (
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                ) : (
                  <p className="text-sm text-gray-500">Load more</p>
                )}
              </div>
            )}
          </div>
        )}

      {selectedItems.length > 0 && (
        <MediaBulkActions
          selectedItems={selectedItemsData}
          onUnselectAll={handleUnselectAll}
          galleryActions={galleryActions}
          brandName={selectedBrand?.brand_name || "brand"}
        />
      )}
    </div>
  );
}
