import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { galleryService } from "@/services/api/gallery.service";
import {
  BulkDeleteRequest,
  BulkUpdateRequest,
  BulkMoveRequest,
  BulkOperationResponse,
  GalleryFilters,
  GalleryItemsListResponse,
  GalleryItemResponse,
} from "@/types/gallery.types";
import { toast } from "sonner";

/**
 * Type for the infinite query data structure
 */
type GalleryInfiniteData = InfiniteData<GalleryItemsListResponse>;

/**
 * Type for the mutation context with rollback data
 */
interface MutationContext {
  previousData: GalleryInfiniteData | undefined;
}

/**
 * Custom hook for bulk gallery operations with server-side selection support
 * Handles bulk delete, update, and move operations
 */
export const useBulkGalleryOperations = () => {
  const queryClient = useQueryClient();

  /**
   * Build common request base from filters and selection state
   */
  const buildBulkRequest = (
    filters: GalleryFilters,
    selectAll: boolean,
    selectedItems: string[],
    excludedItems: string[]
  ): BulkDeleteRequest => {
    const base: BulkDeleteRequest = {
      brand_id: filters.selectedFilters?.brands?.[0] || "",
      select_all: selectAll,
      excluded_items: selectAll ? excludedItems : undefined,
      selected_items: !selectAll ? selectedItems : undefined,
    };

    // Only include filter fields when using select_all mode
    if (selectAll) {
      base.campaign_id = filters.selectedFilters?.campaigns?.[0];
      base.sub_folder_id = filters.selectedFilters?.sub_folders?.[0];
      base.moodboard_id = filters.selectedFilters?.moodboards?.[0];
      base.asset_types = filters.selectedFilters?.asset_types;
      base.asset_sources = filters.selectedFilters?.asset_sources;
      base.is_favourite = filters.selectedFilters?.is_favourite ?? undefined;
      base.workflow_status = filters.selectedFilters?.workflow_status;
      base.media_format = filters.selectedFilters?.media_format;
      base.aspect_ratio = filters.selectedFilters?.aspect_ratio;
      base.has_product = filters.selectedFilters?.has_product ?? undefined;
      base.has_people = filters.selectedFilters?.has_people ?? undefined;
      base.has_lifestyle_context =
        filters.selectedFilters?.has_lifestyle_context ?? undefined;
      base.has_comments = filters.selectedFilters?.has_comments ?? undefined;
      base.is_archived = filters.selectedFilters?.is_archived ?? undefined;
      base.created_at_range = filters.selectedFilters?.created_at_range;
    }

    return base;
  };

  /**
   * Invalidate gallery queries after bulk operation
   */
  const invalidateGalleryQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["gallery-items"] });
  };

  /**
   * Bulk delete mutation with optimistic updates
   */
  const bulkDeleteMutation = useMutation<
    BulkOperationResponse,
    Error,
    BulkDeleteRequest,
    MutationContext
  >({
    mutationFn: (request: BulkDeleteRequest) =>
      galleryService.bulkDelete(request),
    onMutate: async (request) => {
      toast.loading("Deleting items...", { id: "bulk-delete" });

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["gallery-items"] });

      // Snapshot previous value for rollback
      const previousData = queryClient.getQueryData<GalleryInfiniteData>([
        "gallery-items",
      ]);

      // Optimistically update cache - remove deleted items
      queryClient.setQueriesData<GalleryInfiniteData>(
        { queryKey: ["gallery-items"] },
        (old) => {
          if (!old || !old.pages) return old;

          // Handle infinite query structure
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              gallery_items: page.gallery_items.filter((item) => {
                if (request.select_all) {
                  // If select_all, keep only items that are in excluded list
                  return request.excluded_items?.includes(item.id) ?? false;
                } else {
                  // If not select_all, remove items that are in selected list
                  return !request.selected_items?.includes(item.id);
                }
              }),
              pagination: {
                ...page.pagination,
                total:
                  page.pagination.total -
                  (request.select_all
                    ? page.gallery_items.length -
                      (request.excluded_items?.length ?? 0)
                    : request.selected_items?.length ?? 0),
              },
            })),
          };
        }
      );

      return { previousData };
    },
    onSuccess: (response: BulkOperationResponse) => {
      if (response.success) {
        toast.success(
          `Successfully deleted ${response.affected_count} item(s)`,
          { id: "bulk-delete" }
        );
        invalidateGalleryQueries();
      } else {
        toast.error(response.message || "Failed to delete items", {
          id: "bulk-delete",
        });
      }
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(["gallery-items"], context.previousData);
      }
      toast.error(error?.message || "Failed to delete items", {
        id: "bulk-delete",
      });
    },
  });

  /**
   * Bulk update mutation (status, favorites, etc.) with optimistic updates
   */
  const bulkUpdateMutation = useMutation<
    BulkOperationResponse,
    Error,
    BulkUpdateRequest,
    MutationContext
  >({
    mutationFn: (request: BulkUpdateRequest) =>
      galleryService.bulkUpdate(request),
    onMutate: async (request) => {
      toast.loading("Updating items...", { id: "bulk-update" });

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["gallery-items"] });

      // Snapshot previous value for rollback
      const previousData = queryClient.getQueryData<GalleryInfiniteData>([
        "gallery-items",
      ]);

      // Optimistically update cache - modify updated items
      queryClient.setQueriesData<GalleryInfiniteData>(
        { queryKey: ["gallery-items"] },
        (old) => {
          if (!old || !old.pages) return old;

          const updateItem = (
            item: GalleryItemResponse
          ): GalleryItemResponse => {
            const shouldUpdate = request.select_all
              ? !request.excluded_items?.includes(item.id)
              : request.selected_items?.includes(item.id);

            if (shouldUpdate) {
              return {
                ...item,
                ...request.update_data,
                updated_at: new Date().toISOString(),
              } as GalleryItemResponse;
            }
            return item;
          };

          // Handle infinite query structure
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              gallery_items: page.gallery_items.map(updateItem),
            })),
          };
        }
      );

      return { previousData };
    },
    onSuccess: (response: BulkOperationResponse) => {
      if (response.success) {
        toast.success(
          `Successfully updated ${response.affected_count} item(s)`,
          { id: "bulk-update" }
        );
        invalidateGalleryQueries();
      } else {
        toast.error(response.message || "Failed to update items", {
          id: "bulk-update",
        });
      }
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(["gallery-items"], context.previousData);
      }
      toast.error(error?.message || "Failed to update items", {
        id: "bulk-update",
      });
    },
  });

  /**
   * Bulk move mutation (change brand/campaign/source) with optimistic updates
   */
  const bulkMoveMutation = useMutation<
    BulkOperationResponse,
    Error,
    BulkMoveRequest,
    MutationContext
  >({
    mutationFn: (request: BulkMoveRequest) => galleryService.bulkMove(request),
    onMutate: async (request) => {
      toast.loading("Moving items...", { id: "bulk-move" });

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["gallery-items"] });

      // Snapshot previous value for rollback
      const previousData = queryClient.getQueryData<GalleryInfiniteData>([
        "gallery-items",
      ]);

      // Optimistically update cache - modify moved items
      queryClient.setQueriesData<GalleryInfiniteData>(
        { queryKey: ["gallery-items"] },
        (old) => {
          if (!old || !old.pages) return old;

          const updateItem = (
            item: GalleryItemResponse
          ): GalleryItemResponse => {
            const shouldUpdate = request.select_all
              ? !request.excluded_items?.includes(item.id)
              : request.selected_items?.includes(item.id);

            if (shouldUpdate) {
              return {
                ...item,
                brand_id: request.target_brand_id ?? item.brand_id,
                campaign_id: request.target_campaign_id ?? item.campaign_id,
                asset_source: request.target_source ?? item.asset_source,
                updated_at: new Date().toISOString(),
              };
            }
            return item;
          };

          // Handle infinite query structure
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              gallery_items: page.gallery_items.map(updateItem),
            })),
          };
        }
      );

      return { previousData };
    },
    onSuccess: (response: BulkOperationResponse, request: BulkMoveRequest) => {
      if (response.success) {
        toast.success(`Successfully moved ${response.affected_count} item(s)`, {
          id: "bulk-move",
        });
        invalidateGalleryQueries();

        // Invalidate campaign counts for source brand
        if (request.brand_id) {
          queryClient.invalidateQueries({
            queryKey: ["campaign-counts", request.brand_id],
          });
        }
      } else {
        toast.error(response.message || "Failed to move items", {
          id: "bulk-move",
        });
      }
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(["gallery-items"], context.previousData);
      }
      toast.error(error?.message || "Failed to move items", {
        id: "bulk-move",
      });
    },
  });

  return {
    // Mutations
    bulkDelete: bulkDeleteMutation,
    bulkUpdate: bulkUpdateMutation,
    bulkMove: bulkMoveMutation,

    // Helper to build request
    buildBulkRequest,

    // Loading states
    isDeleting: bulkDeleteMutation.isPending,
    isUpdating: bulkUpdateMutation.isPending,
    isMoving: bulkMoveMutation.isPending,
  };
};
