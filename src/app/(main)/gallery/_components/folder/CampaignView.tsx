"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { ArrowLeft, Folder, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ITEMS_PER_PAGE, useGalleryQuery } from "@/hooks/useGallery";
import { MediaGrid } from "../MediaGrid";
import { MediaGalleryStatusDisplay } from "../MediaGalleryStatusDisplay";
import { MediaBulkActions } from "../MediaBulkActions";
import { FolderUploadDropzone } from "./FolderUploadDropzone";
import type {
  BrandCampaignListResponse,
  EnhancedSelectedFilters,
} from "@/types/gallery.types";

interface CampaignViewProps {
  selectedBrand: BrandCampaignListResponse["brands"][number];
  campaignId: string;
  activeTab: string;
  onBackToCampaigns: () => void;
  onUploadComplete?: (urls: string[]) => void;
  addToGallery?: boolean;
  selectedMoodboardId?: string;
  searchQuery?: string;
  favorites?: boolean;
  selectedFilters?: EnhancedSelectedFilters;
}

export function CampaignView({
  selectedBrand,
  campaignId,
  activeTab,
  onBackToCampaigns,
  onUploadComplete,
  addToGallery = true,
  selectedMoodboardId,
  searchQuery = "",
  favorites = false,
  selectedFilters,
}: CampaignViewProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Find current campaign from the brand's campaigns
  const currentCampaign = useMemo(() => {
    return selectedBrand.campaigns.find((c) => c.id === campaignId);
  }, [selectedBrand.campaigns, campaignId]);

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
        brands: [selectedBrand.brand_id],
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
            <p className="text-sm text-red-500">Campaign not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campaign Header */}
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
              {selectedBrand.brand_name} •{" "}
              {galleryActions.getGalleryItems().length} media items
            </p>
          </div>
        </div>
      </div>

      {/* Upload Dropzone for Campaign */}
      <FolderUploadDropzone
        activeTab={activeTab}
        onUploadComplete={onUploadComplete}
        addToGallery={addToGallery}
        galleryFilters={{
          selectedFilters: {
            brands: [selectedBrand.brand_id],
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
        selectedBrand={selectedBrand}
        selectedCampaignId={campaignId}
        selectedMoodboardId={selectedMoodboardId}
        brandsLoading={false}
      />

      {/* Gallery Status Display */}
      <MediaGalleryStatusDisplay
        galleryStatus={galleryActions.galleryStatus}
        galleryItemsLength={galleryActions.getGalleryItems().length}
      />

      {/* Gallery Items with minimum height to prevent layout shift */}
      <div className="min-h-[400px]">
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
          galleryActions={galleryActions}
          brandName={selectedBrand.brand_name}
        />
      )}
    </div>
  );
}
