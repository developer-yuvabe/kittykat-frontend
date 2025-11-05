"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { ArrowLeft, Folder, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ITEMS_PER_PAGE, useGalleryQuery } from "@/hooks/useGallery";
import { SortableMediaGrid } from "../SortableMediaGrid";
import { MediaGalleryStatusDisplay } from "../MediaGalleryStatusDisplay";
import { MediaBulkActions } from "../MediaBulkActions";
import { FolderUploadDropzone } from "./FolderUploadDropzone";
import type { EnhancedSelectedFilters } from "@/types/gallery.types";
import { FolderTabs } from "./FolderTabs";
import { useBrandStore } from "@/store/brand.store";

interface CampaignViewProps {
  selectedBrandId: string;
  brandName: string;
  campaignId: string;
  activeTab: string;
  onBackToCampaigns: () => void;
  onUploadComplete?: (urls: string[]) => void;
  addToGallery?: boolean;
  selectedMoodboardId?: string;
  searchQuery?: string;
  favorites?: boolean;
  selectedFilters?: EnhancedSelectedFilters;
  onTabChange: (value: string) => void;
  showHeader?: boolean; // New prop to control header visibility
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
  searchQuery = "",
  favorites = false,
  selectedFilters,
  onTabChange,
  showHeader = false, // Default to not showing header (when used with sidebar)
}: CampaignViewProps) {
  const { campaigns } = useBrandStore();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

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

  // Use gallery hook with proper filters - ensure campaign filter is applied
  const galleryActions = useGalleryQuery(
    {
      assetType: activeTab, // Use the activeTab instead of hardcoded value
      favorites,
      source: activeTab,
      searchQuery,
      selectedFilters: {
        // Merge provided filters but override brand and campaign to ensure correct filtering
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
        // Force the brand and campaign filters to match the current selection
        brands: [selectedBrandId],
        campaigns: [campaignId],
      },
    },
    ITEMS_PER_PAGE,
    true,
    "CampaignView"
  );

  // Intersection observer for infinite scroll
  const { ref, inView } = useInView();

  // Clear selected items when campaign changes
  useEffect(() => {
    setSelectedItems([]);
  }, [campaignId]);

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

  const handleSelectAll = () => {
    const allItemIds = galleryActions.getGalleryItems().map((item) => item.id);
    setSelectedItems(allItemIds);
  };

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
        <div className="px-4 pb-6">
          <FolderTabs
            activeTab={activeTab}
            onTabChange={onTabChange}
            title="Subfolders"
          />
        </div>
      )}

      {/* Upload Dropzone for Campaign - Only show if showHeader is false (sidebar mode) */}
      {!showHeader && (
        <div className="px-4">
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
              },
            }}
            selectedBrandId={selectedBrandId}
            selectedCampaignId={campaignId}
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
      />

      {/* Gallery Items with minimum height to prevent layout shift */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {galleryActions.galleryStatus === "success" &&
          galleryActions.getGalleryItems().length > 0 && (
            <div>
              <SortableMediaGrid
                selectedItems={selectedItems}
                onSelect={handleSelect}
                galleryActions={galleryActions}
                isMediaSelectDialog={false} // This is not a dialog
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

        {/* Loading state - maintains space */}
        {galleryActions.galleryStatus === "pending" && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        )}
      </div>

      {selectedItems.length > 0 && (
        <MediaBulkActions
          selectedItems={selectedItemsData}
          onUnselectAll={handleUnselectAll}
          onSelectAll={handleSelectAll}
          galleryActions={galleryActions}
          brandName={brandName}
        />
      )}
    </div>
  );
}
