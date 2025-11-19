export interface BaseApiResponse<T> {
  status_code: number;
  message: string;
  data: T | null;
}

export enum Agents {
  BRANDING_AGENT = "brandingAgent",
  CAMPAIGN_AGENT = "campaignAgent",
  A2I_IMAGES_AGENT = "A2I_IMAGES_AGENT",
}

export interface ThreadBrand {
  static?: {
    brand?: {
      name?: string;
      tagline?: string;
      mission?: string;
      vision?: string;
      values?: string[];
      personality?: string[];
    };
    colors?: {
      primary?: {
        name?: string;
        hex?: string;
      };
      secondary?: {
        name?: string;
        hex?: string;
      };
      others?: {
        name?: string;
        hex?: string;
      }[];
    };
    typography?: {
      primaryFont?: {
        name?: string;
        weights?: string[];
      };
      secondaryFont?: {
        name?: string;
        weights?: string[];
      };
    };
    photography?: {
      framing?: string;
      camera_technique?: string;
      lens_and_distance?: string;
      aperture_and_focus?: string;
      motion?: string;
    };
    lighting?: {
      type?: string;
      studio_usage?: string;
      preferred_moods?: string;
    };
    styling?: {
      tone?: string;
      mobility?: string;
      textures?: string;
    };
    casting: {
      diversity_policy?: string;
      persona?: string;
      variation?: string;
    };
    setting?: {
      emotional_tone?: string;
      material_quality?: string;
      avoid?: string;
    };
    target_audience?: string;
    products?: string[];
    social_media?: {
      website: string;
      instagram: string;
      facebook: string;
      tiktok: string;
      pinterest?: string;
    };
  };

  dynamic?: Record<string, any>;

  brand_media?: {
    status: "succeeded" | "failed" | "running";
    posts: {
      id: string;
      url: string;
      source: string;
      caption: string;
    }[];
    message?: string;
  };
}

export interface ThreadCampaign {
  id: string;
  campaign?: {
    title?: string;
    description?: string;
    tone?: string[];
  };
  colors?: string[];
  target_audience?: string;
  content_campaign_ideas?: {
    title: string;
    content: string;
    sections_included: string[];
    description: string;
  };
  dynamic?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  is_custom?: boolean;
  is_archived?: boolean;
  position?: number;
}

export type ThreadCampaignUpdate = Partial<Omit<ThreadCampaign, "id">>;

export type A2iImageDetail = {
  id: string;
  url: string;
  created_at: string;
  position?: number;
  is_liked?: boolean;
};

export type A2iVideoDetail = {
  id: string;
  url: string;
  created_at: string;
  is_liked?: boolean;
  // position?: number;
};

export type A2iImageGeneration = {
  id: string;
  status: "processing" | "completed" | "failed";
  type:
    | "image_generation"
    | "vton"
    | "remix"
    | "video"
    | "upscale"
    | "video_generation"
    | "a2i"; // Backward compatibility
  created_at: string | { $date: string };
  updated_at: string | { $date: string };
  parameters: Record<string, any>;
  images?: A2iImageDetail[];
  vton_parameters?: {
    model_image: string;
    product_image: string;
  };
  remix_parameters?: {
    base_image?: string;
    image?: string;
    reference_images: string[];
  };
  upscale_parameters?: {
    base_image: string;
    scale_factor: string;
    optimized_for?: string;
  };
  video?: A2iVideoDetail;
  is_nsfw_detected?: boolean;
  product_reference_images?: string[];
};

export type ThreadA2iImage = {
  generations: A2iImageGeneration[];
  reference_moodboard_id?: string;
  reference_moodboard_assets?: MoodboardAsset[];
  prompts?: string[];
};

export interface ThreadDetails {
  brand_information?: ThreadBrand;
  campaign_information?: ThreadCampaign[];
  a2i_image_information?: ThreadA2iImage;
  moodboard_information?: MoodboardInformation[];
  moodboard_tags?: {
    [key: string]: string[];
  };
  analysis_logs?: AnalysisLogDetail[];
}

export interface AnalysisLogDetail {
  log_id: string;
  user_id: string;
  campaign_id?: string;
  analysis_type: string;
  status: string;
  progress_percent: number;
  job_execution_id: string;
  cloud_run_execution_id?: string;
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  created_at: string; // ISO datetime string
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  user_friendly_messages: UserMessage[];
  technical_details: TechnicalDetails;
  metadata: {
    [key: string]: string | number | boolean;
  };
}

export interface UserMessage {
  message: string;
  timestamp: string; // ISO datetime string
}

export interface ErrorDetail {
  message: string;
  details: {
    [key: string]: string | number | boolean;
  };
  timestamp: string;
}

export interface TechnicalDetails {
  errors: ErrorDetail[];
  warnings: string[];
  processing_stats: {
    [key: string]: string | number;
  };
}

export interface QueueItem {
  title: string;
  description: string;
  status: "processing" | "completed" | "failed";
  id: string;
  type: "image";
  created_at: string;
  metadata?: Record<string, any>;
}

export type Context = {
  agentId?: Agents;
  data: Record<string, any> | string;
};

export type PaginationMeta = {
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
  next_skip?: number;
  previous_skip?: number;
};

export interface MoodboardInformation {
  id: string;
  campaign_id: string;
  title: string;
  concept: string;

  visual_style_images: VisualImage[];

  aggregated_tags: Record<string, AggregatedTagItem[]>;

  style_analysis_status:
    | "not_started"
    | "in_progress"
    | "completed"
    | "failed"
    | "partially_completed";

  style_analysis_progress_messages?: string[] | null;
  style_analysis_progress?: number | null;

  moodboard_assets: MoodboardAsset[];

  visual_sources?: SourceHandle[];
  moodboard_analysis_status?:
    | "not_started"
    | "in_progress"
    | "completed"
    | "failed";
  moodboard_tags?: Record<string, string[]>;
  selected_moodboard_tags?: Record<string, string[]>;

  moodboard_preview: {
    url: string;
  };
  prompts?: GeneratedPrompt[];
  prompt_generation_inputs?: PromptGenerationInputs;
  is_prompt_generation_in_progress?: boolean;
  prompt_generation_conflict_notes?: string;
}

export interface VisualImage {
  gallery_item_id: string;
  is_liked: boolean;
  to_ignore: boolean;
  tags: Record<string, TagItem[]>;
  is_deleted?: boolean;
}

export interface TagItem {
  tag: string;
  weight: number;
}

export interface AggregatedTagItem {
  value: string;
  selected: boolean;
}

export interface MoodboardAsset {
  gallery_item_id: string;
  position: number;
  is_placeholder?: boolean;
}

export interface SourceHandle {
  platform: string; // e.g., 'facebook', 'instagram'
  url?: string | null;
  selected: boolean;
}

// For advanced prompt generation mode
export interface GeneratedPrompt {
  prompt: string;
  conflict_notes?: string;
  product_references: string[];
  context_references: string[];
}

export interface PromptGenerationInputs {
  preset_id: string;
  product_references: string[];
  context_references: string[];
  prompt?: string;
  negative_prompt: string;
  n: number;
}
