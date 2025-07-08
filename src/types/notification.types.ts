export interface AssetNotificationItem {
  gallery_item_id: string;
  image_url: string;
  status: string;
  updated_at: string;
  is_read: boolean;
}

export interface BrandNotificationGroup {
  brand_id: string;
  brand_name: string;
  unread_count: number;
  message: string;
  assets: AssetNotificationItem[];
}
