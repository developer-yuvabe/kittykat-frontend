"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MediaUploadDropzone } from "./MediaUploadDropzone";
import { MediaSearchFilters } from "./MediaSearchFilters";
import { MediaGrid } from "./MediaGrid";

import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useGalleryQuery } from "@/hooks/useGallery";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import type {
  BrandCampaignListResponse,
  EnhancedSelectedFilters,
} from "@/types/gallery.types";
import { debounce } from "lodash";
import MediaLibraryTabs from "./MediaLibraryTabs";
import { MediaBulkActions } from "./MediaBulkActions";
import MediaFilterSidebar from "./MediaFilterSidebar";

type MediaLibraryProps = {
  activeTab?: string;
  isMediaSelectDialog?: boolean;
};

export function MediaLibrary({
  activeTab: initialTab = "all-media",
  isMediaSelectDialog = false,
}: MediaLibraryProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [favorites, setFavorites] = useState<boolean>(false);
  const [source, setSource] = useState<string>(activeTab);
  const [creator, setCreator] = useState<string>("Anyone");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const [selectedFilters, setSelectedFilters] =
    useState<EnhancedSelectedFilters>({
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
    });

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

  useEffect(() => {
    if (!brandsLoading && brandsData?.brands?.length && !selectedBrand) {
      setSelectedBrand(brandsData.brands[0]);
    }
  }, [brandsLoading, brandsData, selectedBrand]);

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
  };

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

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
  };

  const handleDeleteItem = (id: string) => {
    deleteItem(id);
    // Remove from selected if needed
    if (selectedItems.includes(id)) {
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      bulkDelete(selectedItems);
      setSelectedItems([]);
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedItems.length > 0) {
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
    if (selectedItems.length === 0) return;

    const selectedItemsData = galleryItems.filter((item) =>
      selectedItems.includes(item.id)
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

  const handleEditTitle = async (
    itemId: string,
    newTitle: string
  ): Promise<void> => {
    patchItem({
      itemId,
      data: { asset_title: newTitle },
    });
  };

  const handleAddComment = async (
    itemId: string,
    text: string
  ): Promise<void> => {
    addComment({
      itemId,
      commentData: { text },
    });
  };

  const handleUpdateComment = async (
    itemId: string,
    commentId: string,
    text: string
  ): Promise<void> => {
    updateComment({
      itemId,
      commentId,
      commentData: { text },
    });
  };

  const handleDeleteComment = async (
    itemId: string,
    commentId: string
  ): Promise<void> => {
    deleteComment({
      itemId,
      commentId,
    });
  };

  useEffect(() => {
    setSource(activeTab);
  }, [activeTab]);

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
                    selectedItems={selectedItems}
                    onSelect={handleSelect}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDeleteItem}
                    onDownload={downloadItem}
                    isMediaSelectDialog={isMediaSelectDialog}
                    handleUpdateTitle={handleEditTitle}
                    handleUpdateComment={handleUpdateComment}
                    handleDeleteComment={handleDeleteComment}
                    handleAddComment={handleAddComment}
                    handleUpdatePartialData={patchItem}
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

      {selectedItems.length > 0 && (
        <MediaBulkActions
          selectedCount={selectedItems.length}
          onUnselectAll={handleUnselectAll}
          onDelete={handleBulkDeleteClick}
          onDownload={handleBulkDownload}
        />
      )}
      <ReusableAlertDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Delete Items"
        description={`Are you sure you want to delete ${selectedItems.length} item(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        danger
      />
    </div>
  );
}
