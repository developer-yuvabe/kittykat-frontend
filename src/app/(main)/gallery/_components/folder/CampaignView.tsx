"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { ArrowLeft, Folder, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryActions } from "@/hooks/useGallery";
import { SortableMediaGrid } from "../SortableMediaGrid";
import { MediaGalleryStatusDisplay } from "../MediaGalleryStatusDisplay";
import { MediaBulkActions } from "../MediaBulkActions";
import { FolderUploadDropzone } from "./FolderUploadDropzone";
import type { EnhancedSelectedFilters } from "@/types/gallery.types";
import { useBrandStore } from "@/store/brand.store";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";
import { Input } from "@/components/ui/input";
import { MediaFilterDropdown } from "../MediaFilterDropdown";
import MediaViewsDropdown from "../MediaViewDropDown";
import TopicsGrid from "../PexelsTopicGrid";
import { toast } from "sonner";

interface CampaignViewProps {
  selectedBrandId: string;
  brandName: string;
  campaignId: string;
  activeTab: string;
  onBackToCampaigns: () => void;
  onUploadComplete?: (urls: string[]) => void;
  addToGallery?: boolean;
  selectedMoodboardId?: string;
  selectedSubFolderId?: string | null;
  searchQuery?: string;
  favorites?: boolean;
  selectedFilters: EnhancedSelectedFilters;
  onTabChange: (value: string) => void;
  showHeader?: boolean; // New prop to control header visibility
  handleSearchChange: (query: string) => void;
  showFilters?: boolean;
  setSelectedFilters: React.Dispatch<
    React.SetStateAction<EnhancedSelectedFilters>
  >;
  galleryView: "grid" | "folder";
  setGalleryView: (view: "grid" | "folder") => void;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  isMediaSelectDialog?: boolean;
  isMultiSelect?: boolean;
  maxSelectionCount?: number;
  inSelectionGalleryIds?: string[];
  onMediaItemSelected?: (url: string) => void;
  onFullMediaItemSelected?: (item: any) => void;
  galleryActions: GalleryActions;
}

