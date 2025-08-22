"use client";

import React from "react";
import type {
  BrandCampaignListResponse,
  EnhancedSelectedFilters,
} from "@/types/gallery.types";
import { useFolderState } from "@/hooks/useFolderState";
import { FolderBrandSelector } from "./folder/FolderBrandSelector";
import { FolderUploadDropzone } from "./folder/FolderUploadDropzone";
import { CampaignsList } from "./folder/CampaignsList";
import { CampaignView } from "./folder/CampaignView";
import { FolderGalleryView } from "./folder/FolderGalleryView";
import { MediaSearchFilters } from "./MediaSearchFilters";
import { FolderTabs } from "./folder/FolderTabs";

interface MediaFolderViewProps {
  activeTab: string;
  onUploadComplete?: (urls: string[]) => void;
  addToGallery?: boolean;
  selectedBrand?: BrandCampaignListResponse["brands"][number] | null;
  setSelectedBrand?: React.Dispatch<
    React.SetStateAction<BrandCampaignListResponse["brands"][number] | null>
  >;
  brands: BrandCampaignListResponse["brands"];
  brandsLoading: boolean;
  selectedCampaignId: string | undefined;
  selecteMoodboardId: string | undefined;
  galleryView: "folder" | "grid";
  brandName: string;
  isUrlDialogOpen: boolean;
  setIsUrlDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Add filter props
  searchQuery: string;
  onSearchChange: (query: string) => void;
  favorites: boolean;
  onFavoritesChange: (checked: boolean) => void;
  selectedFilters: EnhancedSelectedFilters;
  setSelectedFilters: (filters: EnhancedSelectedFilters) => void;
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
  brands,
  brandsLoading,
  selectedCampaignId,
  selecteMoodboardId,
  galleryView = "grid",
  searchQuery,
  onSearchChange,
  favorites,
  onFavoritesChange,
  selectedFilters,
  setSelectedFilters,
  setInitialWorkflowStatus,
  onTabChange,
}: MediaFolderViewProps) {
  const {
    selectedBrand,
    selectedCampaignFromUrl,
    handleBrandChange,
    handleCampaignSelect,
    handleBackToCampaigns,
  } = useFolderState(selectedCampaignId, brands, brandsLoading);

  // Render campaign view when in folder mode with selected brand and campaign
  if (galleryView === "folder" && selectedBrand && selectedCampaignFromUrl) {
    return (
      <div className="w-full max-w-full overflow-hidden">
        {/* Add search filters for campaign view */}
        <MediaSearchFilters
          onSearchChange={onSearchChange}
          onSourceChange={() => {}} // Not used in folder view
          onCreatorChange={() => {}} // Not used in folder view
          onFavoritesChange={onFavoritesChange}
          onToggleFilters={() => {}} // Not used in folder view
          source="" // Not used in folder view
          creator="" // Not used in folder view
          favorites={favorites}
          showFilters={false} // Don't show filter toggle in folder view
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          setInitialWorkflowStatus={setInitialWorkflowStatus}
          isMediaSelectDialog={false}
        />

        {/* Folder Tabs for campaign view */}
        <FolderTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          title="Subfolders"
        />

        <CampaignView
          selectedBrand={selectedBrand}
          campaignId={selectedCampaignFromUrl}
          activeTab={activeTab}
          onBackToCampaigns={handleBackToCampaigns}
          onUploadComplete={onUploadComplete}
          addToGallery={addToGallery}
          selectedMoodboardId={selecteMoodboardId}
          searchQuery={searchQuery}
          favorites={favorites}
          selectedFilters={selectedFilters}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Brand Selector */}
      <FolderBrandSelector
        selectedBrand={selectedBrand}
        onBrandChange={handleBrandChange}
        brands={brands}
        brandsLoading={brandsLoading}
      />

      {/* Upload Dropzone */}
      <FolderUploadDropzone
        activeTab={activeTab}
        onUploadComplete={onUploadComplete}
        addToGallery={addToGallery}
        selectedBrand={selectedBrand}
        selectedCampaignId={selectedCampaignFromUrl || undefined}
        selectedMoodboardId={selecteMoodboardId}
        brandsLoading={brandsLoading}
      />

      {/* Add search filters for folder view */}
      <MediaSearchFilters
        onSearchChange={onSearchChange}
        onSourceChange={() => {}} // Not used in folder view
        onCreatorChange={() => {}} // Not used in folder view
        onFavoritesChange={onFavoritesChange}
        onToggleFilters={() => {}} // Not used in folder view
        source="" // Not used in folder view
        creator="" // Not used in folder view
        favorites={favorites}
        showFilters={false} // Don't show filter toggle in folder view
        selectedFilters={selectedFilters}
        setSelectedFilters={setSelectedFilters}
        setInitialWorkflowStatus={setInitialWorkflowStatus}
        isMediaSelectDialog={false}
      />

      {/* Campaigns List - Show when in folder mode with selected brand but no campaign */}
      {galleryView === "folder" &&
        selectedBrand &&
        !selectedCampaignFromUrl && (
          <CampaignsList
            selectedBrand={selectedBrand}
            onCampaignSelect={handleCampaignSelect}
          />
        )}

      {/* Folder Tabs - Horizontal scrollable tabs */}
      <FolderTabs
        activeTab={activeTab}
        onTabChange={onTabChange}
        title="Subfolders"
      />

      {/* Gallery Grid View - Show when in grid mode or no specific folder context */}
      {(galleryView === "grid" ||
        !selectedBrand ||
        (galleryView === "folder" && !selectedCampaignFromUrl)) &&
        !brandsLoading && (
          <FolderGalleryView
            selectedBrand={selectedBrand}
            selectedCampaignId={selectedCampaignFromUrl || undefined}
            searchQuery={searchQuery}
            favorites={favorites}
            selectedFilters={selectedFilters}
            activeTab={activeTab}
          />
        )}
    </div>
  );
}
