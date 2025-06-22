"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MediaUploadDropzone } from "./MediaUploadDropzone";
import { MediaSearchFilters } from "./MediaSearchFilters";
import { MediaGrid } from "./MediaGrid";

import { Button } from "@/components/ui/button";
import { X, Loader2, Plus } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useGalleryQuery } from "@/hooks/useGallery";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import type {
  BrandCampaignListResponse,
  EnhancedSelectedFilters,
  GalleryItemResponse,
} from "@/types/gallery.types";
import { debounce } from "lodash";
import MediaLibraryTabs from "./MediaLibraryTabs";
import { MediaBulkActions } from "./MediaBulkActions";
import MediaFilterSidebar from "./MediaFilterSidebar";
import { createMediaItemHelper } from "@/lib/gallery.utils";

type MediaLibraryProps = {
  activeTab?: string;
  isMediaSelectDialog?: boolean;
  onMediaItemSelected?: (url: string) => void;
  onFullMediaItemSelected?: (item: GalleryItemResponse) => void;
  onMultipleMediaItemsSelected?: (items: GalleryItemResponse[]) => void; // 👈 new prop for multi-select
  filters?: EnhancedSelectedFilters;
  brandId?: string;
  campaignId?: string;
  moodboardId?: string;
  inSelectionGalleryIds?: string[]; // gallery item ids that are already selected
  isMultiSelect?: boolean; // 👈 new prop to enable multi-select mode
  maxSelectionCount?: number;
};

