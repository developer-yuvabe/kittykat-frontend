"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UploadDropzone } from "./UploadDropzone";
import { SearchFilters } from "./SearchFilters";
import { MasonryGrid } from "./MasonryGrid";
import { BulkActions } from "./BulkActions";
import FilterSidebar from "./FilterSidebar";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useGalleryQuery } from "@/hooks/useGallery";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import {
  BrandCampaignListResponse,
  EnhancedSelectedFilters,
} from "@/types/gallery.types";
import { debounce } from "lodash";

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
  } = useGalleryQuery({
    assetType: activeTab,
    favorites,
    source,
    creator,
    searchQuery,
    selectedFilters,
  });

  console.log("Gallery items:", galleryItems);

  useEffect(() => {
    if (!brandsLoading && brandsData?.brands?.length && !selectedBrand) {
      console.log("Brands list:", brandsData.brands);
      setSelectedBrand(brandsData.brands[0]);
    }
  }, [brandsLoading, brandsData, selectedBrand]);

  useEffect(() => {
    if (selectedBrand) {
      console.log("Selected brand updated:", selectedBrand);
    }
  }, [selectedBrand]);

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
      await bulkDelete(selectedItems);
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
    [] // add dependencies if needed
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

  useEffect(() => {
    setSource(activeTab);
    console.log("so", activeTab, source);
  }, [activeTab, handleTabChange]);
  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto relative">
      <div></div>

      <Tabs
        defaultValue="all-media"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <div
          className={`${
            isMediaSelectDialog ? " sticky top-0 z-40 bg-white" : ""
          }`}
        >
          <h1 className="text-2xl font-bold mb-4">Media library</h1>
          <TabsList className="mb-4 border-b w-full justify-start rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger
              value="all-media"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#636AE8] data-[state=active]:shadow-none data-[state=active]:text-[#636AE8] data-[state=active]:bg-[#F3F4F6FF] px-4 py-2 h-auto bg-transparent"
            >
              All Media
            </TabsTrigger>
            <TabsTrigger
              value="moodboard"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#636AE8] data-[state=active]:shadow-none data-[state=active]:text-[#636AE8] data-[state=active]:bg-[#F3F4F6FF] px-4 py-2 h-auto bg-transparent"
            >
              Moodboards
            </TabsTrigger>
            <TabsTrigger
              value="images"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#636AE8] data-[state=active]:shadow-none data-[state=active]:text-[#636AE8] data-[state=active]:bg-[#F3F4F6FF] px-4 py-2 h-auto bg-transparent"
            >
              Images
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#636AE8] data-[state=active]:shadow-none data-[state=active]:text-[#636AE8] data-[state=active]:bg-[#F3F4F6FF] px-4 py-2 h-auto bg-transparent"
            >
              Videos
            </TabsTrigger>
            <TabsTrigger
              value="models"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#636AE8] data-[state=active]:shadow-none data-[state=active]:text-[#636AE8] data-[state=active]:bg-[#F3F4F6FF] px-4 py-2 h-auto bg-transparent"
            >
              Models
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-b-[#636AE8] data-[state=active]:shadow-none data-[state=active]:text-[#636AE8] data-[state=active]:bg-[#F3F4F6FF] px-4 py-2 h-auto bg-transparent"
            >
              Products
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value={activeTab}
          className="p-3 rounded-3xl bg-white mt-0"
        >
          <UploadDropzone
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
              <FilterSidebar
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
              <SearchFilters
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
                <div className="flex justify-center items-center py-20">
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
                  <MasonryGrid
                    items={galleryItems}
                    selectedItems={selectedItems}
                    onSelect={handleSelect}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDeleteItem}
                    onDownload={downloadItem}
                    isMediaSelectDialog={isMediaSelectDialog}
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
        <BulkActions
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