export function CampaignView({
  selectedBrandId,
  brandName,
  campaignId,
  activeTab,
  onBackToCampaigns,
  onUploadComplete,
  addToGallery = true,
  selectedMoodboardId,
  selectedSubFolderId,
  searchQuery = "",
  favorites = false,
  selectedFilters,
  showHeader = false,
  handleSearchChange,
  showFilters,
  setSelectedFilters,
  galleryView,
  setGalleryView, // Default to not showing header (when used with sidebar)
  setActiveTab,
  isMediaSelectDialog = false,
  isMultiSelect = false,
  maxSelectionCount,
  inSelectionGalleryIds = [],
  onMediaItemSelected,
  onFullMediaItemSelected,
  galleryActions,
}: CampaignViewProps) {
  const { campaigns } = useBrandStore();
  const {
    selectedItems,
    setSelectedItems,
    multiSelectItems,
    setMultiSelectItems,
    selectAllMode,
    setSelectAllMode,
    excludedItems,
    setExcludedItems,
    setTotalItemsCount,
  } = useGalleryFilterStore();

  // Find current campaign from the brand's campaigns
  const currentCampaign = useMemo(() => {
    return campaigns.find((c) => c.id === campaignId);
  }, [campaignId]);

  // If campaign is not found, it might be because data is stale - let's give some time for refresh
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!currentCampaign && retryCount < 3) {
      // Campaign not found, but we might be in the middle of data refresh
      const timer = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentCampaign, retryCount]);

  // Intersection observer for infinite scroll
  const { ref, inView } = useInView();

  // Update totalItemsCount in store when it changes
  useEffect(() => {
    setTotalItemsCount(galleryActions.totalItems);
  }, [galleryActions.totalItems, setTotalItemsCount]);

  // Clear selected items when campaign changes
  useEffect(() => {
    if (isMultiSelect) {
      setMultiSelectItems([]);
    } else {
      setSelectedItems([]);
    }
  }, [campaignId, activeTab, isMultiSelect]);

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
    .filter((item) =>
      isMultiSelect
        ? multiSelectItems.includes(item.id)
        : selectedItems.includes(item.id)
    );

  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const items = useMemo(() => {
    const items = galleryActions.getGalleryItems();
    return items;
  }, [galleryActions]);

  const handleSelect = (id: string, selected: boolean, shiftKey?: boolean) => {
    // Check for single select mode dialog close
    if (isMediaSelectDialog && !isMultiSelect && selected) {
      const item = galleryActions.getGalleryItems().find((i) => i.id === id);
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

      // Traverse through items once
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
    if (selected) {
      if (isMultiSelect) {
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
              description: "Please deselect an item before selecting a new one.",
            }
          );
          return;
        }
        setMultiSelectItems((prev) => [...prev, id]);
      } else {
        setSelectedItems((prev) => [...prev, id]);
      }
      // Remove from exclusions if in select-all mode
      if (selectAllMode !== "none") {
        setExcludedItems((prev) => prev.filter((itemId) => itemId !== id));
      }
    } else {
      if (isMultiSelect) {
        setMultiSelectItems((prev) => prev.filter((itemId) => itemId !== id));
      } else {
        setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
      }
      // Add to exclusions if in select-all mode
      if (selectAllMode !== "none") {
        setExcludedItems((prev) => [...prev, id]);
      }
    }

    setLastSelectedId(id); // ✅ always update last clicked
  };

  const handleUnselectAll = () => {
    if (isMultiSelect) {
      setMultiSelectItems([]);
    } else {
      setSelectedItems([]);
    }
    setSelectAllMode("none");
    setExcludedItems([]);
  };

  const handleSelectAll = () => {
    const allItemIds = galleryActions.getGalleryItems().map((item) => item.id);
    if (isMultiSelect) {
      setMultiSelectItems(allItemIds);
    } else {
      setSelectedItems(allItemIds);
    }
    setSelectAllMode("visible");
    setExcludedItems([]);
  };

  const { selectedCampaignId } = useBrandStore();

  if (!currentCampaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToCampaigns}
              className="p-1 h-auto"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            {retryCount < 3 ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <p className="text-sm text-gray-600">Loading campaign...</p>
              </div>
            ) : (
              <p className="text-sm text-red-500">Campaign not found</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Campaign Header - Only show if showHeader is true */}
      {showHeader && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToCampaigns}
              className="p-1 h-auto"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Folder className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-900">
                {currentCampaign.title}
              </h2>
              <p className="text-xs text-gray-500">
                {brandName} • {galleryActions.getGalleryItems().length} media
                items
              </p>
            </div>
          </div>
        </div>
      )}

      {!showHeader && (
        <div className="flex justify-between items-center mt-1 mb-2">
          <div className="relative w-fit mx-4 mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search media..."
              className={`pl-9 transition-all duration-200 ${
                showFilters ? "w-[400px]" : "w-[300px]"
              }`}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <MediaFilterDropdown
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
            />

            <MediaViewsDropdown
              galleryView={galleryView}
              setGalleryView={setGalleryView}
              selectedCampaignId={selectedCampaignId}
            />
          </div>
        </div>
      )}

      {/* Tabs removed - navigation now handled by unified GallerySidebar */}

      {activeTab === "pexels" ? (
        <div className="overflow-y-auto">
          <TopicsGrid
            selectedBrandId={selectedBrandId}
            selectedCampaignId={selectedCampaignId ?? undefined}
            setActiveTab={setActiveTab}
          />
        </div>
      ) : (
        <div className="overflow-y-auto scrollbar">
          {!showHeader && (
            <div className="pl-4">
              <FolderUploadDropzone
                activeTab={activeTab}
                onUploadComplete={onUploadComplete}
                addToGallery={addToGallery}
                galleryFilters={{
                  selectedFilters: {
                    brands: [selectedBrandId],
                    campaigns: [campaignId],
                    moodboards: [],
                    product_categories: [],
                    asset_types: [],
                    asset_sources: [],
                    media_format: [],
                    aspect_ratio: [],
                    workflow_status: [],
                    sub_folders: [],
                  },
                }}
                selectedBrandId={selectedBrandId}
                selectedCampaignId={campaignId}
                selectedSubFolderId={selectedSubFolderId}
                selectedMoodboardId={selectedMoodboardId}
              />
            </div>
          )}

          {/* <MediaSearchFilters {...filterProps} /> */}

          {/* Folder Tabs for campaign view - Only show if showHeader is false */}

          {/* Gallery Status Display */}
          <MediaGalleryStatusDisplay
            galleryStatus={galleryActions.galleryStatus}
            galleryItemsLength={galleryActions.getGalleryItems().length}
            isFetchingNextPage={galleryActions.isFetchingNextPage}
          />

          {/* Gallery Items with minimum height to prevent layout shift */}
          <div className="flex-1 pl-4 pb-4">
            {galleryActions.galleryStatus === "success" &&
              galleryActions.getGalleryItems().length > 0 && (
                <div>
                  <SortableMediaGrid
                    selectedItems={
                      isMultiSelect ? multiSelectItems : selectedItems
                    }
                    onSelect={handleSelect}
                    onClearSelection={handleUnselectAll}
                    galleryActions={galleryActions}
                    isMediaSelectDialog={isMediaSelectDialog} // This is not a dialog
                    enableDragToMove={!isMediaSelectDialog}
                    activeTab={activeTab}
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
        </div>
      )}

      {(isMultiSelect ? multiSelectItems.length : selectedItems.length) > 0 && (
        <MediaBulkActions
          selectedItems={selectedItemsData}
          onUnselectAll={handleUnselectAll}
          onSelectAll={handleSelectAll}
          galleryActions={galleryActions}
          brandName={brandName}
          totalItems={galleryActions.totalItems}
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
