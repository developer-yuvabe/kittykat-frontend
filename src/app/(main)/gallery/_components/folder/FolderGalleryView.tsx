"use client";

import React, { useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import { GalleryActions } from "@/hooks/useGallery";
import { SortableMediaGrid } from "../SortableMediaGrid";
import { MediaGalleryStatusDisplay } from "../MediaGalleryStatusDisplay";
import { MediaBulkActions } from "../MediaBulkActions";
import type { EnhancedSelectedFilters } from "@/types/gallery.types";
import { useBrandStore } from "@/store/brand.store";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";
import { toast } from "sonner";

interface FolderGalleryViewProps {
  selectedBrandId?: string | null;
  selectedCampaignId?: string;
  searchQuery?: string;
  favorites?: boolean;
  selectedFilters?: EnhancedSelectedFilters;
  activeTab?: string;
  isMediaSelectDialog?: boolean;
  isMultiSelect?: boolean;
  maxSelectionCount?: number;
  inSelectionGalleryIds?: string[];
  onMediaItemSelected?: (url: string) => void;
  onFullMediaItemSelected?: (item: any) => void;
  galleryActions: GalleryActions;
}

export function FolderGalleryView({
  selectedBrandId,
  selectedCampaignId,
  searchQuery = "",
  favorites = false,
  selectedFilters,
  activeTab = "all-media",
  isMediaSelectDialog = false,
  isMultiSelect = false,
  maxSelectionCount,
  inSelectionGalleryIds = [],
  onMediaItemSelected,
  onFullMediaItemSelected,
  galleryActions,
}: FolderGalleryViewProps) {
  const { getSelectedBrand } = useBrandStore();
  const brand = useMemo(() => getSelectedBrand(), [selectedBrandId]);

  // Get selection state from store
  const {
    selectedItems,
    setSelectedItems,
    multiSelectItems,
    setMultiSelectItems,
    lastSelectedId,
    setLastSelectedId,
    clearSelection,
    selectAllMode,
    excludedItems,
    setExcludedItems,
    setSelectAllMode,
    setTotalItemsCount,
    totalItemsCount,
  } = useGalleryFilterStore();

  // Intersection observer for infinite scroll
  const { ref, inView } = useInView();

  // Clear selected items when brand or campaign changes
  useEffect(() => {
    clearSelection();
  }, [selectedBrandId, selectedCampaignId, activeTab, clearSelection]);

  // Update totalItemsCount in store when it changes
  useEffect(() => {
    setTotalItemsCount(galleryActions.totalItems);
  }, [galleryActions.totalItems, setTotalItemsCount]);

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

  // Auto-select newly fetched items when in select-all mode
  useEffect(() => {
    if (selectAllMode !== "none") {
      // When in select-all mode, mark all loaded items as selected except those in excludedItems
      const newSelectedItems = items
        .filter((item) => !excludedItems.includes(item.id))
        .map((item) => item.id);

      // Only update if there's a meaningful change
      if (
        JSON.stringify(newSelectedItems.sort()) !==
        JSON.stringify([...selectedItems].sort())
      ) {
        setSelectedItems(newSelectedItems);
      }
    }
  }, [items.length, selectAllMode, excludedItems.length]);

  // Determine current selected items list
  const currentSelectedItems = isMultiSelect ? multiSelectItems : selectedItems;

  const handleSelect = (id: string, selected: boolean, shiftKey?: boolean) => {
    // Check for single select mode dialog close
    if (isMediaSelectDialog && !isMultiSelect && selected) {
      const item = items.find((i) => i.id === id);
      if (item) {
        onMediaItemSelected?.(item.asset_url);
        onFullMediaItemSelected?.(item);
        return;
      }
    }

    // last selected item id (track with useState)
    const lastId = lastSelectedId;

    const addToSelection = (ids: string[]) => {
      if (isMultiSelect) {
        setMultiSelectItems((prev) => Array.from(new Set([...prev, ...ids])));
      } else {
        setSelectedItems((prev) => Array.from(new Set([...prev, ...ids])));
      }
    };

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

      addToSelection(idsInRange);
      setLastSelectedId(id); // store for next shift-click
      return;
    }

    // --- NORMAL CLICK ---
    if (isMultiSelect) {
      if (selected) {
        // Check if adding this item would exceed maxSelectionCount
        const totalSelectedCount =
          multiSelectItems.length + (inSelectionGalleryIds?.length || 0);

        if (
          maxSelectionCount !== undefined &&
          totalSelectedCount >= maxSelectionCount
        ) {
          toast.warning(
            `Maximum selection limit reached (${maxSelectionCount} items)`,
            {
              description:
                "Please deselect an item before selecting a new one.",
            }
          );
          return;
        }
        setMultiSelectItems((prev) => [...prev, id]);
      } else {
        setMultiSelectItems((prev) => prev.filter((itemId) => itemId !== id));
      }
    } else {
      setSelectedItems((prev) =>
        selected ? [...prev, id] : prev.filter((itemId) => itemId !== id)
      );
    }

    // Handle exclusions if in select-all mode
    if (selectAllMode !== "none") {
      if (selected) {
        // Remove from exclusions if selecting
        setExcludedItems((prev) => prev.filter((itemId) => itemId !== id));
      } else {
        // Add to exclusions if deselecting
        setExcludedItems((prev) => [...prev, id]);
      }
    }

    setLastSelectedId(id); // always update last clicked
  };

  const handleSelectAll = () => {
    const allIds = galleryActions.getGalleryItems().map((item) => item.id);
    if (isMultiSelect) {
      setMultiSelectItems(allIds);
    } else {
      setSelectedItems(allIds);
    }
  };

  const handleUnselectAll = () => {
    if (isMultiSelect) {
      setMultiSelectItems([]);
    } else {
      clearSelection();
    }
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
                selectedItems={currentSelectedItems}
                onSelect={handleSelect}
                onClearSelection={handleUnselectAll}
                galleryActions={galleryActions}
                enableDragToMove={!isMediaSelectDialog}
                activeTab={activeTab}
                isMediaSelectDialog={isMediaSelectDialog}
                isMultiSelect={isMultiSelect}
                inSelectionGalleryIds={inSelectionGalleryIds}
                maxSelectionCount={maxSelectionCount}
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

      {currentSelectedItems.length > 0 && (
        <MediaBulkActions
          selectedItems={selectedItemsData}
          onUnselectAll={handleUnselectAll}
          onSelectAll={handleSelectAll}
          galleryActions={galleryActions}
          brandName={brand?.name ?? "Brand"}
          totalItems={totalItemsCount}
          fetchedItemsCount={galleryActions.getGalleryItems().length}
          selectAllMode={selectAllMode}
          excludedItems={excludedItems}
          onSelectAllModeChange={setSelectAllMode}
          onExcludedItemsChange={setExcludedItems}
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
