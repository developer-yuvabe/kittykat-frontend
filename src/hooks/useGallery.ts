import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { galleryService } from "@/services/api/gallery.service";
import {
  extractProducts,
  type ProductExtractionRequest,
} from "@/services/api/gallery.service";
import type {
  BulkGalleryUploadRequest,
  BulkScrapeRequest,
  CommentReplyUpdate,
  CommentUpdate,
  GalleryFilters,
  GalleryItem,
  GalleryItemResponse,
  GalleryItemsListResponse,
} from "@/types/gallery.types";
import { toast } from "sonner";
import { handleDownloadImage, handleDownloadVideo } from "@/lib/utils";
import { allMediaAssetSources } from "@/lib/gallery.utils";
import { AutoFillSuggestedImage } from "@/types/moodboard.types";
import { useMoodboardQuery } from "./useMoodboardQuery";
import { useBrandStore } from "@/store/brand.store";
import { useDebouncedReorder } from "./useDebouncedReorder";

export const ITEMS_PER_PAGE = 20;

export const useGalleryQuery = (
  filters: GalleryFilters,
  items_per_page: number = ITEMS_PER_PAGE,
  enabled: boolean = true,
  compUsed: string = "unknown",
  polling: boolean = true
) => {
  const queryClient = useQueryClient();

  // Map asset type for filtering
  // Map asset type for filtering
  const getAssetTypesFromFilter = () => {
    if (!filters.assetType || filters.assetType === "all-media")
      return allMediaAssetSources;

    if (filters.assetType === "reference")
      return [...allMediaAssetSources, "reference"];

    return [filters.assetType];
  };

  // Generate query key for current filters
  const getGalleryQueryKey = () => [
    "gallery-items",
    filters.assetType,
    filters.favorites,
    filters.source,
    filters.creator,
    filters.searchQuery,
    filters.selectedFilters,
  ];

  const { updateAutoFillSuggestionCache } = useMoodboardQuery({});

  // Infinite query for gallery items with filters
  const galleryQuery = useInfiniteQuery({
    queryKey: getGalleryQueryKey(),
    enabled:
      enabled &&
      (filters.selectedFilters?.brands?.length ?? 0) > 0 &&
      filters.selectedFilters?.brands?.every((brand) => brand != null),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        if (filters.searchQuery) {
          return await galleryService.searchGalleryItems(
            filters.searchQuery,
            pageParam,
            items_per_page,
            "vector_text_search",
            undefined,
            filters.selectedFilters?.brands[0],
            filters.selectedFilters?.campaigns?.[0]
          );
        }

        return await galleryService.getAllGalleryItems({
          asset_sources: filters.selectedFilters?.asset_sources?.length
            ? filters.selectedFilters.asset_sources
            : getAssetTypesFromFilter(),
          is_favourite:
            filters.favorites ||
            filters.selectedFilters?.is_favourite ||
            undefined,
          brand_ids: filters.selectedFilters?.brands?.length
            ? filters.selectedFilters.brands
            : undefined,
          campaign_ids: filters.selectedFilters?.campaigns?.length
            ? filters.selectedFilters.campaigns
            : [
                null,
                ...useBrandStore
                  .getState()
                  .campaigns.filter((c) => !c.is_archived)
                  .map((c) => c.id),
              ],
          sub_folder_ids: filters.selectedFilters?.sub_folders?.length
            ? filters.selectedFilters.sub_folders
            : undefined,

          moodboard_ids: filters?.selectedFilters?.moodboards?.length
            ? filters?.selectedFilters?.moodboards
            : undefined,
          has_product: filters.selectedFilters?.has_product ?? undefined,
          has_people: filters.selectedFilters?.has_people ?? undefined,
          has_lifestyle_context:
            filters.selectedFilters?.has_lifestyle_context ?? undefined,
          asset_types: filters?.selectedFilters?.asset_types?.length
            ? filters.selectedFilters.asset_types
            : undefined,
          media_format: filters.selectedFilters?.media_format?.length
            ? filters.selectedFilters.media_format
            : undefined,
          aspect_ratio: filters.selectedFilters?.aspect_ratio?.length
            ? filters.selectedFilters.aspect_ratio
            : undefined,
          workflow_status: filters.selectedFilters?.workflow_status?.length
            ? filters.selectedFilters.workflow_status
            : undefined,
          is_archived: filters.selectedFilters?.is_archived ?? undefined,
          product_categories: filters.selectedFilters?.product_categories
            ?.length
            ? filters.selectedFilters.product_categories
            : undefined,
          skip: pageParam,
          limit: items_per_page,
          has_comments: filters.selectedFilters?.has_comments ?? undefined,
          sort_by: filters.selectedFilters?.sort_by ?? undefined,
          created_at_range:
            filters.selectedFilters?.created_at_range ?? undefined,
        });
      } catch (error) {
        console.error("Gallery query failed:", error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.has_more) return undefined;
      return lastPage.pagination.skip + lastPage.pagination.limit;
    },
    initialPageParam: 0,
    refetchInterval: polling
      ? (query) => {
          const hasProcessingItems = query.state.data?.pages
            ?.flatMap((page) => page.gallery_items)
            ?.some((item) => item.processing_status === "processing");

          return hasProcessingItems ? 3000 : false;
        }
      : undefined, // ✔ This fully removes polling
  });

  // Flatten all pages of gallery items
  function getGalleryItems() {
    return galleryQuery.data?.pages.flatMap((page) => page.gallery_items) || [];
  }

  function isGalleryItemsProcessing() {
    return galleryQuery.data?.pages
      ?.flatMap((page) => page.gallery_items)
      ?.some((item) => item.processing_status === "processing");
  }

  // Get single gallery item by ID
  const useGalleryItem = (itemId: string) => {
    return useQuery({
      queryKey: ["gallery-item", itemId],
      queryFn: () => galleryService.getGalleryItemById(itemId),
      enabled: !!itemId,
    });
  };

  function updateGalleryItemInCache(updatedItem: GalleryItemResponse) {
    // 1️⃣ Update paginated infinite queries like ["gallery-items", ...]
    const galleryQueries = queryClient.getQueriesData({
      queryKey: ["gallery-items"],
      exact: false,
    });

    galleryQueries.forEach(([queryKey, old]) => {
      if (!old) return;

      queryClient.setQueryData(queryKey, (prev: any) => {
        if (!prev?.pages) return prev;

        return {
          ...prev,
          pages: prev.pages.map((page: any) => ({
            ...page,
            gallery_items: page.gallery_items.map((item: GalleryItemResponse) =>
              item.id === updatedItem.id ? updatedItem : item
            ),
          })),
        };
      });
    });

    // 2️⃣ Update flat array bulk queries like ["gallery-items-bulk", ids]
    const bulkQueries = queryClient.getQueriesData({
      queryKey: ["gallery-items-bulk"],
      exact: false,
    });

    bulkQueries.forEach(([queryKey, old]) => {
      if (!Array.isArray(old)) return;

      queryClient.setQueryData(
        queryKey,
        (prev: GalleryItemResponse[] | undefined) => {
          if (!prev) return prev;

          return prev.map((item) =>
            item.id === updatedItem.id ? updatedItem : item
          );
        }
      );
    });

    // 3️⃣ Update single-item query if it exists
    queryClient.setQueryData(["gallery-item", updatedItem.id], updatedItem);
  }

  /**
   * Revalidate gallery item versions cache
   * This function updates the cache when a version is modified (e.g., comments, edits)
   * @param parentAssetId - The ID of the parent asset that has versions
   * @param updatedVersion - The updated version data
   */
  function revalidateGalleryItemVersions(
    parentAssetId: string,
    updatedVersion: GalleryItemResponse
  ) {
    // Update the versions cache using the parent asset ID
    queryClient.setQueryData(
      ["versions", parentAssetId],
      (oldData: GalleryItemResponse[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((version) =>
          version.id === updatedVersion.id ? updatedVersion : version
        );
      }
    );

    // Also update individual gallery-item cache for this specific version
    queryClient.setQueryData(
      ["gallery-item", updatedVersion.id],
      updatedVersion
    );

    // Update the item in all gallery queries as well
    updateGalleryItemInCache(updatedVersion);
  }

  // Create new gallery item mutation
  const addToGalleryMutation = useMutation({
    mutationFn: (newItem: GalleryItem) =>
      galleryService.createGalleryItem(newItem),

    onMutate: () => {
      // Show loading toast and store the ID
      const toastId = toast.loading("Adding item to gallery...");
      return { toastId };
    },

    onSuccess: (_data, _variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["gallery-items"],
      });

      // Invalidate campaign counts for the brand
      if (_variables.brand_id) {
        queryClient.invalidateQueries({
          queryKey: ["campaign-counts", _variables.brand_id],
        });
      }

      // Update the loading toast to success
      toast.success("Item added to gallery", { id: context?.toastId });
    },

    onError: (_error, _variables, context) => {
      // Update the loading toast to error
      toast.error("Failed to add item to gallery", { id: context?.toastId });
    },
  });

  // Bulk upload mutation for manual uploads (no scraping/analysis)
  const bulkUploadMutation = useMutation({
    mutationFn: (body: BulkGalleryUploadRequest) =>
      galleryService.uploadBulkGalleryItems(body),
    onMutate: () => {
      const toastId = toast.loading("Uploading items to gallery...");
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["gallery-items"],
      });

      // Invalidate campaign counts for the brand
      if (_variables.brand_id) {
        queryClient.invalidateQueries({
          queryKey: ["campaign-counts", _variables.brand_id],
        });
      }

      toast.success("Items uploaded to gallery", { id: context?.toastId });
    },
    onError: (_error, _variables, context) => {
      toast.error("Failed to upload items to gallery", {
        id: context?.toastId,
      });
    },
  });
  // Scraping mutation for social media scraping with analysis
  const scrapeHandlesMutation = useMutation({
    mutationFn: (body: BulkScrapeRequest) =>
      galleryService.uploadBulkGalleryItemsWithAnalysis(body),
    onMutate: () => {
      const toastId = toast.loading("Initiating social media scraping...");
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["gallery-items"],
      });

      // Invalidate campaign counts for the brand
      if (_variables.brand_id) {
        queryClient.invalidateQueries({
          queryKey: ["campaign-counts", _variables.brand_id],
        });
      }

      toast.success("Social media scraping initiated", {
        id: context?.toastId,
      });
    },
    onError: (_error, _variables, context) => {
      toast.error("Failed to initiate scraping", {
        id: context?.toastId,
      });
    },
  });

  // Product extraction mutation
  const extractProductsMutation = useMutation({
    mutationFn: ({
      brandId,
      data,
    }: {
      brandId: string;
      data: ProductExtractionRequest;
    }) => extractProducts(brandId, data),
    onMutate: ({ data }) => {
      const toastId = toast.loading(
        `Extracting products from ${data.image_ids.length} image(s)...`
      );
      return { toastId };
    },
    onSuccess: (response: { total_images: number }, _variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["gallery-items"],
      });

      toast.success(
        `Product extraction started! Processing ${response.total_images} image(s)...`,
        { id: context?.toastId }
      );
    },
    onError: (error: any, _variables, context) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to extract products";
      toast.error(errorMessage, { id: context?.toastId });
    },
  });

  // Create gallery item version mutation
  const createVersionMutation = useMutation({
    mutationFn: (galleryItem: GalleryItem) =>
      galleryService.createGalleryItemVersion(galleryItem),
    onSuccess: (createdVersion) => {
      // Invalidate gallery items to refresh the list
      queryClient.invalidateQueries({
        queryKey: ["gallery-items"],
      });
      // Invalidate versions query for the parent item
      if (createdVersion.parent_asset_id) {
        queryClient.invalidateQueries({
          queryKey: ["versions", createdVersion.parent_asset_id],
        });
      }
    },
  });

  // Update gallery item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: GalleryItem }) =>
      galleryService.updateGalleryItem(itemId, data),
    onSuccess: (updatedItem) => {
      // Update the item in cache
      queryClient.setQueryData(["gallery-item", updatedItem.id], updatedItem);
      // Invalidate gallery items list to reflect changes
      queryClient.invalidateQueries({
        queryKey: ["gallery-items"],
      });
      toast.success("Item updated successfully");
    },
    onError: () => {
      toast.error("Failed to update item");
    },
  });

  // Patch gallery item mutation with optimistic updates
  const patchItemMutation = useMutation({
    mutationFn: ({
      itemId,
      data,
      revalidateAutofillSuggestions = true,
    }: {
      itemId: string;
      data: Partial<GalleryItem>;
      revalidateAutofillSuggestions?: boolean;
    }) => galleryService.patchGalleryItem(itemId, data),

    onMutate: async ({ itemId, data, revalidateAutofillSuggestions }) => {
      const queryKey = getGalleryQueryKey();
      await queryClient.cancelQueries({ queryKey });

      // Get the current filters to determine if we need to remove the item
      const currentCampaignFilter = filters.selectedFilters?.campaigns?.[0];
      const isGlobalGallery = !currentCampaignFilter;
      const destinationCampaign = useBrandStore
        .getState()
        .campaigns.find((c) => c.id === data.campaign_id);

      const isMovingToArchivedCampaign = !!destinationCampaign?.is_archived;

      const isMovingToAnotherCampaign =
        data.campaign_id &&
        currentCampaignFilter &&
        data.campaign_id !== currentCampaignFilter;

      const currentTabFilter = filters.assetType;
      const isMovingToAnotherTab =
        data.asset_source &&
        currentTabFilter &&
        data.asset_source !== currentTabFilter;

      // Optimistically update gallery items list
      const shouldRemove =
        isMovingToAnotherCampaign ||
        isMovingToAnotherTab ||
        (isGlobalGallery && isMovingToArchivedCampaign);

      // Optimistic cache update
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;

        const updated = {
          ...old,
          pages: old.pages.map((page: any) => {
            if (shouldRemove) {
              return {
                ...page,
                gallery_items: page.gallery_items.filter(
                  (item: GalleryItemResponse) => item.id !== itemId
                ),
                pagination: {
                  ...page.pagination,
                  total: Math.max(0, page.pagination.total - 1),
                },
              };
            }

            // Otherwise, just update the item
            return {
              ...page,
              gallery_items: page.gallery_items.map(
                (item: GalleryItemResponse) => {
                  if (item.id === itemId) {
                    return { ...item, ...data };
                  }
                  return item;
                }
              ),
            };
          }),
        };

        return updated;
      });

      // Update flat array queries
      const galleryQueries = queryClient.getQueriesData({
        queryKey: ["gallery-items"],
        exact: false,
      });

      galleryQueries.forEach(([queryKey, old]) => {
        if (!Array.isArray(old)) return;

        queryClient.setQueryData(
          queryKey,
          (prev: GalleryItemResponse[] | undefined) => {
            if (!prev) return prev;

            // Remove if moving to another campaign
            if (isMovingToAnotherCampaign || isMovingToAnotherTab) {
              return prev.filter((item) => item.id !== itemId);
            }

            // Otherwise update
            return prev.map((item) =>
              item.id === itemId ? { ...item, ...data } : item
            );
          }
        );
      });

      updateAutoFillSuggestionCache(itemId, data.is_favourite!);

      // Update the item in existing bulk query caches
      const bulkQueries = queryClient.getQueriesData({
        queryKey: ["gallery-items-bulk"],
        exact: false,
      });

      bulkQueries.forEach(([queryKey, old]) => {
        if (!Array.isArray(old)) return;

        queryClient.setQueryData(
          queryKey,
          (prev: GalleryItemResponse[] | undefined) => {
            if (!prev) return prev;

            // Remove if moving to another campaign
            if (isMovingToAnotherCampaign || isMovingToAnotherTab) {
              return prev.filter((item) => item.id !== itemId);
            }
            // Otherwise update
            return prev.map((item) =>
              item.id === itemId ? { ...item, ...data } : item
            );
          }
        );
      });

      if (revalidateAutofillSuggestions) {
        // Invalidate autofill-suggestions queries after patch
        queryClient.invalidateQueries({
          queryKey: ["autofill-suggestions"],
          exact: false,
        });
      }

      // Return context for potential rollback
      return { queryKey };
    },

    onError: () => {
      toast.error("Failed to update item");
    },

    onSuccess: (updatedItem) => {
      updateGalleryItemInCache(updatedItem);
      queryClient.invalidateQueries({
        queryKey: ["campaign-counts"],
        exact: false,
      });

      // toast.success("Item updated successfully");
    },
  });

  // Toggle favorite mutation with optimistic updates
  const toggleFavoriteMutation = useMutation({
    mutationFn: (itemId: string) => galleryService.toggleFavorite(itemId),
    onMutate: async (itemId) => {
      const queryKey = getGalleryQueryKey();

      await queryClient.cancelQueries({ queryKey });
      await queryClient.cancelQueries({ queryKey: ["gallery-item", itemId] });

      const previousGalleryData = queryClient.getQueryData(queryKey);
      const previousItemData = queryClient.getQueryData([
        "gallery-item",
        itemId,
      ]);

      // Optimistically update gallery items list
      queryClient.setQueryData(queryKey, (old: any) => {
        return {
          ...old,
          pages: old.pages.map((page: any) => {
            return {
              ...page,
              gallery_items: filters.favorites
                ? page.gallery_items.filter(
                    (item: GalleryItemResponse) => item.id !== itemId
                  )
                : page.gallery_items.map((item: GalleryItemResponse) =>
                    item.id === itemId
                      ? { ...item, is_favourite: !item.is_favourite }
                      : item
                  ),
            };
          }),
        };
      });

      return { previousGalleryData, previousItemData, queryKey };
    },
    onError: (err, itemId, context) => {
      if (context?.previousGalleryData) {
        queryClient.setQueryData(context.queryKey, context.previousGalleryData);
      }
      if (context?.previousItemData) {
        queryClient.setQueryData(
          ["gallery-item", itemId],
          context.previousItemData
        );
      }
      toast.error("Failed to update favorite status");
    },
    onSuccess: (data) => {
      // Update single item cache with server response
      queryClient.setQueryData(["gallery-item", data.id], data);
      toast.success(
        data.is_favourite ? "Added to favorites" : "Removed from favorites"
      );
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => galleryService.deleteGalleryItem(itemId),
    onMutate: async (itemId) => {
      queryClient.removeQueries({ queryKey: ["gallery-item", itemId] });
      const queryKey = getGalleryQueryKey();
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            gallery_items: page.gallery_items.filter(
              (item: GalleryItemResponse) => item.id !== itemId
            ),
          })),
        };
      });

      return { previousData, queryKey };
    },
    onError: (err, itemId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast.error("Failed to delete item");
    },
    onSuccess: (data, itemId) => {
      // Remove item from single item cache

      toast.success("Item deleted successfully");

      // Invalidate all campaign counts
      queryClient.invalidateQueries({
        queryKey: ["campaign-counts"],
        exact: false,
      });

      // Invalidate bulk items queries
      queryClient.invalidateQueries({ queryKey: ["gallery-items-bulk"] });

      // Also remove the item from existing bulk query caches
      const bulkQueries = queryClient.getQueriesData({
        queryKey: ["gallery-items-bulk"],
        exact: false,
      });

      bulkQueries.forEach(([queryKey, old]) => {
        if (!Array.isArray(old)) return;

        queryClient.setQueryData(
          queryKey,
          (prev: GalleryItemResponse[] | undefined) => {
            if (!prev) return prev;
            return prev.filter((item) => item.id !== itemId);
          }
        );
      });
      const autoFillQueries = queryClient.getQueriesData({
        queryKey: ["autofill-suggestions"],
        exact: false,
      });

      autoFillQueries.forEach(([queryKey, old]) => {
        if (!Array.isArray(old)) return;

        queryClient.setQueryData(
          queryKey,
          (prev: AutoFillSuggestedImage[] | undefined) => {
            if (!prev) return prev;
            return prev.filter((item) => !itemId.includes(item.id));
          }
        );
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const promises = itemIds.map((id) =>
        galleryService.deleteGalleryItem(id)
      );
      return Promise.all(promises);
    },
    onMutate: async (itemIds) => {
      const queryKey = getGalleryQueryKey();
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            gallery_items: page.gallery_items.filter(
              (item: GalleryItemResponse) => !itemIds.includes(item.id)
            ),
          })),
        };
      });

      return { previousData, queryKey };
    },
    onError: (err, itemIds, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast.error("Failed to delete items");
    },
    onSuccess: (data, itemIds) => {
      // Remove items from single item cache

      itemIds.forEach((itemId) => {
        queryClient.removeQueries({ queryKey: ["gallery-item", itemId] });
      });
      toast.success(`${data.length} items deleted successfully`);

      // Invalidate all campaign counts
      queryClient.invalidateQueries({
        queryKey: ["campaign-counts"],
        exact: false,
      });

      // Invalidate and update bulk items queries
      queryClient.invalidateQueries({ queryKey: ["gallery-items-bulk"] });

      // Also remove the items from existing bulk query caches
      const bulkQueries = queryClient.getQueriesData({
        queryKey: ["gallery-items-bulk"],
        exact: false,
      });

      bulkQueries.forEach(([queryKey, old]) => {
        if (!Array.isArray(old)) return;

        queryClient.setQueryData(
          queryKey,
          (prev: GalleryItemResponse[] | undefined) => {
            if (!prev) return prev;
            return prev.filter((item) => !itemIds.includes(item.id));
          }
        );
      });

      const autoFillQueries = queryClient.getQueriesData({
        queryKey: ["autofill-suggestions"],
        exact: false,
      });

      autoFillQueries.forEach(([queryKey, old]) => {
        if (!Array.isArray(old)) return;

        queryClient.setQueryData(
          queryKey,
          (prev: AutoFillSuggestedImage[] | undefined) => {
            if (!prev) return prev;
            return prev.filter((item) => !itemIds.includes(item.id));
          }
        );
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: ({
      itemId,
      commentData,
    }: {
      itemId: string;
      commentData: {
        text: string;
        attachments?: string[];
        is_tasklist?: boolean;
      };
    }) => galleryService.addCommentToGalleryItem(itemId, commentData),

    onSuccess: (updatedItem) => {
      updateGalleryItemInCache(updatedItem);
    },

    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({
      itemId,
      commentId,
      commentData,
    }: {
      itemId: string;
      commentId: string;
      commentData: { text: string };
    }) =>
      galleryService.updateCommentOnGalleryItem(itemId, commentId, commentData),

    onSuccess: (updatedItem) => {
      updateGalleryItemInCache(updatedItem);
    },

    onError: () => {
      toast.error("Failed to update comment");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: ({
      itemId,
      commentId,
    }: {
      itemId: string;
      commentId: string;
    }) => galleryService.deleteCommentFromGalleryItem(itemId, commentId),

    onSuccess: (_, { itemId, commentId }) => {
      const queryKey = getGalleryQueryKey();

      // Update paginated gallery cache
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            gallery_items: page.gallery_items.map((item: GalleryItemResponse) =>
              item.id === itemId
                ? {
                    ...item,
                    comments: item.comments?.filter((c) => c.id !== commentId),
                  }
                : item
            ),
          })),
        };
      });

      // Update single item cache
      queryClient.setQueryData(["gallery-item", itemId], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          comments: old.comments?.filter((c: any) => c.id !== commentId),
        };
      });
    },

    onError: () => {
      toast.error("Failed to delete comment");
    },
  });

  const addReplyMutation = useMutation({
    mutationFn: ({
      itemId,
      commentId,
      replyData,
    }: {
      itemId: string;
      commentId: string;
      replyData: { text: string; attachments?: string[] };
    }) => galleryService.addReplyToComment(itemId, commentId, replyData),

    onSuccess: (updatedItem) => {
      updateGalleryItemInCache(updatedItem);
    },

    onError: () => {
      toast.error("Failed to add reply");
    },
  });

  const downloadItem = async (item: GalleryItemResponse) => {
    try {
      const latestVersions = await galleryService.getLatestGalleryItemVersions([
        item.id,
      ]);

      const latestVersion = latestVersions?.[0];

      console.log("Latest version for download:", latestVersion);

      const assetUrl =
        latestVersion?.asset_url || item.asset_url || item.preview_url;

      if (!assetUrl) {
        throw new Error("No asset URL available");
      }

      if (latestVersion?.asset_type === "video") {
        await handleDownloadVideo(assetUrl);
      } else {
        await handleDownloadImage(assetUrl);
      }

      return true;
    } catch (error) {
      toast.error("Failed to download file");
      console.error("Download error:", error);
      return false;
    }
  };

  const patchCommentMutation = useMutation({
    mutationFn: ({
      itemId,
      commentId,
      updateData,
    }: {
      itemId: string;
      commentId: string;
      updateData: CommentUpdate;
    }) => galleryService.patchComment(itemId, commentId, updateData),

    onSuccess: (updatedItem) => {
      updateGalleryItemInCache(updatedItem);
    },

    onError: (error, variables) => {
      const updateData = variables.updateData;

      if ("like_action" in updateData) {
        toast.error("Failed to update like. Please try again.");
      } else {
        toast.error("Failed to update comment");
      }
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: ({
      itemId,
      commentId,
      replyId,
    }: {
      itemId: string;
      commentId: string;
      replyId: string;
    }) => galleryService.deleteReplyFromComment(itemId, commentId, replyId),
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(["gallery-item", updatedItem.id], updatedItem);
      queryClient.invalidateQueries({ queryKey: ["gallery-items"] });
    },
    onError: () => {
      toast.error("Failed to delete reply");
    },
  });

  const patchReplyMutation = useMutation({
    mutationFn: ({
      itemId,
      commentId,
      replyId,
      updateData,
    }: {
      itemId: string;
      commentId: string;
      replyId: string;
      updateData: CommentReplyUpdate;
    }) =>
      galleryService.patchReplyOnComment(
        itemId,
        commentId,
        replyId,
        updateData
      ),
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(["gallery-item", updatedItem.id], updatedItem);
      queryClient.invalidateQueries({ queryKey: ["gallery-items"] });
    },

    onError: (error, variables) => {
      const updateData = variables.updateData;

      if ("like_action" in updateData) {
        toast.error("Failed to update like on reply. Please try again.");
      } else {
        toast.error("Failed to update reply");
      }
    },
  });

  // Function to update cache immediately (optimistic update)
  const updateReorderCache = useCallback(
    (reorderData: { id: string; brand_sort_order: number }[]) => {
      const queryKey = getGalleryQueryKey();
      queryClient.cancelQueries({ queryKey });

      queryClient.setQueryData<InfiniteData<GalleryItemsListResponse>>(
        queryKey,
        (old) => {
          if (!old) return old;

          // Flatten all pages into a single array
          const allItems: GalleryItemResponse[] = old.pages.flatMap(
            (page) => page.gallery_items
          );

          // Apply new sort orders to all items
          const updatedItems = allItems.map((item) => {
            const reorderItem = reorderData.find((r) => r.id === item.id);
            if (reorderItem) {
              return {
                ...item,
                brand_sort_order: reorderItem.brand_sort_order,
              };
            }
            return item;
          });

          // Sort all items by brand_sort_order
          updatedItems.sort(
            (a, b) => (a.brand_sort_order || 0) - (b.brand_sort_order || 0)
          );

          // Re-paginate: distribute sorted items back into pages
          const pageSizes = old.pages.map((page) => page.gallery_items.length);
          const newPages: GalleryItemsListResponse[] = [];
          let itemIndex = 0;

          for (let i = 0; i < old.pages.length; i++) {
            const pageSize = pageSizes[i];
            const pageItems = updatedItems.slice(
              itemIndex,
              itemIndex + pageSize
            );
            itemIndex += pageSize;
            newPages.push({ ...old.pages[i], gallery_items: pageItems });
          }

          return { ...old, pages: newPages };
        }
      );
    },
    [filters]
  );

  // Debounced reorder: instant cache updates + debounced API sync
  const {
    reorder: reorderItems,
    isPending: isReorderPending,
    isSyncing: isReorderSyncing,
  } = useDebouncedReorder({
    updateCache: updateReorderCache,
    syncToApi: galleryService.reorderGalleryItems,
    delay: 3000,
    onError: () => {
      // Rollback on error by refetching
      queryClient.invalidateQueries({ queryKey: getGalleryQueryKey() });
      toast.error("Failed to save order. Please try again.");
    },
  });

  const isReorderingItems = isReorderPending || isReorderSyncing;

  const refetchAllGalleryQueries = async () => {
    const matchingQueries = queryClient.getQueriesData<GalleryItemResponse[]>({
      queryKey: ["gallery-items"],
      exact: false,
    });

    for (const [queryKey, oldData] of matchingQueries) {
      if (oldData) {
        queryClient.setQueryData(queryKey, oldData);
      }
    }

    await Promise.all(
      matchingQueries.map(([queryKey]) =>
        queryClient.invalidateQueries({ queryKey, refetchType: "all" })
      )
    );

    queryClient.invalidateQueries({
      queryKey: ["campaign-counts"],
      exact: false,
    });
  };

  const totalItems = galleryQuery.data?.pages[0]?.pagination.total ?? 0;

  return {
    // Gallery items
    getGalleryItems,
    isGalleryItemsProcessing,
    galleryStatus: galleryQuery.status,
    isFetchingNextPage: galleryQuery.isFetchingNextPage,
    hasNextPage: galleryQuery.hasNextPage,
    fetchNextPage: galleryQuery.fetchNextPage,
    isFetching: galleryQuery.isFetching,
    refetchGalleryItems: galleryQuery.refetch,

    // Single item query hook
    useGalleryItem,

    // Mutations
    addToGallery: addToGalleryMutation.mutateAsync,
    isAddingToGallery: addToGalleryMutation.isPending,

    updateItem: updateItemMutation.mutate,
    isUpdatingItem: updateItemMutation.isPending,

    patchItem: patchItemMutation.mutate,
    isPatchingItem: patchItemMutation.isPending,

    toggleFavorite: toggleFavoriteMutation.mutate,
    isTogglingFavorite: toggleFavoriteMutation.isPending,

    deleteItem: deleteItemMutation.mutate,
    isDeletingItem: deleteItemMutation.isPending,

    bulkDelete: bulkDeleteMutation.mutate,
    isBulkDeleting: bulkDeleteMutation.isPending,

    addComment: addCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,

    updateComment: updateCommentMutation.mutate,
    isUpdatingComment: updateCommentMutation.isPending,

    deleteComment: deleteCommentMutation.mutate,
    isDeletingComment: deleteCommentMutation.isPending,

    addReply: addReplyMutation.mutate,
    isAddingReply: addReplyMutation.isPending,

    patchComment: patchCommentMutation.mutate,
    isPatchingComment: patchCommentMutation.isPending,

    deleteReply: deleteReplyMutation.mutate,
    isDeletingReply: deleteReplyMutation.isPending,

    patchReply: patchReplyMutation.mutate,
    isPatchingReply: patchReplyMutation.isPending,

    // Reorder items (debounced API sync)
    reorderItems,
    isReorderingItems,

    // Download helpers
    downloadItem,

    totalItems,

    refetchAllGalleryQueries,

    // Revalidate versions cache
    revalidateGalleryItemVersions,

    bulkUpload: bulkUploadMutation.mutateAsync,

    scrapeHandles: scrapeHandlesMutation.mutateAsync,

    extractProducts: extractProductsMutation.mutateAsync,
    isExtractingProducts: extractProductsMutation.isPending,

    createVersion: createVersionMutation.mutateAsync,
    isCreatingVersion: createVersionMutation.isPending,
  };
};

export type GalleryActions = ReturnType<typeof useGalleryQuery>;
