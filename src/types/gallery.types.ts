import { AggregatedTagItem } from "./types";

export type Comment = {
  id: string;
  text: string;
  added_by: string;
  added_at: string;
  added_by_name?: string;
  added_by_role?: string;
  updated_at: string;
  attachments?: string[];
  replies?: CommentReply[];
  likes?: string[];
  is_tasklist?: boolean;
};

export type CommentReply = {
  id: string;
  text: string;
  added_by: string;
  added_at: string;
  updated_at: string;
  attachments?: string[];
  added_by_name?: string;
  added_by_role?: string;
  likes?: string[];
};

export type WorkflowStatus =
  | "draft"
  | "request_created"
  | "in_progress"
  | "in_review"
  | "approved"
  | "requested_revision"
  | "a2i_media_created";

export type GalleryItem = {
  // 🧱 Basic Asset Info
  brand_id: string;
  moodboard_id?: string;
  asset_type: string;
  latest_version_asset_type?: string;
  asset_source: string;
  asset_title: string;
  asset_url: string;
  preview_url?: string;
  size: string;
  size_bytes?: number;
  dimensions?: { width: number; height: number };
  aspect_ratio?: string;
  duration_seconds?: number;
  media_format?: string;

  // 🧬 Versioning
  is_master?: boolean;
  version_group_id?: string;
  parent_asset_id?: string;
  version_tag?: string;
  related_asset_ids?: string[];

  // 🔮 AI & Generation Info
  input_prompt?: string;
  prompt_modifiers?: string[];
  metadata_raw?: Record<string, any>;
  ai_description?: string;
  ai_tags?: string[];
  visual_style_tags?: Record<string, AggregatedTagItem[]>;
  detected_objects?: string[];
  detected_emotions?: string[];
  detected_colors?: string[];
  dominant_color?: string;
  ai_similarity_vector?: number[];
  technical_quality_score?: number;
  brand_compliance_score?: number;
  brand_compliance_details?: {
    color_match_score: number;
    style_match_score: number;
    issues_found: string[];
    positive_elements: string[];
    suggestions: string[];
  };

  // 🧍 Human Model Info
  has_human_model?: boolean;
  model_data?: {
    model_type: "real" | "virtual" | "ai_generated";
    gender?: string;
    ethnicity?: string;
    age_range?: string;
    face_visible: boolean;
    body_type: "headshot" | "half_body" | "full_body";
  };

  // 📦 Product Info
  has_product?: boolean;
  product_id?: string;
  product_data?: {
    product_category: string;
    sku?: string;
    sku_reference?: string;
    product_visibility: "prominent" | "subtle" | "background";
    product_placement: "held" | "worn" | "displayed";
  };

  // 📣 Campaign & Brand Info
  campaign_id?: string;
  campaign_phase?: string;
  usage_context?: string;
  last_used_in_campaign?: string;
  usage_count?: number;
  performance_score?: number;

  // 🏷️ Tagging & Classification
  search_keywords?: string[];
  custom_tags?: string[];

  // 🔁 Workflow & Collaboration
  workflow_status?: WorkflowStatus;
  tasklist_id?: string;

  comments?: Comment[];
  last_commented_at?: string;

  // 📝 Human Editing
  sent_to_human_queue?: boolean;
  sent_to_queue_at?: string;
  human_editor_id?: string;
  editing_instructions?: string;
  human_edit_completed_at?: string;

  // 📁 Asset Management

  is_favourite?: boolean;
  to_ignore?: boolean;
  is_archived?: boolean;
  quality_flag?: string;

  // 📆 Usage Tracking
  last_accessed_at?: string;

  // ⚙️ System Metadata
  processing_status?: "processing" | "ready" | "failed";

  brand_sort_order?: number;
};

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

export interface Campaign {
  id: string;
  title: string;
}

export interface BrandCampaignResponse {
  brand_id: string;
  brand_name: string;
  campaigns: Campaign[];
}

export interface ProductCategory {
  id: string;
  name: string;
  sub_categories: string[];
}

export interface BrandCampaignListResponse {
  brands: BrandCampaignResponse[];
  product_categories: ProductCategory[];
}

export type GalleryFilters = {
  assetType?: string;
  favorites?: boolean;
  source?: string;
  creator?: string;
  searchQuery?: string;
  selectedFilters?: EnhancedSelectedFilters;
};

export interface FileWithStatus {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  url?: string;
  error?: string;
}

export interface EnhancedSelectedFilters {
  // Existing filters
  brands: string[];
  campaigns: string[];
  moodboards: string[];
  product_categories: string[];

  // New content-based filters
  has_product?: boolean | null;
  has_people?: boolean | null;
  has_lifestyle_context?: boolean | null;

  // Asset property filters
  asset_types: string[];
  asset_sources: string[];
  media_format: string[];
  aspect_ratio: string[];

  // Workflow and status filters
  workflow_status: string[];

  // User preference filters
  is_favourite?: boolean | null;
  is_archived?: boolean | null;
}

export interface CommentReplyCreate {
  text: string;
  attachments?: string[];
}

export interface CommentUpdate {
  text?: string;
  attachments?: string[];
  like_action?: "add" | "remove";
}

export interface CommentReplyUpdate {
  text?: string;
  attachments?: string[];
  like_action?: "add" | "remove";
}

export interface BulkGalleryItemRequest {
  ids: string[];
}

export interface ScrapeConfig {
  url: string;
  platform: string;
  results_limit?: number;
  user_id?: string;
}

export interface BulkGalleryUploadRequest {
  gallery_items?: GalleryItem[]; // Optional if using scrape_only
  brand_id: string;
  campaign_id?: string;
  moodboard_id?: string;
  scrape_config?: ScrapeConfig;
  scrape_only?: boolean;
  skip_embedding_for_existing?: boolean;
}

export interface MediaWithStatus extends Omit<FileWithStatus, "file"> {
  file?: File;
  url?: string;
  originalUrl?: string;
  name: string;
  type: "file" | "url";
}

// fileTypes.ts

export const IMAGE_FILE_TYPES: Record<string, string[]> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/svg+xml": [".svg"],
  "image/tiff": [".tiff", ".tif"],
  "image/webp": [".webp"],
  "image/bmp": [".bmp"],
  "image/gif": [".gif"],
  "image/psd": [".psd"],
};

export const VIDEO_FILE_TYPES: Record<string, string[]> = {
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  "video/x-msvideo": [".avi"],
};

/**
 * Extracts the file extension from a URL (e.g., ".mp4" from "https://example.com/video.mp4").
 * Returns null if no extension is found.
 */
export function getFileExtension(url: string): string | null {
  const parts = url.split(".");
  return parts.length > 1 ? `.${parts.pop()?.toLowerCase()}` : null;
}

/**
 * Checks if a URL's extension matches any image file type.
 */
export function isImageUrl(url: string): boolean {
  const ext = getFileExtension(url);
  if (!ext) return false;
  return Object.values(IMAGE_FILE_TYPES).some((exts) => exts.includes(ext));
}

/**
 * Checks if a URL's extension matches any video file type.
 */
export function isVideoUrl(url: string): boolean {
  const ext = getFileExtension(url);
  if (!ext) return false;
  return Object.values(VIDEO_FILE_TYPES).some((exts) => exts.includes(ext));
}

export type GalleryImageParametersResponse = {
  parameters: Record<string, any>;
  type: string;
};
