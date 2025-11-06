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
import MediaViewsDropdown from "./MediaViewDropDown";
import { MediaFilterDropdown } from "./MediaFilterDropdown";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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
  // setSelectedCampaignInUrl?: (value: string | null) => void;
  // setInitialBrandId?: (value: string | undefined) => void;
  // ✅ Correct Query State Props
  setInitialBrandId: (
    value: string | null | ((old: string | null) => string | null)
  ) => Promise<URLSearchParams>;

  setSelectedCampaignInUrl: (
    value: string | null | ((old: string | null) => string | null)
  ) => Promise<URLSearchParams>;
  galleryView: "grid" | "folder";
  setGalleryView: (view: "grid" | "folder") => void;
  hasNoBrands: boolean;
  handleSearchChange: (query: string) => void;
  showFilters?: boolean;
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
  setSelectedCampaignInUrl,
  setInitialBrandId,
  galleryView,
  setGalleryView,
  hasNoBrands,
  setSelectedFilters,
  setInitialWorkflowStatus,
  handleSearchChange,
  showFilters,
}: MediaFolderViewProps) {
  const { selectedBrandId, isBrandsFetched } = useBrandStore();
  const { selectedCampaignId, handleCampaignSelect, handleBackToCampaigns } =
    useFolderState();
  const { favorites } = useGalleryFilterStore();

  // Show campaign view with sidebar
  if (selectedBrandId && selectedCampaignId) {
    return (
      <div className="flex gap-0 h-[calc(100vh-200px)]">
        <CampaignsSidebar
          selectedBrandId={selectedBrandId}
          selectedCampaignId={selectedCampaignId}
          onCampaignSelect={handleCampaignSelect}
          setInitialBrandId={setInitialBrandId}
          setSelectedCampaignInUrl={setSelectedCampaignInUrl}
          setSelectedFilters={setSelectedFilters}
          setInitialWorkflowStatus={setInitialWorkflowStatus}
          hasNoBrands={hasNoBrands}
          galleryView={galleryView}
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
              handleSearchChange={handleSearchChange}
              showFilters={showFilters}
              setSelectedFilters={setSelectedFilters}
              setInitialWorkflowStatus={setInitialWorkflowStatus}
              galleryView={galleryView}
              setGalleryView={setGalleryView}
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
          setInitialBrandId={setInitialBrandId}
          setSelectedCampaignInUrl={setSelectedCampaignInUrl}
          setSelectedFilters={setSelectedFilters}
          setInitialWorkflowStatus={setInitialWorkflowStatus}
          hasNoBrands={hasNoBrands}
          galleryView={galleryView}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center m-2 mb-2">
            <div className="relative w-fit mx-4 mb-2">
              <Search className="absolute left-3 top-4 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                setInitialWorkflowStatus={setInitialWorkflowStatus}
              />

              <MediaViewsDropdown
                galleryView={galleryView}
                setGalleryView={setGalleryView}
                selectedCampaignId={selectedCampaignId}
              />
            </div>
          </div>

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
