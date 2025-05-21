"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UploadDropzone } from "./UploadDropzone";
import { SearchFilters } from "./SearchFilters";
import { MasonryGrid } from "./MasonryGrid";
import { BulkActions } from "./BulkActions";
import FilterSidebar from "./FilterSidebar";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useInView } from "react-intersection-observer";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { galleryService } from "@/services/api/gallery.service";
import type { GalleryItemResponse } from "@/types/gallery.types";

const ITEMS_PER_PAGE = 20;

export function MediaLibrary() {
  const [activeTab, setActiveTab] = useState("all-media");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<boolean>(false);
  const [source, setSource] = useState<string>("All");
  const [creator, setCreator] = useState<string>("Anyone");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    brands: [] as string[],
    categories: [] as string[],
    campaigns: [] as string[],
  });

  const queryClient = useQueryClient();

  // Fetch brands and campaigns for filters
  const { data: brandsData } = useQuery({
    queryKey: ["brands-campaigns"],
    queryFn: () => galleryService.getBrandsWithCampaigns(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Map active tab to asset types for filtering
  const getAssetTypesFromTab = () => {
    if (activeTab === "all-media") return undefined;
    return activeTab;
  };

  // Infinite query for gallery items with filters
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: [
        "gallery-items",
        activeTab,
        favorites,
        source,
        creator,
        searchQuery,
        selectedFilters,
      ],
      queryFn: async ({ pageParam = 0 }) => {
        // If search query is provided, use search endpoint
        if (searchQuery) {
          return galleryService.searchGalleryItems(
            searchQuery,
            pageParam,
            ITEMS_PER_PAGE
          );
        }

        // Otherwise use filter endpoint
        return galleryService.getAllGalleryItems({
          asset_sources: [getAssetTypesFromTab()].filter(
            (v): v is string => v !== undefined
          ),
          is_favourite: favorites || undefined,
          brand_names:
            selectedFilters.brands.length > 0
              ? selectedFilters.brands
              : undefined,
          campaign_names:
            selectedFilters.campaigns.length > 0
              ? selectedFilters.campaigns
              : undefined,
          skip: pageParam,
          limit: ITEMS_PER_PAGE,
        });
      },
      getNextPageParam: (lastPage) => {
        if (!lastPage.pagination.has_more) return undefined;
        return lastPage.pagination.skip + lastPage.pagination.limit;
      },
      initialPageParam: 0,
    });

  // Flatten all pages of gallery items
  const galleryItems = data?.pages.flatMap((page) => page.gallery_items) || [];

  // Setup intersection observer for infinite loading
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Toggle favorite mutation with optimistic updates
  const toggleFavoriteMutation = useMutation({
    mutationFn: (itemId: string) => galleryService.toggleFavorite(itemId),
    onMutate: async (itemId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["gallery-items"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData([
        "gallery-items",
        activeTab,
        favorites,
        source,
        creator,
        searchQuery,
        selectedFilters,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        [
          "gallery-items",
          activeTab,
          favorites,
          source,
          creator,
          searchQuery,
          selectedFilters,
        ],
        (old: any) => {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              gallery_items: page.gallery_items.map(
                (item: GalleryItemResponse) =>
                  item.id === itemId
                    ? { ...item, is_favourite: !item.is_favourite }
                    : item
              ),
            })),
          };
        }
      );

      // Return a context object with the snapshot
      return { previousData };
    },
    onError: (err, itemId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        [
          "gallery-items",
          activeTab,
          favorites,
          source,
          creator,
          searchQuery,
          selectedFilters,
        ],
        context?.previousData
      );
      toast.error("Failed to update favorite status");
    },
    onSuccess: (data) => {
      toast.success(
        data.is_favourite ? "Added to favorites" : "Removed from favorites"
      );
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => galleryService.deleteGalleryItem(itemId),
    onMutate: async (itemId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["gallery-items"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData([
        "gallery-items",
        activeTab,
        favorites,
        source,
        creator,
        searchQuery,
        selectedFilters,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        [
          "gallery-items",
          activeTab,
          favorites,
          source,
          creator,
          searchQuery,
          selectedFilters,
        ],
        (old: any) => {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              gallery_items: page.gallery_items.filter(
                (item: GalleryItemResponse) => item.id !== itemId
              ),
            })),
          };
        }
      );

      // Remove from selected items if present
      if (selectedItems.includes(itemId)) {
        setSelectedItems((prev) => prev.filter((id) => id !== itemId));
      }

      // Return a context object with the snapshot
      return { previousData };
    },
    onError: (err, itemId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        [
          "gallery-items",
          activeTab,
          favorites,
          source,
          creator,
          searchQuery,
          selectedFilters,
        ],
        context?.previousData
      );
      toast.error("Failed to delete item");
    },
    onSuccess: () => {
      toast.success("Item deleted successfully");
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      // Delete items one by one
      const promises = itemIds.map((id) =>
        galleryService.deleteGalleryItem(id)
      );
      return Promise.all(promises);
    },
    onMutate: async (itemIds) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["gallery-items"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData([
        "gallery-items",
        activeTab,
        favorites,
        source,
        creator,
        searchQuery,
        selectedFilters,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        [
          "gallery-items",
          activeTab,
          favorites,
          source,
          creator,
          searchQuery,
          selectedFilters,
        ],
        (old: any) => {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              gallery_items: page.gallery_items.filter(
                (item: GalleryItemResponse) => !itemIds.includes(item.id)
              ),
            })),
          };
        }
      );

      // Clear selected items
      setSelectedItems([]);

      // Return a context object with the snapshot
      return { previousData };
    },
    onError: (err, itemIds, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        [
          "gallery-items",
          activeTab,
          favorites,
          source,
          creator,
          searchQuery,
          selectedFilters,
        ],
        context?.previousData
      );
      toast.error("Failed to delete items");
    },
    onSuccess: (data) => {
      toast.success(`${data.length} items deleted successfully`);
    },
  });

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
    toggleFavoriteMutation.mutate(id);
  };

  const handleDeleteItem = (id: string) => {
    deleteItemMutation.mutate(id);
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;

    // Confirm before deleting
    if (
      confirm(`Are you sure you want to delete ${selectedItems.length} items?`)
    ) {
      bulkDeleteMutation.mutate(selectedItems);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

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

  const handleApplyFilters = (filters: any) => {
    setSelectedFilters(filters);
    setShowFilters(false);
  };

  // Download a single item
  const handleDownload = async (item: GalleryItemResponse) => {
    try {
      const response = await fetch(item.asset_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.asset_title}.${item.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Downloaded ${item.asset_title}`);
    } catch (error) {
      toast.error("Failed to download file");
      console.error("Download error:", error);
    }
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
        await handleDownload(item);
      }
      toast.success(`Downloaded ${selectedItems.length} items`);
    } catch (error) {
      toast.error("Failed to download some files");
      console.error("Bulk download error:", error);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto relative">
      <h1 className="text-2xl font-bold mb-4">Media library</h1>

      <Tabs
        defaultValue="all-media"
        value={activeTab}
        onValueChange={handleTabChange}
      >
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

        <TabsContent
          value={activeTab}
          className="p-3 rounded-3xl bg-white mt-0"
        >
          <UploadDropzone activeTab={activeTab} />

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

              {status === "pending" ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : status === "error" ? (
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
                    onDownload={handleDownload}
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
          onDelete={handleBulkDelete}
          onDownload={handleBulkDownload}
        />
      )}
    </div>
  );
}
