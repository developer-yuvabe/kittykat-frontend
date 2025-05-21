import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";

import {
  GalleryItem,
  GalleryItemResponse,
  GalleryItemsListResponse,
  BrandCampaignListResponse,
} from "@/types/gallery.types";

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
    skip = 0,
    limit = 10
  ): Promise<GalleryItemsListResponse> {
    return handleApiRequest<GalleryItemsListResponse>(
      axiosInstance.get("/gallery/search", {
        params: { query, skip, limit },
      })
    );
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
    campaign_names?: string[];
    brand_names?: string[];
    skip?: number;
    limit?: number;
  }): Promise<GalleryItemsListResponse> {
    const {
      asset_types,
      is_favourite,
      campaign_names,
      brand_names,
      skip = 0,
      limit = 10,
      asset_sources,
    } = filters || {};

    const response = await handleApiRequest<GalleryItemsListResponse>(
      axiosInstance.post("/gallery/filter", {
        asset_types,
        is_favourite,
        campaign_names,
        brand_names,
        skip,
        limit,
        asset_sources,
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
   * Get all brands with their associated campaigns
   */
  async getBrandsWithCampaigns(): Promise<BrandCampaignListResponse> {
    return handleApiRequest<BrandCampaignListResponse>(
      axiosInstance.get("/gallery/brands-campaigns")
    );
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
}

export const galleryService = new GalleryService();
