import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";

import {
  GalleryItem,
  GalleryItemResponse,
  GalleryItemsListResponse,
  CommentReplyCreate,
  CommentUpdate,
  CommentReplyUpdate,
  BulkGalleryItemRequest,
  BulkGalleryUploadRequest,
  GalleryImageParametersResponse,
  OrderBy,
  AssetCountRequest,
  AssetCountResponse,
} from "@/types/gallery.types";
import { useQuery } from "@tanstack/react-query";

class GalleryService {
  /**
   * Create a new gallery item
   */
  async createGalleryItem(
    galleryItem: GalleryItem
  ): Promise<GalleryItemResponse> {
    return handleApiRequest<GalleryItemResponse>(
      axiosInstance.post("/gallery", galleryItem)
    );
  }

  /**
   * Search gallery items by title
   */
  async searchGalleryItems(
    query: string,
    skip: number,
    limit: number,
    method:
      | "semantic_text_search"
      | "vector_text_search"
      | "vector_image_search" = "vector_text_search",
    image_url?: string,
    brand_id?: string,
    campaign_id?: string
  ): Promise<GalleryItemsListResponse> {
    const response = await handleApiRequest<GalleryItemsListResponse>(
      axiosInstance.post("/gallery/search", {
        method,
        query,
        image_url,
        skip,
        limit,
        brand_id,
        campaign_id,
      })
    );

    const has_more =
      (response.gallery_items?.length || 0) + skip < response.pagination.total;

    return {
      ...response,
      pagination: {
        ...response.pagination,
        has_more,
      },
    };
  }

  /**
   * Get a specific gallery item by ID
   */
  async getGalleryItemById(itemId: string): Promise<GalleryItemResponse> {
    return handleApiRequest<GalleryItemResponse>(
      axiosInstance.get(`/gallery/${itemId}`)
    );
  }

  /**
   * Get all gallery items with multiple filter values
   */
  async getAllGalleryItems(filters?: {
    asset_types?: string[];
    asset_sources?: string[];
    is_favourite?: boolean;
    campaign_ids?: (string | null)[];
    sub_folder_ids?: string[];
    brand_ids?: string[];
    skip?: number;
    limit?: number;
    has_product?: boolean;
    has_people?: boolean;
    has_lifestyle_context?: boolean;
    media_format?: string[];
    product_categories?: string[];
    product_sub_categories?: string[];
    aspect_ratio?: string[];
    workflow_status?: string[];
    is_archived?: boolean;
    moodboard_ids?: string[];
    has_comments?: boolean;
    sort_by?: OrderBy;
    created_at_range?: [string, string];
  }): Promise<GalleryItemsListResponse> {
    const {
      skip = 0,
      limit = 10,
      ...restFilters // spread the remaining filters
    } = filters || {};

    const response = await handleApiRequest<GalleryItemsListResponse>(
      axiosInstance.post("/gallery/filter", {
        ...restFilters,
        skip,
        limit,
      })
    );

    const has_more =
      (response.gallery_items?.length || 0) + skip <
      (response.pagination?.total ?? 0);

    return {
      ...response,
      pagination: {
        ...response.pagination,
        has_more,
        skip,
        limit,
      },
    };
  }

  /**
   * Update a gallery item by ID
   */
  async updateGalleryItem(
    itemId: string,
    galleryItem: GalleryItem
  ): Promise<GalleryItemResponse> {
    return handleApiRequest<GalleryItemResponse>(
      axiosInstance.put(`/gallery/${itemId}`, galleryItem)
    );
  }

  /**
   * Delete a gallery item by ID
   */
  async deleteGalleryItem(itemId: string): Promise<{ id: string }> {
    return handleApiRequest<{ id: string }>(
      axiosInstance.delete(`/gallery/${itemId}`)
    );
  }

  /**
   * Toggle favorite status for a gallery item
   */
  async toggleFavorite(itemId: string): Promise<GalleryItemResponse> {
    return handleApiRequest<GalleryItemResponse>(
      axiosInstance.patch(`/gallery/${itemId}/favorite`)
    );
  }

  /**
   * Add a comment to a gallery item
   */
  async addCommentToGalleryItem(
    itemId: string,
    commentData: { text: string; attachments?: string[]; is_tasklist?: boolean }
  ): Promise<GalleryItemResponse> {
    return handleApiRequest<GalleryItemResponse>(
      axiosInstance.post(`/gallery/${itemId}/comments`, commentData)
    );
  }

  /**
   * Update a comment on a gallery item
   */
  async updateCommentOnGalleryItem(
    itemId: string,
    commentId: string,
    commentData: { text: string }
  ): Promise<GalleryItemResponse> {
    return handleApiRequest<GalleryItemResponse>(
      axiosInstance.put(`/gallery/${itemId}/comments/${commentId}`, commentData)
    );
  }

