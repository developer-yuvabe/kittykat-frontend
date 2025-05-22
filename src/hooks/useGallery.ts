import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { galleryService } from "@/services/api/gallery.service";
import type { GalleryItem, GalleryItemResponse } from "@/types/gallery.types";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 20;

export type GalleryFilters = {
  assetType?: string;
  favorites?: boolean;
  source?: string;
  creator?: string;
  searchQuery?: string;
  selectedFilters?: {
    brands: string[];
    categories: string[];
    campaigns: string[];
  };
};

export const useGalleryQuery = (filters: GalleryFilters) => {
  const queryClient = useQueryClient();

  // Fetch brands and campaigns for filters
  const brandsQuery = useQuery({
    queryKey: ["brands-campaigns"],
    queryFn: () => galleryService.getBrandsWithCampaigns(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Map asset type for filtering
  const getAssetTypesFromFilter = () => {
    if (!filters.assetType || filters.assetType === "all-media")
      return undefined;
    return filters.assetType;
  };

  // Infinite query for gallery items with filters
  const galleryQuery = useInfiniteQuery({
    queryKey: [
      "gallery-items",
      filters.assetType,
      filters.favorites,
      filters.source,
      filters.creator,
      filters.searchQuery,
      filters.selectedFilters,
    ],
    queryFn: async ({ pageParam = 0 }) => {
      // If search query is provided, use search endpoint
      if (filters.searchQuery) {
        return galleryService.searchGalleryItems(
          filters.searchQuery,
          pageParam,
          ITEMS_PER_PAGE
        );
      }

      // Otherwise use filter endpoint
      return galleryService.getAllGalleryItems({
        asset_sources: [getAssetTypesFromFilter()].filter(
          (v): v is string => v !== undefined
        ),
        is_favourite: filters.favorites || undefined,
        brand_names: filters.selectedFilters?.brands.length
          ? filters.selectedFilters.brands
          : undefined,
        campaign_names: filters.selectedFilters?.campaigns.length
          ? filters.selectedFilters.campaigns
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
  const galleryItems =
    galleryQuery.data?.pages.flatMap((page) => page.gallery_items) || [];

  // Toggle favorite mutation with optimistic updates
  const toggleFavoriteMutation = useMutation({
    mutationFn: (itemId: string) => galleryService.toggleFavorite(itemId),
    onMutate: async (itemId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["gallery-items"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData([
        "gallery-items",
        filters.assetType,
        filters.favorites,
        filters.source,
        filters.creator,
        filters.searchQuery,
        filters.selectedFilters,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        [
          "gallery-items",
          filters.assetType,
          filters.favorites,
          filters.source,
          filters.creator,
          filters.searchQuery,
          filters.selectedFilters,
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
          filters.assetType,
          filters.favorites,
          filters.source,
          filters.creator,
          filters.searchQuery,
          filters.selectedFilters,
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
        filters.assetType,
        filters.favorites,
        filters.source,
        filters.creator,
        filters.searchQuery,
        filters.selectedFilters,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        [
          "gallery-items",
          filters.assetType,
          filters.favorites,
          filters.source,
          filters.creator,
          filters.searchQuery,
          filters.selectedFilters,
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

      // Return a context object with the snapshot
      return { previousData };
    },
    onError: (err, itemId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        [
          "gallery-items",
          filters.assetType,
          filters.favorites,
          filters.source,
          filters.creator,
          filters.searchQuery,
          filters.selectedFilters,
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
        filters.assetType,
        filters.favorites,
        filters.source,
        filters.creator,
        filters.searchQuery,
        filters.selectedFilters,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        [
          "gallery-items",
          filters.assetType,
          filters.favorites,
          filters.source,
          filters.creator,
          filters.searchQuery,
          filters.selectedFilters,
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

      // Return a context object with the snapshot
      return { previousData };
    },
    onError: (err, itemIds, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        [
          "gallery-items",
          filters.assetType,
          filters.favorites,
          filters.source,
          filters.creator,
          filters.searchQuery,
          filters.selectedFilters,
        ],
        context?.previousData
      );
      toast.error("Failed to delete items");
    },
    onSuccess: (data) => {
      toast.success(`${data.length} items deleted successfully`);
    },
  });

  // Download helpers
  const downloadItem = async (item: GalleryItemResponse) => {
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
      return true;
    } catch (error) {
      toast.error("Failed to download file");
      console.error("Download error:", error);
      return false;
    }
  };

  // Add new gallery item mutation
  const addToGalleryMutation = useMutation({
    mutationFn: (newItem: GalleryItem) =>
      galleryService.createGalleryItem(newItem),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "gallery-items",
          filters.assetType,
          filters.favorites,
          filters.source,
          filters.creator,
          filters.searchQuery,
          filters.selectedFilters,
        ],
      });
      toast.success("Item added to gallery");
    },
    onError: () => {
      toast.error("Failed to add item to gallery");
    },
  });

  return {
    // Queries
    brandsData: brandsQuery.data,
    brandsLoading: brandsQuery.isLoading,

    // Gallery items
    galleryItems,
    galleryStatus: galleryQuery.status,
    isFetchingNextPage: galleryQuery.isFetchingNextPage,
    hasNextPage: galleryQuery.hasNextPage,
    fetchNextPage: galleryQuery.fetchNextPage,

    // Mutations
    addToGallery: addToGalleryMutation.mutate,
    toggleFavorite: toggleFavoriteMutation.mutate,
    deleteItem: deleteItemMutation.mutate,
    bulkDelete: bulkDeleteMutation.mutate,

    // Download helpers
    downloadItem,
  };
};
