import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { galleryService } from "@/services/api/gallery.service";
import type {
  BulkGalleryUploadRequest,
  CommentReplyUpdate,
  CommentUpdate,
  GalleryFilters,
  GalleryItem,
  GalleryItemResponse,
} from "@/types/gallery.types";
import { toast } from "sonner";
import { handleDownloadImage, handleDownloadVideo } from "@/lib/utils";

import { AutoFillSuggestedImage } from "@/types/moodboard.types";
import { useMoodboardQuery } from "./useMoodboardQuery";

export const ITEMS_PER_PAGE = 20;

export const useGalleryQuery = (
  filters: GalleryFilters,
  items_per_page: number = ITEMS_PER_PAGE,
  enabled: boolean = true,
  compUsed: string = "unknown"
) => {
  const queryClient = useQueryClient();

  // Map asset type for filtering
  const getAssetTypesFromFilter = () => {
    if (!filters.assetType || filters.assetType === "all-media")
      return undefined;
    return filters.assetType;
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
          asset_sources: [getAssetTypesFromFilter()].filter(
            (v): v is string => v !== undefined
          ),
          is_favourite:
            filters.favorites ||
            filters.selectedFilters?.is_favourite ||
            undefined,
          brand_ids: filters.selectedFilters?.brands?.length
            ? filters.selectedFilters.brands
            : undefined,
          campaign_ids: filters.selectedFilters?.campaigns?.length
            ? filters.selectedFilters.campaigns
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
    refetchInterval: (query) => {
      // Check if any items are processing
      const hasProcessingItems = query.state.data?.pages
        ?.flatMap((page) => page.gallery_items)
        ?.some((item) => item.processing_status === "processing");

      // Return 3000ms (3 seconds) if there are processing items, otherwise false (no polling)
      return hasProcessingItems ? 3000 : false;
    },
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

      // Update the loading toast to success
      toast.success("Item added to gallery", { id: context?.toastId });
    },

    onError: (_error, _variables, context) => {
      // Update the loading toast to error
      toast.error("Failed to add item to gallery", { id: context?.toastId });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: (body: BulkGalleryUploadRequest) =>
      galleryService.uploadBulkGalleryItems(body),
    onMutate: () => {
      // Show loading toast and store the ID
      const toastId = toast.loading("Uploading items to gallery...");
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["gallery-items"],
      });

      // Update the loading toast to success
      toast.success("Items uploaded to gallery", { id: context?.toastId });
    },
    onError: (_error, _variables, context) => {
      // Update the loading toast to error
      toast.error("Failed to upload items to gallery", {
        id: context?.toastId,
      });
    },
  });

  // Upload bulk gallery items with analysis mutation
  const uploadBulkWithAnalysisMutation = useMutation({
    mutationFn: (body: BulkGalleryUploadRequest) =>
      galleryService.uploadBulkGalleryItemsWithAnalysis(body),
    onMutate: () => {
      // Show loading toast and store the ID
      const toastId = toast.loading("Uploading items to gallery...");
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["gallery-items"],
      });

      // Update the loading toast to success
      toast.success("Items uploaded to gallery", { id: context?.toastId });
    },
    onError: (_error, _variables, context) => {
      // Update the loading toast to error
      toast.error("Failed to upload items to gallery", {
        id: context?.toastId,
      });
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
    }: {
      itemId: string;
      data: Partial<GalleryItem>;
    }) => galleryService.patchGalleryItem(itemId, data),

    onMutate: async ({ itemId, data }) => {
      updateAutoFillSuggestionCache(itemId, data.is_favourite!);

      const queryKey = getGalleryQueryKey();

      await queryClient.cancelQueries({ queryKey });
      // Optimistically update gallery items list
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;

        const updated = {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            gallery_items: page.gallery_items.map(
              (item: GalleryItemResponse) => {
                if (item.id === itemId) {
                  return { ...item, ...data };
                }
                return item;
              }
            ),
          })),
        };

        return updated;
      });

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
      // Invalidate autofill-suggestions queries after patch
      queryClient.invalidateQueries({
        queryKey: ["autofill-suggestions"],
        exact: false,
      });

      // Return context for potential rollback
      return { queryKey };
    },

    onError: () => {
      toast.error("Failed to update item");
    },

    onSuccess: (updatedItem) => {
      updateGalleryItemInCache(updatedItem);
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
      queryClient.removeQueries({ queryKey: ["gallery-item", itemId] });
      toast.success("Item deleted successfully");
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

  // Download helpers
  const downloadItem = async (item: GalleryItemResponse) => {
    try {
      if (item.asset_type === "video")
        await handleDownloadVideo(item.asset_url);
      else await handleDownloadImage(item.asset_url);
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

  // Reorder gallery items mutation with optimistic updates
  const reorderItemsMutation = useMutation({
    mutationFn: (reorderData: { id: string; brand_sort_order: number }[]) =>
      galleryService.reorderGalleryItems(reorderData),

    onMutate: async (reorderData) => {
      const queryKey = getGalleryQueryKey();

      await queryClient.cancelQueries({ queryKey });

      // Optimistically update gallery items list
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;

        const updated = {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            gallery_items: page.gallery_items
              .map((item: GalleryItemResponse) => {
                const reorderItem = reorderData.find((r) => r.id === item.id);
                if (reorderItem) {
                  return {
                    ...item,
                    brand_sort_order: reorderItem.brand_sort_order,
                  };
                }
                return item;
              })
              // Sort by brand_sort_order after update
              .sort(
                (a: GalleryItemResponse, b: GalleryItemResponse) =>
                  (a.brand_sort_order || 0) - (b.brand_sort_order || 0)
              ),
          })),
        };

        return updated;
      });

      return { queryKey, reorderData };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
      toast.error("Failed to reorder items");
    },

    onSuccess: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: getGalleryQueryKey() });
    },
  });

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

    // Reorder items
    reorderItems: reorderItemsMutation.mutate,
    isReorderingItems: reorderItemsMutation.isPending,

    // Download helpers
    downloadItem,

    totalItems,

    refetchAllGalleryQueries,

    bulkUpload: bulkUploadMutation.mutateAsync,

    uploadBulkWithAnalysis: uploadBulkWithAnalysisMutation.mutateAsync,
  };
};

export type GalleryActions = ReturnType<typeof useGalleryQuery>;
