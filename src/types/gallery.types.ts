export interface GalleryCollection {
  id: string;
  thread_id: string;
  brand_data: Record<string, any>;
  campaign_data: Record<string, any>;
  asset_type: "image" | "video" | "model";
  asset_source: string;
  created_by: string;
  asset_title: string;
  asset_url: string;
  prompt: string;
  size: string;
  format: string;
  metadata: Record<string, any>;
  user_action: "like" | "dislike" | null;
  is_favourite: boolean;
  created_at: string;
  updated_at: string;
}