export function MediaLibrary({
  activeTab: initialTab = "all-media",
  isMediaSelectDialog = false,
  onMediaItemSelected,
  onFullMediaItemSelected,
  onMultipleMediaItemsSelected,
  filters,
  brandId,
  campaignId,
  moodboardId,
  inSelectionGalleryIds = [],
  isMultiSelect = false,
  maxSelectionCount,
}: MediaLibraryProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [multiSelectItems, setMultiSelectItems] = useState<string[]>([]); // 👈 separate state for multi-select
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [favorites, setFavorites] = useState<boolean>(false);
  const [source, setSource] = useState<string>(activeTab);
  const [creator, setCreator] = useState<string>("Anyone");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const initialFilters = useMemo(() => {
    return (
      filters ?? {
        brands: [],
        campaigns: [],
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
        moodboards: [],
      }
    );
  }, [filters]);

  const [selectedFilters, setSelectedFilters] =
    useState<EnhancedSelectedFilters>(initialFilters);

  const [selectedBrand, setSelectedBrand] = useState<
    BrandCampaignListResponse["brands"][number] | null
  >(null);

  // Use our custom hook for data fetching and mutations
  const {
    brandsData,
    brandsLoading,
    galleryItems,
    galleryStatus,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    toggleFavorite,
    deleteItem,
    bulkDelete,
    downloadItem,
    patchItem,
    addComment,
    deleteComment,
    updateComment,
  } = useGalleryQuery({
    assetType: activeTab,
    favorites,
    source,
    creator,
    searchQuery,
    selectedFilters,
  });

  const mediaHelper = createMediaItemHelper({
    patchItem,
    addComment,
    updateComment,
    deleteComment,
    toggleFavorite,
    bulkDelete,
    deleteItem,
  });

  useEffect(() => {
    if (!brandsLoading && brandsData?.brands?.length && !selectedBrand) {
      // If brandId is provided, try to find that brand
      if (brandId) {
        const matchedBrand = brandsData.brands.find(
          (brand) => brand.brand_id === brandId
        );
        if (matchedBrand) {
          setSelectedBrand(matchedBrand);
          return;
        }
      }

      // Fallback: Select first brand
      setSelectedBrand(brandsData.brands[0]);
    }
  }, [brandsLoading, brandsData, brandId, selectedBrand]);

  // Setup intersection observer for infinite loading
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedItems([]);
    setMultiSelectItems([]);
  };

  const handleSelect = (id: string, selected: boolean) => {
    if (isMultiSelect) {
      // Multi-select mode: manage separate multi-select state
      if (selected) {
        setMultiSelectItems((prev) => [...prev, id]);
      } else {
        setMultiSelectItems((prev) => prev.filter((itemId) => itemId !== id));
      }
    } else {
      // Single select mode: existing behavior
      if (selected) {
        setSelectedItems((prev) => [...prev, id]);
      } else {
        setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
      }
    }
  };

  const handleUnselectAll = () => {
    setSelectedItems([]);
    setMultiSelectItems([]);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const itemsToDelete = isMultiSelect ? multiSelectItems : selectedItems;
      bulkDelete(itemsToDelete);
      setSelectedItems([]);
      setMultiSelectItems([]);
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
    }
  };

  const handleBulkDeleteClick = () => {
    const itemsToDelete = isMultiSelect ? multiSelectItems : selectedItems;
    if (itemsToDelete.length > 0) {
      setIsDialogOpen(true);
    }
  };

  const handleSearchChange = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query);
      }, 500),
    []
  );

  const handleSourceChange = (value: string) => {
    setSource(value);
  };

  const handleCreatorChange = (value: string) => {
    setCreator(value);
  };

  const handleFavoritesChange = (checked: boolean) => {
    setFavorites(checked);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleApplyFilters = (filters: EnhancedSelectedFilters) => {
    setSelectedFilters(filters);
  };

  // Bulk download selected items
  const handleBulkDownload = async () => {
    const itemsToDownload = isMultiSelect ? multiSelectItems : selectedItems;
    if (itemsToDownload.length === 0) return;

    const selectedItemsData = galleryItems.filter((item) =>
      itemsToDownload.includes(item.id)
    );

    try {
      // For each selected item, trigger a download
      for (const item of selectedItemsData) {
        await downloadItem(item);
      }
    } catch (error) {
      console.error("Bulk download error:", error);
    }
  };

  // 👈 Handle multi-select "Add" button
  const handleAddSelectedItems = () => {
    if (isMultiSelect && multiSelectItems.length > 0) {
      const selectedItemsData = galleryItems.filter((item) =>
        multiSelectItems.includes(item.id)
      );
      onMultipleMediaItemsSelected?.(selectedItemsData);
      setMultiSelectItems([]);
    }
  };

  useEffect(() => {
    setSource(activeTab);
  }, [activeTab]);

  // Handle single select mode
  useEffect(() => {
    if (isMediaSelectDialog && !isMultiSelect && selectedItems.length > 0) {
      const selectedItem = galleryItems.find((item) =>
        selectedItems.includes(item.id)
      );

      if (selectedItem) {
        onMediaItemSelected?.(selectedItem.asset_url);
        onFullMediaItemSelected?.(selectedItem);
        setSelectedItems([]);
      }
    }
  }, [
    isMediaSelectDialog,
    isMultiSelect,
    selectedItems,
    galleryItems,
    onMediaItemSelected,
    onFullMediaItemSelected,
  ]);

  // Determine which items are currently selected for display
  const currentlySelectedItems = isMultiSelect
    ? multiSelectItems
    : selectedItems;
  const currentSelectionCount = currentlySelectedItems.length;

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto relative">
      <Tabs
        defaultValue="all-media"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <MediaLibraryTabs />
        <TabsContent
          value={activeTab}
          className="p-3 rounded-3xl bg-white mt-0"
        >
          <MediaUploadDropzone
            activeTab={activeTab}
            galleryFilters={{
              assetType: activeTab,
              favorites,
              source,
              creator,
              searchQuery,
              selectedFilters,
            }}
            source={source}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            brands={brandsData?.brands || []}
            brandsLoading={brandsLoading}
            selectedCampaignId={campaignId}
            selecteMoodboardId={moodboardId}
          />

          <div className="flex flex-col md:flex-row gap-4">
            <div
              className={`${
                showFilters ? "w-full md:w-1/4" : "hidden"
              } transition-all duration-300 ease-in-out`}
            >
              <div className="md:hidden flex justify-between items-center mb-2">
                <h3 className="font-medium">Filters</h3>
                <Button variant="ghost" size="sm" onClick={toggleFilters}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <MediaFilterSidebar
                selectedFilters={selectedFilters}
                onApply={handleApplyFilters}
                brandsWithCampaigns={brandsData?.brands || []}
                product_categories={brandsData?.product_categories || []}
                setShowFilter={setShowFilters}
              />
            </div>

            <div
              className={`${
                showFilters ? "w-full md:w-3/4" : "w-full"
              } transition-all duration-300 ease-in-out`}
            >
              <MediaSearchFilters
                onSearchChange={handleSearchChange}
                onSourceChange={handleSourceChange}
                onCreatorChange={handleCreatorChange}
                onFavoritesChange={handleFavoritesChange}
                onToggleFilters={toggleFilters}
                source={source}
                creator={creator}
                favorites={favorites}
                showFilters={showFilters}
                selectedFilters={selectedFilters}
              />

              {/* 👈 Multi-select mode header */}
              {isMultiSelect && isMediaSelectDialog && (
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Multi-select mode
                    </span>
                    {currentSelectionCount > 0 && (
                      <span className="text-sm text-gray-500">
                        ({currentSelectionCount} selected)
                      </span>
                    )}
                  </div>
                  {currentSelectionCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUnselectAll}
                      >
                        Clear Selection
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddSelectedItems}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Selected ({currentSelectionCount})
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {galleryStatus === "pending" ? (
                <div className="flex justify-center items-center py-36 2xl:py-60">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : galleryStatus === "error" ? (
                <div className="flex justify-center items-center py-20">
                  <p className="text-red-500">Error loading gallery items</p>
                </div>
              ) : galleryItems.length === 0 ? (
                <div className="flex justify-center items-center py-20">
                  <p className="text-gray-500">No items found</p>
                </div>
              ) : (
                <>
                  <MediaGrid
                    items={galleryItems}
                    selectedItems={currentlySelectedItems}
                    onSelect={handleSelect}
                    onToggleFavorite={mediaHelper.toggleFavorite}
                    onDelete={mediaHelper.deleteItem}
                    onDownload={downloadItem}
                    isMediaSelectDialog={isMediaSelectDialog}
                    handleUpdateTitle={mediaHelper.editTitle}
                    handleUpdateComment={mediaHelper.updateComment}
                    handleDeleteComment={mediaHelper.deleteComment}
                    handleAddComment={mediaHelper.addComment}
                    handleUpdatePartialData={patchItem}
                    isMultiSelect={isMultiSelect}
                    inSelectionGalleryIds={inSelectionGalleryIds}
                    maxSelectionCount={maxSelectionCount}
                  />

                  {/* Infinite scroll loading indicator */}
                  {hasNextPage && (
                    <div
                      ref={ref}
                      className="flex justify-center items-center py-8"
                    >
                      {isFetchingNextPage ? (
                        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                      ) : (
                        <p className="text-sm text-gray-500">Load more</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bulk actions - show for non-dialog mode or single-select dialog mode */}
      {currentSelectionCount > 0 &&
        (!isMediaSelectDialog || !isMultiSelect) && (
          <MediaBulkActions
            selectedCount={currentSelectionCount}
            onUnselectAll={handleUnselectAll}
            onDelete={handleBulkDeleteClick}
            onDownload={handleBulkDownload}
          />
        )}

      <ReusableAlertDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Delete Items"
        description={`Are you sure you want to delete ${currentSelectionCount} item(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        danger
      />
    </div>
  );
}
