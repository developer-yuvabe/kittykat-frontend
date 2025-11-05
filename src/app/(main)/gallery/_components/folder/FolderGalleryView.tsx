"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import { ITEMS_PER_PAGE, useGalleryQuery } from "@/hooks/useGallery";
import { SortableMediaGrid } from "../SortableMediaGrid";
import { MediaGalleryStatusDisplay } from "../MediaGalleryStatusDisplay";
import { MediaBulkActions } from "../MediaBulkActions";
import type { EnhancedSelectedFilters } from "@/types/gallery.types";
import { useBrandStore } from "@/store/brand.store";

interface FolderGalleryViewProps {
  selectedBrandId?: string | null;
  selectedCampaignId?: string;
  searchQuery?: string;
  favorites?: boolean;
  selectedFilters?: EnhancedSelectedFilters;
  activeTab?: string;
}

export function FolderGalleryView({
  selectedBrandId,
  selectedCampaignId,
  searchQuery = "",
  favorites = false,
  selectedFilters,
  activeTab = "all-media",
}: FolderGalleryViewProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { getSelectedBrand } = useBrandStore();
  const brand = useMemo(() => getSelectedBrand(), [selectedBrandId]);

  // Use gallery hook with proper filters
  const galleryActions = useGalleryQuery(
    {
      assetType: activeTab,
      favorites,
      source: activeTab,
      searchQuery,
      selectedFilters: {
        // Start with base filters
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
        // Merge provided filters but preserve the structure
        ...(selectedFilters || {}),
        // Force brand and campaign filters based on current selection
        // This ensures the URL state takes precedence over any other filters
        brands: selectedBrandId
          ? [selectedBrandId]
          : selectedFilters?.brands || [],
        campaigns: selectedCampaignId
          ? [selectedCampaignId]
          : selectedFilters?.campaigns || [],
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
  }, [selectedBrandId, selectedCampaignId]);

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

  const handleSelectAll = () => {
    const allIds = galleryActions.getGalleryItems().map((item) => item.id);
    setSelectedItems(allIds);
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

      {/* Gallery content area with minimum height to prevent layout shift */}
      <div className="min-h-[400px]">
        {galleryActions.galleryStatus === "success" &&
          galleryActions.getGalleryItems().length > 0 && (
            <div>
              <SortableMediaGrid
                selectedItems={selectedItems}
                onSelect={handleSelect}
                galleryActions={galleryActions}
              />
              {/* Infinite scroll loading indicator */}
              {galleryActions.hasNextPage && (
                <div
                  ref={ref}
                  className="flex justify-center items-center py-8"
                >
                  {galleryActions.isFetchingNextPage ? (
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  ) : (
                    <p className="text-sm text-gray-500">Load more</p>
                  )}
                </div>
              )}
            </div>
          )}
      </div>

      {selectedItems.length > 0 && (
        <MediaBulkActions
          selectedItems={selectedItemsData}
          onUnselectAll={handleUnselectAll}
          onSelectAll={handleSelectAll}
          galleryActions={galleryActions}
          brandName={brand?.name ?? "Brand"}
        />
      )}
    </div>
  );
}
