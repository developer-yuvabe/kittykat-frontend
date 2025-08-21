"use client";

import React from "react";
import type { BrandCampaignListResponse } from "@/types/gallery.types";
import { useFolderState } from "@/hooks/useFolderState";
import { FolderBrandSelector } from "./folder/FolderBrandSelector";
import { FolderUploadDropzone } from "./folder/FolderUploadDropzone";
import { CampaignsList } from "./folder/CampaignsList";
import { CampaignView } from "./folder/CampaignView";
import { FolderGalleryView } from "./folder/FolderGalleryView";

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
      <CampaignView
        selectedBrand={selectedBrand}
        campaignId={selectedCampaignFromUrl}
        activeTab={activeTab}
        onBackToCampaigns={handleBackToCampaigns}
        onUploadComplete={onUploadComplete}
        addToGallery={addToGallery}
        selectedMoodboardId={selecteMoodboardId}
      />
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

      {/* Campaigns List - Show when in folder mode with selected brand but no campaign */}
      {galleryView === "folder" &&
        selectedBrand &&
        !selectedCampaignFromUrl && (
          <CampaignsList
            selectedBrand={selectedBrand}
            onCampaignSelect={handleCampaignSelect}
          />
        )}

      {/* Gallery Grid View - Show when in grid mode or no specific folder context */}
      {(galleryView === "grid" ||
        !selectedBrand ||
        (galleryView === "folder" && !selectedCampaignFromUrl)) &&
        !brandsLoading && (
          <FolderGalleryView
            selectedBrand={selectedBrand}
            selectedCampaignId={selectedCampaignFromUrl || undefined}
          />
        )}
    </div>
  );
}
