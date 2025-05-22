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
  };
}

export interface ThreadDetails {
  brand_information?: ThreadBrand;
}
