"use client";

import React from "react";
import type { EnhancedSelectedFilters } from "@/types/gallery.types";
import { useFolderState } from "@/hooks/useFolderState";
import { FolderUploadDropzone } from "./folder/FolderUploadDropzone";
import { CampaignsList } from "./folder/CampaignsList";
import { CampaignView } from "./folder/CampaignView";
import { FolderGalleryView } from "./folder/FolderGalleryView";
import { MediaSearchFilters } from "./MediaSearchFilters";
import { FolderTabs } from "./folder/FolderTabs";
import { useBrandStore } from "@/store/brand.store";

interface MediaFolderViewProps {
  activeTab: string;
  onUploadComplete?: (urls: string[]) => void;
  addToGallery?: boolean;
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
  const { selectedBrandId, isBrandsFetched } = useBrandStore();
  const {
    selectedCampaignFromUrl,
    handleCampaignSelect,
    handleBackToCampaigns,
  } = useFolderState(selectedCampaignId);

  // Render campaign view when in folder mode with selected brand and campaign
  if (galleryView === "folder" && selectedBrandId && selectedCampaignFromUrl) {
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

        <CampaignView
          selectedBrandId={selectedBrandId}
          brandName={brandName}
          campaignId={selectedCampaignFromUrl}
          activeTab={activeTab}
          onBackToCampaigns={handleBackToCampaigns}
          onUploadComplete={onUploadComplete}
          addToGallery={addToGallery}
          selectedMoodboardId={selecteMoodboardId}
          searchQuery={searchQuery}
          favorites={favorites}
          selectedFilters={selectedFilters}
          onTabChange={onTabChange}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full  overflow-hidden">
      {/* Upload Dropzone */}
      <FolderUploadDropzone
        activeTab={activeTab}
        onUploadComplete={onUploadComplete}
        addToGallery={addToGallery}
        selectedBrandId={selectedBrandId}
        selectedCampaignId={selectedCampaignFromUrl || undefined}
        selectedMoodboardId={selecteMoodboardId}
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
        selectedBrandId &&
        !selectedCampaignFromUrl && (
          <CampaignsList
            selectedBrandId={selectedBrandId}
            onCampaignSelect={handleCampaignSelect}
            key={selectedBrandId}
          />
        )}

      {/* Folder Tabs - Horizontal scrollable tabs */}
      <FolderTabs
        activeTab={activeTab}
        onTabChange={onTabChange}
        title="Subfolders"
      />

      {/* Gallery Grid View - Show in multiple scenarios */}
      {isBrandsFetched && (
        <>
          {/* Show for grid view regardless of brand selection */}
          {galleryView === "grid" && (
            <FolderGalleryView
              selectedBrandId={selectedBrandId}
              selectedCampaignId={selectedCampaignFromUrl || undefined}
              searchQuery={searchQuery}
              favorites={favorites}
              selectedFilters={selectedFilters}
              activeTab={activeTab}
            />
          )}

          {/* Show for folder view when brand is selected but no campaign (brand-level view) */}
          {galleryView === "folder" &&
            selectedBrandId &&
            !selectedCampaignFromUrl && (
              <FolderGalleryView
                selectedBrandId={selectedBrandId}
                selectedCampaignId={undefined}
                searchQuery={searchQuery}
                favorites={favorites}
                selectedFilters={selectedFilters}
                activeTab={activeTab}
              />
            )}

          {/* Show for folder view when no brand is selected */}
          {galleryView === "folder" && !selectedBrandId && (
            <FolderGalleryView
              selectedBrandId={selectedBrandId}
              selectedCampaignId={undefined}
              searchQuery={searchQuery}
              favorites={favorites}
              selectedFilters={selectedFilters}
              activeTab={activeTab}
            />
          )}
        </>
      )}
    </div>
  );
}
