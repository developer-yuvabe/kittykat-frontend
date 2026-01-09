"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
  selectedItems: string[];
}

export function FolderGalleryView({
  selectedBrandId,
  selectedCampaignId,
  searchQuery = "",
  favorites = false,
  selectedFilters,
  activeTab = "all-media",
  selectedItems,
  setSelectedItems,
}: FolderGalleryViewProps) {
  const { getSelectedBrand } = useBrandStore();
  const brand = useMemo(() => getSelectedBrand(), [selectedBrandId]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

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
        sub_folders: [],
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
  }, [selectedBrandId, selectedCampaignId, activeTab]);

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

  const items = useMemo(() => {
    const items = galleryActions.getGalleryItems();
    return items;
  }, [galleryActions]);

  const handleSelect = (id: string, selected: boolean, shiftKey?: boolean) => {
    // last selected item id (track with useState)
    const lastId = lastSelectedId;

    // --- SHIFT-CLICK RANGE SELECTION ---
    if (shiftKey && lastId && lastId !== id) {
      let include = false;
      const idsInRange: string[] = [];

      //  Traverse through items once
      for (const item of items) {
        if (item.id === lastId || item.id === id) {
          // Always include the boundary
          idsInRange.push(item.id);
          // Toggle inclusion
          include = !include;

          // If we’ve already passed both boundaries, stop
          if (!include) break;
        } else if (include) {
          // Include everything between lastId and id
          idsInRange.push(item.id);
        }
      }

      setSelectedItems((prev) => Array.from(new Set([...prev, ...idsInRange])));
      setLastSelectedId(id); // store for next shift-click
      return;
    }

    // --- NORMAL CLICK ---
    setSelectedItems((prev) =>
      selected ? [...prev, id] : prev.filter((itemId) => itemId !== id)
    );

    setLastSelectedId(id); // always update last clicked
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
        isFetchingNextPage={galleryActions.isFetchingNextPage}
      />

      {/* Gallery content area with minimum height to prevent layout shift */}
      <div className="min-h-[400px]">
        {galleryActions.galleryStatus === "success" &&
          galleryActions.getGalleryItems().length > 0 && (
            <div>
              <SortableMediaGrid
                selectedItems={selectedItems}
                onSelect={handleSelect}
                onClearSelection={handleUnselectAll}
                galleryActions={galleryActions}
                enableDragToMove={true}
                activeTab={activeTab}
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
          totalItems={galleryActions.totalItems}
          fetchedItemsCount={galleryActions.getGalleryItems().length}
          galleryFilters={{
            assetType: activeTab,
            favorites,
            source: activeTab,
            searchQuery,
            selectedFilters,
          }}
        />
      )}
    </div>
  );
}
