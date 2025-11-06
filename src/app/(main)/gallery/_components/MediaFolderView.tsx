"use client";

import React from "react";
import type { EnhancedSelectedFilters } from "@/types/gallery.types";
import { useFolderState } from "@/hooks/useFolderState";
import { FolderUploadDropzone } from "./folder/FolderUploadDropzone";
import { CampaignView } from "./folder/CampaignView";
import { FolderGalleryView } from "./folder/FolderGalleryView";
import { FolderTabs } from "./folder/FolderTabs";
import { CampaignsSidebar } from "./folder/CampaignsSidebar";
import { useBrandStore } from "@/store/brand.store";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";
import { ITEMS_PER_PAGE, useGalleryQuery } from "@/hooks/useGallery";

interface MediaFolderViewProps {
  activeTab: string;
  onUploadComplete?: (urls: string[]) => void;
  addToGallery?: boolean;
  selectedCampaignId: string | undefined;
  selecteMoodboardId: string | undefined;
  brandName: string;
  isUrlDialogOpen: boolean;
  setIsUrlDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Add filter props
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFilters: EnhancedSelectedFilters;
  setSelectedFilters: React.Dispatch<
    React.SetStateAction<EnhancedSelectedFilters>
  >;
  setInitialWorkflowStatus: (
    value: string[] | ((old: string[]) => string[] | null) | null,
    options?: any
  ) => Promise<URLSearchParams>;
  // Add tab change prop
  onTabChange: (value: string) => void;
}

export function MediaFolderView({
  activeTab,
  onUploadComplete,
  addToGallery = true,
  brandName,
  selecteMoodboardId,
  searchQuery,
  selectedFilters,
  onTabChange,
}: MediaFolderViewProps) {
  const { selectedBrandId, isBrandsFetched } = useBrandStore();
  const { selectedCampaignId, handleCampaignSelect, handleBackToCampaigns } =
    useFolderState();
  const { favorites } = useGalleryFilterStore();

  // Create shared gallery actions for sidebar drag-drop operations
  const galleryActions = useGalleryQuery(
    {
      assetType: activeTab,
      favorites,
      source: activeTab,
      searchQuery,
      selectedFilters: {
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
    "MediaFolderView-Shared"
  );

  // Show campaign view with sidebar
  if (selectedBrandId && selectedCampaignId) {
    return (
      <div className="flex gap-0 h-[calc(100vh-200px)]">
        <CampaignsSidebar
          selectedBrandId={selectedBrandId}
          selectedCampaignId={selectedCampaignId}
          onCampaignSelect={handleCampaignSelect}
          galleryActions={galleryActions}
        />

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {/* <MediaSearchFilters {...filterProps} /> */}
            <CampaignView
              selectedBrandId={selectedBrandId}
              brandName={brandName}
              campaignId={selectedCampaignId}
              activeTab={activeTab}
              onBackToCampaigns={handleBackToCampaigns}
              onUploadComplete={onUploadComplete}
              addToGallery={addToGallery}
              selectedMoodboardId={selecteMoodboardId}
              searchQuery={searchQuery}
              favorites={favorites}
              selectedFilters={selectedFilters}
              onTabChange={onTabChange}
              showHeader={false}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show folder gallery with sidebar (brand selected, no campaign)

  if (selectedBrandId && isBrandsFetched) {
    return (
      <div className="w-full h-[calc(100vh-200px)] flex overflow-hidden">
        <CampaignsSidebar
          selectedBrandId={selectedBrandId}
          selectedCampaignId={null}
          onCampaignSelect={handleCampaignSelect}
          galleryActions={galleryActions}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Section (Static) */}
          <div className="px-4 pb-6 flex-shrink-0">
            <FolderTabs
              activeTab={activeTab}
              onTabChange={onTabChange}
              title="Subfolders"
            />
          </div>

          <div className="px-4 flex-shrink-0">
            <FolderUploadDropzone
              activeTab={activeTab}
              onUploadComplete={onUploadComplete}
              addToGallery={addToGallery}
              selectedBrandId={selectedBrandId}
              selectedCampaignId={undefined}
              selectedMoodboardId={selecteMoodboardId}
            />
          </div>

          {/* <MediaSearchFilters {...filterProps} /> */}

          {/* 🎞️ Scrollable Gallery */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <FolderGalleryView
              selectedBrandId={selectedBrandId}
              selectedCampaignId={undefined}
              searchQuery={searchQuery}
              favorites={favorites}
              selectedFilters={selectedFilters}
              activeTab={activeTab}
            />
          </div>
        </div>
      </div>
    );
  }

  if (isBrandsFetched) {
    return (
      <div className="w-full max-w-full overflow-hidden">
        <FolderUploadDropzone
          activeTab={activeTab}
          onUploadComplete={onUploadComplete}
          addToGallery={addToGallery}
          selectedBrandId={selectedBrandId}
          selectedCampaignId={undefined}
          selectedMoodboardId={selecteMoodboardId}
        />

        {/* <MediaSearchFilters {...filterProps} /> */}

        <FolderTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          title="Subfolders"
        />

        <FolderGalleryView
          selectedBrandId={selectedBrandId}
          selectedCampaignId={undefined}
          searchQuery={searchQuery}
          favorites={favorites}
          selectedFilters={selectedFilters}
          activeTab={activeTab}
        />
      </div>
    );
  }

  return null;
}
