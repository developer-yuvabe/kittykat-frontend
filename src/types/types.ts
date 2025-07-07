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
  created_at: string;
  updated_at: string;
}

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
  type: "a2i" | "vton" | "remix" | "video";
  created_at: string;
  updated_at: string;
  parameters: Record<string, any>;
  images?: A2iImageDetail[];
  vton_parameters?: {
    model_image: string;
    product_image: string;
  };
  remix_parameters?: {
    base_image: string;
    reference_images: string[];
  };
  video?: A2iVideoDetail;
};

export type ThreadA2iImage = {
  generations: A2iImageGeneration[];
  reference_moodboard_id?: string;
  prompts?: string[];
};

export interface ThreadDetails {
  brand_information?: ThreadBrand;
  campaign_information?: ThreadCampaign[];
  a2i_image_information?: ThreadA2iImage;
  moodboard_information?: MoodboardInformation[];
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

  moodboard_generation_status?:
    | "not_started"
    | "in_progress"
    | "completed"
    | "failed";

  visual_sources?: SourceHandle[];
  moodboard_analysis_status?:
    | "not_started"
    | "in_progress"
    | "completed"
    | "failed";
  moodboard_tags?: Record<string, string[]>;
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
}

export interface SourceHandle {
  platform: string; // e.g., 'facebook', 'instagram'
  url?: string | null;
  selected: boolean;
}
