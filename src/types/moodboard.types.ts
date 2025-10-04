import {
  AggregatedTagItem,
  MoodboardInformation,
  SourceHandle,
  VisualImage,
} from "./types";

export type LimitsState = {
  pinterest_limit: number;
  instagram_limit: number;
  facebook_limit: number;
  website_limit: number;
};

export interface UploadedImage {
  id: string;
  url: string;
  name: string;
  file: File;
}

export interface MoodboardCreateRequest {
  campaign_id: string;
  title: string;
  visual_style_images?: VisualImage[];
  aggregated_tags?: Record<string, AggregatedTagItem[]>;
  moodboard_assets?: MoodboardAsset[];
  visual_sources?: SourceHandle[];
  selected_moodboard_tags?: Record<string, string[]>;
}

export interface MoodboardImageAnalysisRequest {
  pinterest_limit?: number;
  instagram_limit?: number;
  facebook_limit?: number;
  website_limit?: number;
  reanalyze?: boolean;
}

export type MoodboardPatchRequest = Partial<MoodboardInformation>;

export interface CreateMoodboardRequest {
  no_of_images: number;
}

export interface AddMoodboardImageRequest {
  id: string;
}

export interface ReplaceMoodboardImageRequest {
  image_to_replace_id: string;
  replacement_image_url: string;
}

export interface AutoFillSuggestedImage {
  id: string;
  is_favourite: boolean;
  dimensions: {
    width: number;
    height: number;
  };
  asset_url: string;
  preview_url: string | null;
}

export interface MoodboardAsset {
  gallery_item_id: string;
  position: number;
  is_placeholder?: boolean;
}

export interface AutoFillSuggestedImage {
  id: string;
  is_favourite: boolean;
  dimensions: {
    width: number;
    height: number;
  };
  asset_url: string;
  preview_url: string | null;
}

export interface UnifiedMoodboardItem {
  id: string;
  src?: string;
  width: number;
  height: number;
  alt?: string;
  liked?: boolean;
  is_placeholder?: boolean;
  position: number;
  isUploading?: boolean;
}

export interface MoodboardScreenshotAsset {
  url: string;
  position: number;
  is_placeholder?: boolean;
}

export interface GenerateMoodboardScreenshotRequest {
  title: string;
  assets: MoodboardScreenshotAsset[];
  show_logo?: boolean;
  show_title?: boolean;
  show_footer?: boolean;
}
