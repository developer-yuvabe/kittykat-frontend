export interface GalleryItem {
  brand_data: Record<string, any>;
  campaign_data: Record<string, any>;
  brand_name: string;
  campaign_name: string;
  asset_type: string;
  asset_source: string;
  asset_title: string;
  asset_url: string;
  prompt: string;
  size: string;
  format: string;
  metadata?: Record<string, any>;
  user_action?: string | null;
  is_favourite?: boolean;
}

export interface GalleryItemResponse extends GalleryItem {
  id: string;
  created_by: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface GalleryItemsListResponse {
  gallery_items: GalleryItemResponse[];
  pagination: {
    total: number;
    skip: number;
    limit: number;
    has_more: boolean;
  };
}

export interface GalleryItemsFilterRequest {
  asset_type?: string;
  is_favourite?: boolean;
  brand_name?: string;
  campaign_name?: string;
}

export interface BrandCampaignResponse {
  brand_name: string;
  campaigns: string[];
}

export interface BrandCampaignListResponse {
  brands: BrandCampaignResponse[];
}
