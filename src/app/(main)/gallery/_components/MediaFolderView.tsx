"use client";

import React, { useState, useCallback } from "react";
import type { EnhancedSelectedFilters } from "@/types/gallery.types";
import { useFolderState } from "@/hooks/useFolderState";
import { FolderUploadDropzone } from "./folder/FolderUploadDropzone";
import { CampaignView } from "./folder/CampaignView";
import { FolderGalleryView } from "./folder/FolderGalleryView";
import { GallerySidebar } from "./folder/GallerySidebar";
import { useBrandStore } from "@/store/brand.store";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";
import { ITEMS_PER_PAGE, useGalleryQuery } from "@/hooks/useGallery";
import MediaViewsDropdown from "./MediaViewDropDown";
import { MediaFilterDropdown } from "./MediaFilterDropdown";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import TopicsGrid from "./PexelsTopicGrid";
import { GalleryDndProvider } from "@/contexts/GalleryDndContext";
import { toast } from "sonner";
import { patchCampaign, updateCampaign } from "@/services/api/brand.service";
import { useQueryClient } from "@tanstack/react-query";
import { useUndoableAction } from "@/hooks/useUndoableAction";
import { useBulkGalleryOperations } from "@/hooks/useBulkGalleryOperations";

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
  // Add tab change prop
  onTabChange: (value: string) => void;
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
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
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
  handleSearchChange,
  showFilters,
  setActiveTab,
}: MediaFolderViewProps) {
  const {
    selectedBrandId,
    isBrandsFetched,
    brands,
    reorderCampaigns,
    archiveCampaign,
  } = useBrandStore();
  const { selectedCampaignId, handleCampaignSelect, handleBackToCampaigns } =
    useFolderState();
  const {
    favorites,
    orderBy,
    selectedSubFolderId,
    selectedItems,
    setSelectedItems,
    clearSelection,
    selectAllMode,
    excludedItems,
    totalItemsCount,
  } = useGalleryFilterStore();
  const queryClient = useQueryClient();
  const { execute } = useUndoableAction();
  const bulkOps = useBulkGalleryOperations();

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
        sub_folders: selectedSubFolderId
          ? [selectedSubFolderId]
          : selectedFilters?.sub_folders || [],
      },
    },
    ITEMS_PER_PAGE,
    true,
    "MediaFolderView-Shared"
  );

  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsed = () => setIsCollapsed((prev) => !prev);

  // Get campaigns for drag overlay
  const campaigns =
    brands.find((b) => b.id === selectedBrandId)?.campaigns || [];

  // DnD Callbacks
  const handleMoveMediaToCampaign = useCallback(
    async (itemIds: string[], campaignId: string) => {
      if (!selectedBrandId) return;

      try {
        const isSelectAll = selectAllMode !== "none";

        const request = bulkOps.buildBulkRequest(
          {
            assetType: activeTab,
            favorites,
            source: activeTab,
            searchQuery,
            selectedFilters,
          },
          isSelectAll,
          itemIds,
          excludedItems
        );

        await bulkOps.bulkMove.mutateAsync({
          ...request,
          target_campaign_id: campaignId,
          target_brand_id: selectedBrandId,
        });

        clearSelection();
      } catch (error) {
        console.error("Move error:", error);
      }
    },
    [
      selectedBrandId,
      campaigns,
      selectAllMode,
      excludedItems,
      bulkOps,
      activeTab,
      favorites,
      searchQuery,
      selectedFilters,
      clearSelection,
    ]
  );

  const handleMoveMediaToTab = useCallback(
    async (itemIds: string[], tabValue: string, sourceTab?: string) => {
      // Validation
      if (sourceTab === "all-media") {
        toast.error("Items from 'All Media' cannot be moved.");
        return;
      }

      if (tabValue === "all-media") {
        toast.error("Items cannot be moved into 'All Media'.");
        return;
      }

      if (tabValue === sourceTab) {
        toast.info("Items are already in this tab.");
        return;
      }

      if (tabValue === "pexels") {
        toast.error("Items cannot be moved into 'Pexels' Tab.");
        return;
      }

      if (!selectedBrandId) return;

      try {
        const isSelectAll = selectAllMode !== "none";

        const request = bulkOps.buildBulkRequest(
          {
            assetType: activeTab,
            favorites,
            source: activeTab,
            searchQuery,
            selectedFilters,
          },
          isSelectAll,
          itemIds,
          excludedItems
        );

        await bulkOps.bulkMove.mutateAsync({
          ...request,
          target_source: tabValue,
        });

        clearSelection();
      } catch (error) {
        console.error("Move failed:", error);
      }
    },
    [
      selectedBrandId,
      selectAllMode,
      excludedItems,
      bulkOps,
      activeTab,
      favorites,
      searchQuery,
      selectedFilters,
      clearSelection,
    ]
  );

  const handleReorderMedia = useCallback(
    (reorderData: { id: string; brand_sort_order: number }[]) => {
      galleryActions.reorderItems?.(reorderData);
    },
    [galleryActions]
  );

  const handleReorderCampaigns = useCallback(
    async (
      campaignId: string,
      targetId: string,
      position: "before" | "after",
      section: "active" | "archived"
    ) => {
      if (!selectedBrandId) return;

      const draggedCampaign = campaigns.find((c) => c.id === campaignId);
      if (!draggedCampaign) return;

      // Optimistically update the store immediately
      reorderCampaigns(selectedBrandId, campaignId, targetId, position);

      const campaignList =
        section === "active"
          ? campaigns.filter((c) => !c.is_archived)
          : campaigns.filter((c) => c.is_archived);

      const draggedIndex = campaignList.findIndex((c) => c.id === campaignId);
      const targetIndex = campaignList.findIndex((c) => c.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return;
      if (draggedIndex === targetIndex) return;

      // Create new order
      const reordered = [...campaignList];
      const [removed] = reordered.splice(draggedIndex, 1);

      let insertIndex = targetIndex;
      if (position === "after") {
        insertIndex =
          draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
      } else {
        insertIndex =
          draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
      }

      reordered.splice(insertIndex, 0, removed);

      // Use undoable action with cancelable toast
      await execute({
        title: draggedCampaign.title,
        undoSeconds: 3,
        loadingMessage: "Reordering campaigns...",
        action: async () => {
          // Update positions for all campaigns in this section
          const updatePromises = reordered.map((campaign, index) =>
            patchCampaign(selectedBrandId, campaign.id, { position: index })
          );

          await Promise.all(updatePromises);
          await queryClient.invalidateQueries({ queryKey: ["brands"] });
        },
        successMessage: "Campaign order updated",
        errorMessage: "Failed to reorder campaigns",
      });
    },
    [selectedBrandId, campaigns, execute, queryClient, reorderCampaigns]
  );

  const handleArchiveCampaign = useCallback(
    async (campaignId: string, shouldArchive: boolean) => {
      if (!selectedBrandId) return;

      const campaign = campaigns.find((c) => c.id === campaignId);
      if (!campaign) return;

      // Optimistically update the store immediately
      archiveCampaign(selectedBrandId, campaignId, shouldArchive);

      await execute({
        title: campaign.title,
        undoSeconds: 3,
        loadingMessage: `${shouldArchive ? "Archiving" : "Unarchiving"} "${
          campaign.title
        }"...`,
        action: async () => {
          await updateCampaign(selectedBrandId, campaignId, {
            is_archived: shouldArchive,
          });
          await queryClient.invalidateQueries({ queryKey: ["brands"] });
        },
        successMessage: `"${campaign.title}" ${
          shouldArchive ? "archived" : "unarchived"
        } successfully.`,
        errorMessage: `Failed to ${shouldArchive ? "archive" : "unarchive"} "${
          campaign.title
        }".`,
      });
    },
    [selectedBrandId, campaigns, execute, queryClient, archiveCampaign]
  );

  // Render content wrapped in DnD provider
  const renderContent = () => {
    // Show campaign view with sidebar
    if (selectedBrandId && selectedCampaignId) {
      return (
        <div className="flex gap-0 h-[calc(100vh-165px)] py-auto px-auto">
          <GallerySidebar
            selectedBrandId={selectedBrandId}
            selectedCampaignId={selectedCampaignId}
            activeTab={activeTab}
            onCampaignSelect={handleCampaignSelect}
            onTabChange={onTabChange}
            setInitialBrandId={setInitialBrandId}
            setSelectedCampaignInUrl={setSelectedCampaignInUrl}
            setSelectedFilters={setSelectedFilters}
            hasNoBrands={hasNoBrands}
            isCollapsed={isCollapsed}
            onToggleCollapsed={toggleCollapsed}
          />

          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <CampaignView
                selectedBrandId={selectedBrandId}
                brandName={brandName}
                campaignId={selectedCampaignId}
                activeTab={activeTab}
                onBackToCampaigns={handleBackToCampaigns}
                onUploadComplete={onUploadComplete}
                addToGallery={addToGallery}
                selectedMoodboardId={selecteMoodboardId}
                selectedSubFolderId={selectedSubFolderId}
                searchQuery={searchQuery}
                favorites={favorites}
                selectedFilters={selectedFilters}
                onTabChange={onTabChange}
                showHeader={false}
                handleSearchChange={handleSearchChange}
                showFilters={showFilters}
                setSelectedFilters={setSelectedFilters}
                galleryView={galleryView}
                setGalleryView={setGalleryView}
                setActiveTab={setActiveTab}
              />
            </div>
          </div>
        </div>
      );
    }

    // Show folder gallery with sidebar (brand selected, no campaign)
    if (selectedBrandId && isBrandsFetched) {
      return (
        <div className="w-full h-[calc(100vh-165px)] flex overflow-hidden">
          <GallerySidebar
            selectedBrandId={selectedBrandId}
            selectedCampaignId={null}
            activeTab={activeTab}
            onCampaignSelect={handleCampaignSelect}
            onTabChange={onTabChange}
            setInitialBrandId={setInitialBrandId}
            setSelectedCampaignInUrl={setSelectedCampaignInUrl}
            setSelectedFilters={setSelectedFilters}
            hasNoBrands={hasNoBrands}
            isCollapsed={isCollapsed}
            onToggleCollapsed={toggleCollapsed}
          />

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mt-1 mb-2">
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
                />

                <MediaViewsDropdown
                  galleryView={galleryView}
                  setGalleryView={setGalleryView}
                  selectedCampaignId={selectedCampaignId}
                />
              </div>
            </div>

            {/* Tabs removed - navigation now in sidebar */}

            {activeTab === "pexels" ? (
              <div className="overflow-y-auto">
                <TopicsGrid
                  selectedBrandId={selectedBrandId}
                  setActiveTab={setActiveTab}
                />
              </div>
            ) : (
              <div className="overflow-y-auto scrollbar">
                <div className="pl-4 flex-shrink-0">
                  <FolderUploadDropzone
                    activeTab={activeTab}
                    onUploadComplete={onUploadComplete}
                    addToGallery={addToGallery}
                    selectedBrandId={selectedBrandId}
                    selectedCampaignId={undefined}
                    selectedMoodboardId={selecteMoodboardId}
                  />
                </div>

                {/* 🎞️ Scrollable Gallery */}
                <div className="flex-1 pl-4 pb-4">
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
            )}
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

          {/* Tabs removed - navigation now in sidebar */}

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
  };

  return (
    <GalleryDndProvider
      galleryActions={galleryActions}
      selectedItems={selectedItems}
      setSelectedItems={setSelectedItems}
      orderBy={orderBy}
      totalItems={totalItemsCount}
      selectAllMode={selectAllMode}
      excludedItems={excludedItems}
      onMoveMediaToCampaign={handleMoveMediaToCampaign}
      onMoveMediaToTab={handleMoveMediaToTab}
      onReorderMedia={handleReorderMedia}
      onReorderCampaigns={handleReorderCampaigns}
      onArchiveCampaign={handleArchiveCampaign}
      campaigns={campaigns}
    >
      {renderContent()}
    </GalleryDndProvider>
  );
}
