export type User = {
  id: string;
  name: string;
  email: string;
  onboarding_completed: boolean;
  brand_ids: string[];
};

export interface BaseApiResponse<T> {
  status_code: number;
  message: string;
  data: T | null;
}

export enum Agents {
  BRANDING_AGENT = "brandingAgent",
  CAMPAIGN_AGENT = "campaignAgent",
}

export interface MoodboardAsset {
  id: string;
  comment: string | null;

  asset_title: string;
  asset_type: string;
  media_format: string;
  asset_url: string;

  size_bytes: {
    $numberInt: string;
  };

  dimensions: {
    width: { $numberInt: string };
    height: { $numberInt: string };
  };

  aspect_ratio: string;

  source: string;
  generation_engine?: string;
  input_prompt?: string;

  created_at: string;
  updated_at: string;

  is_liked?: boolean;
}

export interface ThreadBrand {
  static?: {
    brand?: {
      name?: string;
      tagline?: string;
      values?: string[];
    };
    logos?: string[];
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
    target_audience?: string;
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
    products?: string[];
    social_media?: {
      website?: string;
      instagram?: string;
      facebook?: string;
      tiktok?: string;
    };
  };

  dynamic?: {
    [key: string]: unknown;
  };

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
  visual_style?: string;
  moodboards?: MoodboardAsset[];
}

export interface ThreadDetails {
  brand_information?: ThreadBrand;
  campaign_information?: ThreadCampaign[];
}

export interface QueueItem {
  title: string;
  description: string;
  status: "processing" | "completed" | "failed";
  id: string;
  type: "image";
  created_at: string;
}

export type Context = {
  agentId?: Agents;
  data: Record<string, any> | string;
};
