"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MediaUploadDropzone } from "./MediaUploadDropzone";
import { MediaSearchFilters } from "./MediaSearchFilters";
import { SortableMediaGrid } from "./SortableMediaGrid";

import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useGalleryQuery } from "@/hooks/useGallery";
import { useQueryClient } from "@tanstack/react-query";
import type {
  BrandCampaignListResponse,
  EnhancedSelectedFilters,
  GalleryItemResponse,
} from "@/types/gallery.types";
import { debounce } from "lodash";
import MediaLibraryTabs from "./MediaLibraryTabs";
import { MediaBulkActions } from "./MediaBulkActions";
import MediaFilterSidebar from "./MediaFilterSidebar";
import { MediaDialogMultiSelectHeader } from "./MediaDialogMultiSelectHeader";
import { MediaGalleryStatusDisplay } from "./MediaGalleryStatusDisplay";
import { MediaFolderView } from "./MediaFolderView";
import { useQueryState } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { MediaUploadBrandSelector } from "./MediaUploadBrandSelector";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";
import { useBrandStore } from "@/store/brand.store";
import TopicsGrid from "./PexelsTopicGrid";

type MediaLibraryProps = {
  activeTab?: string;
  isMediaSelectDialog?: boolean;
  onMediaItemSelected?: (url: string) => void;
  onFullMediaItemSelected?: (item: GalleryItemResponse) => void;
  onMultipleMediaItemsSelected?: (items: GalleryItemResponse[]) => void;
  filters?: EnhancedSelectedFilters;
  brandId?: string;
  campaignId?: string;
  moodboardId?: string;
  inSelectionGalleryIds?: string[];
  isMultiSelect?: boolean;
  maxSelectionCount?: number;
  hideHeader?: boolean; // 👈 Added this prop
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
  hideHeader = false, // 👈 Added default value
}: MediaLibraryProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [multiSelectItems, setMultiSelectItems] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<boolean>(false);
  const [source, setSource] = useState<string>(activeTab);
  const [creator, setCreator] = useState<string>("Anyone");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaignId);
  const [initialWorkflowStatus, setInitialWorkflowStatus] = useQueryState<
    string[]
  >("status", {
    defaultValue: [],
    parse: (value) => (value ? value.split(",") : []),
    serialize: (value) => value.join(","),
    history: "push",
  });
  const [initialBrandId, setInitialBrandId] = useQueryState<string | undefined>(
    "brandId",
    {
      defaultValue: undefined,
      parse: (value) => (value ? value : undefined),
      serialize: (value) => value || "",
      history: "push",
    }
  );

  const { selectedBrandId } = useBrandStore();

  // Priority logic: initialBrandId takes precedence over selectedBrandId
  const effectiveBrandId = useMemo(() => {
    return initialBrandId || selectedBrandId;
  }, [initialBrandId, selectedBrandId]);

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

  const queryClient = useQueryClient();

  // Use our custom hook for data fetching and mutations
  const galleryActions = useGalleryQuery({
    assetType: activeTab,
    favorites,
    source,
    creator,
    searchQuery,
    selectedFilters,
  });

  const galleryItems = galleryActions.getGalleryItems();

  useEffect(() => {
    if (effectiveBrandId || initialWorkflowStatus.length > 0) {
      // Find the brand from the brands data using the effective brand ID
      const brandToSelect = galleryActions.brandsData?.brands.find(
        (b) => b.brand_id === effectiveBrandId
      );

      if (brandToSelect && brandToSelect.brand_id !== selectedBrand?.brand_id) {
        setSelectedBrand(brandToSelect);
      }

      setSelectedFilters((prev) => {
        const newFilters = {
          ...prev,
          workflow_status:
            initialWorkflowStatus?.map((s) => s.trim()) || prev.workflow_status,
          brands: effectiveBrandId ? [effectiveBrandId] : prev.brands,
        };

        // Only update if something actually changed
        if (JSON.stringify(newFilters) !== JSON.stringify(prev)) {
          return newFilters;
        }
        return prev;
      });
    }
  }, [
    initialWorkflowStatus,
    effectiveBrandId,
    galleryActions.brandsData?.brands,
    selectedBrand?.brand_id, // Add this dependency
  ]);

  const selectedBrandName = selectedBrand?.brand_name || "brand";

  // Function to refresh brand data and update selectedBrand
  const handleRefreshBrandData = async () => {
    try {
      // Invalidate and refetch brands query to bypass cache
      await queryClient.invalidateQueries({
        queryKey: ["brands-campaigns"],
      });

      // Small delay to ensure invalidation is processed
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Refetch brands data and get the result
      const { data: freshBrandsData } = await galleryActions.brandsRefetch();

      // Update selectedBrand with fresh data immediately
      if (selectedBrand?.brand_id && freshBrandsData?.brands) {
        const updatedBrand = freshBrandsData.brands.find(
          (b) => b.brand_id === selectedBrand.brand_id
        );
        if (updatedBrand) {
          setSelectedBrand(updatedBrand);
        }
      }
    } catch (error) {
      console.error("Failed to refresh brand data:", error);
    }
  };

  // Setup intersection observer for infinite loading
  const { ref, inView } = useInView();

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
    galleryActions.fetchNextPage,
    galleryActions.hasNextPage,
    galleryActions.isFetchingNextPage,
  ]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedItems([]);
    setMultiSelectItems([]);

    // Reset filters from notification when switching tabs
    setInitialWorkflowStatus([]);

    // Preserve brand-related filters when switching tabs
    setSelectedFilters((currentFilters) => ({
      ...initialFilters,
      // Preserve brand-related filters
      brands: currentFilters.brands,
      campaigns: currentFilters.campaigns,
      // Also preserve workflow_status if it came from URL params
      //(If needed)

      // workflow_status:
      //   initialWorkflowStatus.length > 0
      //     ? initialWorkflowStatus
      //     : initialFilters.workflow_status,
    }));
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

  const handleSearchChange = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query);
      }, 500),
    []
  );

  useEffect(() => {
    setSelectedFilters((prev) => ({
      ...prev,
      brands: prev.brands.slice(0, 1),
      campaigns: prev.campaigns.slice(0, 1),
    }));
  }, [searchQuery]);

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

  // Handle multi-select "Add" button
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

  // Get the actual selected items data
  const selectedItemsData = galleryItems.filter((item) =>
    currentlySelectedItems.includes(item.id)
  );

  const [localGalleryView, setLocalGalleryView] = useLocalStorage<
    "grid" | "folder"
  >("gallery-view-mode", "grid");

  // URL query state
  const [galleryView, setGalleryViewRaw] = useQueryState<"grid" | "folder">(
    "view",
    {
      parse: (value) =>
        value === "grid" || value === "folder" ? value : "grid",
      serialize: (value) => value,
      history: "push",
      defaultValue: localGalleryView, // load from localStorage
    }
  );

  const setGalleryView = (value: "grid" | "folder") => {
    setLocalGalleryView(value);
    setGalleryViewRaw(value);
  };

  // Handle navigation to brand onboarding
  const handleOnboardBrand = () => {
    router.push("/");
  };

  // Check if there are no brands available
  const hasNoBrands = (galleryActions.brandsData?.brands?.length ?? 0) === 0;

  const { user } = useUserStore();

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto relative">
      {/* Conditionally render header based on hideHeader prop */}
      {!hideHeader && (
        <div className="flex justify-between mb-2">
          <div className="flex flex-row gap-x-4">
            <h1 className="text-2xl font-bold">Media library</h1>
            {!hasNoBrands && galleryView === "grid" && (
              <MediaUploadBrandSelector
                selectedBrand={selectedBrand}
                setSelectedBrand={setSelectedBrand}
                brands={galleryActions.brandsData?.brands || []}
                brandsLoading={galleryActions.brandsLoading}
                setSelectedCampaignId={setSelectedCampaignId}
                selectedCampaignId={selectedCampaignId}
                selectedFilters={selectedFilters}
                setSelectedFilters={setSelectedFilters}
                preSelectedBrandId={brandId || effectiveBrandId}
                setInitialWorkflowStatus={setInitialWorkflowStatus}
                setInitialBrandId={setInitialBrandId}
              />
            )}
          </div>
          <Select
            value={galleryView}
            onValueChange={(val) => setGalleryView(val as "grid" | "folder")}
          >
            <SelectTrigger className="w-[130px] text-purple-600 border-purple-600">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grid View</SelectItem>
              <SelectItem value="folder">Folder View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {/* Optional: Simple header for dialog mode */}
      {hideHeader && isMediaSelectDialog && (
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Select Media</h2>
        </div>
      )}

      {/* Show no brands message */}
      {hasNoBrands && !galleryActions.brandsLoading ? (
        <div className="flex h-[75vh] flex-col items-center justify-center text-center space-y-4 px-4">
          <h2 className="text-xl font-semibold text-gray-800">
            No brand access or onboarded brands
          </h2>
          <p className="text-gray-600 max-w-md">
            You haven&apos;t been given access to any brands or haven&apos;t
            onboarded a brand yet. Please onboard a brand to get started and
            begin uploading your media.
          </p>
          <Button onClick={handleOnboardBrand}>Onboard Brand</Button>
        </div>
      ) : (
        <>
          {/* Only show folder view if header is not hidden */}
          {!hideHeader && galleryView === "folder" && (
            <div>
              <MediaFolderView
                activeTab={activeTab}
                selectedBrand={selectedBrand}
                setSelectedBrand={setSelectedBrand}
                brands={galleryActions.brandsData?.brands || []}
                brandsLoading={galleryActions.brandsLoading}
                selectedCampaignId={selectedCampaignId}
                selecteMoodboardId={moodboardId}
                galleryView={galleryView}
                brandName={selectedBrandName}
                isUrlDialogOpen={isUrlDialogOpen} // Use state variable
                setIsUrlDialogOpen={setIsUrlDialogOpen}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                favorites={favorites}
                onFavoritesChange={handleFavoritesChange}
                selectedFilters={selectedFilters}
                setSelectedFilters={setSelectedFilters}
                setInitialWorkflowStatus={setInitialWorkflowStatus}
                onTabChange={handleTabChange}
                selectedBrandId={effectiveBrandId!}
                onRefreshData={handleRefreshBrandData}
              />
            </div>
          )}

          {/* Force grid view when hideHeader is true, otherwise respect galleryView */}
          {(hideHeader || galleryView === "grid") && (
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
                {activeTab !== "pexels" &&
                  (activeTab !== "a2i-media" ||
                    user?.role.id === UserRoleId.ADMIN) && (
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
                      selectedBrand={selectedBrand}
                      setSelectedBrand={setSelectedBrand}
                      brands={galleryActions.brandsData?.brands || []}
                      brandsLoading={galleryActions.brandsLoading}
                      selectedCampaignId={selectedCampaignId}
                      selecteMoodboardId={moodboardId}
                    />
                  )}

                {activeTab === "pexels" ? (
                  <TopicsGrid
                    selectedBrand={selectedBrand}
                    selectedCampaignId={selectedCampaignId}
                    selecteMoodboardId={moodboardId}
                    setActiveTab={setActiveTab}
                    isMultiSelect={isMultiSelect}
                    isMediaSelectDialog={isMediaSelectDialog}
                    currentSelectionCount={currentSelectionCount}
                    inSelectionGalleryIds={inSelectionGalleryIds}
                    onMultipleMediaItemsSelected={onMultipleMediaItemsSelected}
                  />
                ) : (
                  <div className="flex flex-col md:flex-row gap-4">
                    <div
                      className={`${
                        showFilters ? "w-full md:w-1/4" : "hidden"
                      } transition-all duration-300 ease-in-out`}
                    >
                      <div className="md:hidden flex justify-between items-center mb-2">
                        <h3 className="font-medium">Filters</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleFilters}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <MediaFilterSidebar
                        selectedFilters={selectedFilters}
                        onApply={handleApplyFilters}
                        brandsWithCampaigns={
                          galleryActions.brandsData?.brands || []
                        }
                        product_categories={
                          galleryActions.brandsData?.product_categories || []
                        }
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
                        setSelectedFilters={setSelectedFilters}
                        setInitialWorkflowStatus={setInitialWorkflowStatus}
                        isMediaSelectDialog={isMediaSelectDialog}
                      />

                      <MediaDialogMultiSelectHeader
                        isActive={isMultiSelect && isMediaSelectDialog}
                        currentSelectionCount={currentSelectionCount}
                        onClearSelection={handleUnselectAll}
                        onAddSelectedItems={handleAddSelectedItems}
                        totalAssets={
                          inSelectionGalleryIds.length + currentSelectionCount
                        }
                      />

                      <MediaGalleryStatusDisplay
                        galleryStatus={galleryActions.galleryStatus}
                        galleryItemsLength={galleryItems.length}
                      />

                      {galleryActions.galleryStatus === "success" &&
                        galleryItems.length > 0 && (
                          <div>
                            {selectedBrand && (
                              <SortableMediaGrid
                                galleryActions={galleryActions}
                                selectedItems={currentlySelectedItems}
                                onSelect={handleSelect}
                                isMediaSelectDialog={isMediaSelectDialog}
                                isMultiSelect={isMultiSelect}
                                inSelectionGalleryIds={inSelectionGalleryIds}
                                maxSelectionCount={maxSelectionCount}
                              />
                            )}
                            {/* Infinite scroll loading indicator */}
                            {galleryActions.hasNextPage && (
                              <div
                                ref={ref}
                                className="flex justify-center items-center py-8"
                              >
                                {galleryActions.isFetchingNextPage ? (
                                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                                ) : (
                                  <p className="text-sm text-gray-500">
                                    Load more
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </>
      )}

      {/* Bulk actions - show for non-dialog mode or single-select dialog mode */}
      {currentSelectionCount > 0 &&
        (!isMediaSelectDialog || !isMultiSelect) && (
          <MediaBulkActions
            selectedItems={selectedItemsData}
            onUnselectAll={handleUnselectAll}
            galleryActions={galleryActions}
            brandName={selectedBrandName}
          />
        )}
    </div>
  );
}