  /**
   * Delete a comment from a gallery item
   */
  async deleteCommentFromGalleryItem(
    itemId: string,
    commentId: string
  ): Promise<{ id: string }> {
    return handleApiRequest<{ id: string }>(
      axiosInstance.delete(`/gallery/${itemId}/comments/${commentId}`)
    );
  }

  /**
   * Partially update a gallery item by ID
   */
  async patchGalleryItem(
    itemId: string,
    patchData: Partial<GalleryItem>
  ): Promise<GalleryItemResponse> {
    return handleApiRequest<GalleryItemResponse>(
      axiosInstance.patch(`/gallery/${itemId}`, patchData)
    );
  }

  /**
   * Add a reply to a comment on a gallery item
   */
  async addReplyToComment(
    itemId: string,
    commentId: string,
    replyData: CommentReplyCreate
  ): Promise<GalleryItemResponse> {
    return handleApiRequest<GalleryItemResponse>(
      axiosInstance.post(
        `/gallery/${itemId}/comments/${commentId}/replies`,
        replyData
      )
    );
  }

  async patchComment(
    itemId: string,
    commentId: string,
    updateData: CommentUpdate
  ): Promise<GalleryItemResponse> {
    return handleApiRequest<GalleryItemResponse>(
      axiosInstance.patch<GalleryItemResponse>(
        `gallery/${itemId}/comments/${commentId}`,
        updateData
      )
    );
  }
  async deleteReplyFromComment(
    itemId: string,
    commentId: string,
    replyId: string
  ): Promise<GalleryItemResponse> {
    return handleApiRequest<GalleryItemResponse>(
      axiosInstance.delete<GalleryItemResponse>(
        `gallery/${itemId}/comments/${commentId}/replies/${replyId}`
      )
    );
  }

  async patchReplyOnComment(
    itemId: string,
    commentId: string,
    replyId: string,
    updateData: CommentReplyUpdate
  ): Promise<GalleryItemResponse> {
    return handleApiRequest<GalleryItemResponse>(
      axiosInstance.patch<GalleryItemResponse>(
        `gallery/${itemId}/comments/${commentId}/replies/${replyId}`,
        updateData
      )
    );
  }

  async getGalleryItemVersions(itemId: string): Promise<GalleryItemResponse[]> {
    return handleApiRequest<GalleryItemResponse[]>(
      axiosInstance.get(`/gallery/${itemId}/versions`)
    );
  }

  async getGalleryItemsBulk(
    body: BulkGalleryItemRequest
  ): Promise<GalleryItemResponse[]> {
    return handleApiRequest<GalleryItemResponse[]>(
      axiosInstance.post(`/gallery/bulk`, body)
    );
  }

  async uploadBulkGalleryItems(
    body: BulkGalleryUploadRequest
  ): Promise<GalleryItemResponse[]> {
    const response = await handleApiRequest<{
      created_items: GalleryItemResponse[];
    }>(axiosInstance.post(`/gallery/bulk/upload-optimized`, body));
    return response.created_items;
  }

  async uploadBulkGalleryItemsWithAnalysis(
    body: BulkGalleryUploadRequest
  ): Promise<GalleryItemResponse[]> {
    return handleApiRequest<GalleryItemResponse[]>(
      axiosInstance.post(`/gallery/bulk/scrape`, body)
    );
  }

  /**
   * Reorder gallery items by updating brand_sort_order
   */
  async reorderGalleryItems(
    reorderData: { id: string; brand_sort_order: number }[]
  ): Promise<void> {
    return handleApiRequest<void>(
      axiosInstance.post(`/gallery/reorder`, { items: reorderData })
    );
  }

  /**
   * Create a new version of an existing gallery item
   */
  async createGalleryItemVersion(
    galleryItem: GalleryItem
  ): Promise<GalleryItemResponse> {
    return handleApiRequest<GalleryItemResponse>(
      axiosInstance.post("/gallery/version", galleryItem)
    );
  }

  /**
   * Get asset count with optional breakdowns by various dimensions
   */
  async getAssetCount(request: AssetCountRequest): Promise<AssetCountResponse> {
    return handleApiRequest<AssetCountResponse>(
      axiosInstance.post("/gallery/count", request)
    );
  }
}

export const galleryService = new GalleryService();

export const useBulkGalleryItems = (ids: string[], enabled = true) => {
  return useQuery<GalleryItemResponse[]>({
    queryKey: ["bulk-gallery-items", ids],
    queryFn: () => galleryService.getGalleryItemsBulk({ ids }),
    enabled: enabled && ids.length > 0,
    staleTime: 1000 * 60 * 5, // optional: 5 min cache
  });
};

export const getGalleryImageParameters = async (
  brandId: string,
  galleryId: string
): Promise<GalleryImageParametersResponse | null> => {
  try {
    const response = await handleApiRequest(
      axiosInstance.post(`/gallery/get-image-parameter`, {
        brand_id: brandId,
        gallery_id: galleryId,
      })
    );
    return response ? (response as GalleryImageParametersResponse) : null;
  } catch (error) {
    console.error("Error fetching gallery image parameters:", error);
    throw error;
  }
};
