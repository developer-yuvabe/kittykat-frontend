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
};

export type GalleryItem = {
  // 🧱 Basic Asset Info
  brand_id: string;
  moodboard_id?: string;
  asset_type: string;
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
  related_asset_ids: string[];

  // 🔮 AI & Generation Info
  generation_engine?: string;
  input_prompt?: string;
  prompt_modifiers: string[];
  metadata_raw?: Record<string, any>;
  ai_description?: string;
  ai_tags: string[];
  visual_style_tags: string[];
  detected_objects: string[];
  detected_emotions: string[];
  detected_colors: string[];
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
  intent_tags: string[];
  search_keywords: string[];
  custom_tags: string[];
  alt_text?: string;
  multilingual_data?: Record<
    string,
    {
      alt_text: string;
      tags: string[];
    }
  >;

  // 🔁 Workflow & Collaboration
  workflow_status?: "draft" | "in_review" | "approved" | "rejected";
  user_feedback?: "liked" | "disliked" | "neutral";
  feedback_thread_id?: string;
  stakeholder_approvals?: Record<string, "approved" | "rejected" | "pending">;
  has_feedback?: boolean;
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
  is_archived?: boolean;
  quality_flag?: string;

  // 📤 Publishing & Compliance
  approved_channels?: ("social" | "print" | "web" | "paid_ads")[];
  region_restrictions?: string[];
  content_warnings?: string[];

  // 📆 Usage Tracking
  last_accessed_at?: string;

  // ⚙️ System Metadata
  processing_status?: "processing" | "ready" | "failed";
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
  has_product?: boolean;
  has_people?: boolean;
  has_lifestyle_context?: boolean;

  // Asset property filters
  asset_types: string[];
  asset_sources: string[];
  media_format: string[];
  aspect_ratio: string[];

  // Workflow and status filters
  workflow_status: string[];

  // User preference filters
  is_favourite?: boolean;
  is_archived?: boolean;
}

export interface CommentReplyCreate {
  text: string;
  attachments?: string[];
}
