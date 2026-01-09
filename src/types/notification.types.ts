export interface AssetNotificationItem {
  gallery_item_id: string;
  image_url?: string;
  video_url?: string;
  metadata: Record<string, any>;
  updated_at: string;
  is_read: boolean;
  notification_type: "status_change" | "comment_added";
}

export interface BrandNotificationGroup {
  brand_id: string;
  brand_name: string;
  unread_count: number;
  message: string;
  assets: AssetNotificationItem[];
}
