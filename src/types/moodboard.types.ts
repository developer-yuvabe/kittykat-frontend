import {
  AggregatedTagItem,
  MoodboardAsset,
  SourceHandle,
  VisualImage,
} from "./types";

export type LimitsState = {
  pinterest_limit: number;
  instagram_limit: number;
  facebook_limit: number;
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
}

export interface MoodboardImageAnalysisRequest {
  pinterest_limit?: number;
  instagram_limit?: number;
  facebook_limit?: number;
  reanalyze?: boolean;
}

export interface MoodboardPatchRequest {
  title?: string;
  visual_style_images?: VisualImage[]; // Define `VisualImage[]` type if available
  aggregated_tags?: Record<string, AggregatedTagItem[]>;
  moodboard_assets?: MoodboardAsset[]; // Define `MoodboardAsset[]` type if available
  visual_sources?: SourceHandle[]; // Define `SourceHandle[]` type if available
}

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

export interface AnalyzeMoodboardRequest {
  image_urls: string[];
}
