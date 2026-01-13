export interface CampaignBase {
  title: string;
  description?: string;
  tone?: string[];
}

export interface CampaignCreate {
  brand_id: string;
  campaign: CampaignBase;
  is_manual?: boolean;
}
export interface VisualImage {
  id: string;
  filename?: string;
  url: string;
  source?: string;
  is_liked?: boolean;
  ignored?: boolean;
}

export interface SourceHandle {
  platform: string;
  url?: string;
  selected: boolean;
}

export interface CampaignBase {
  title: string;
  description?: string;
  tone?: string[];
}

export interface VisualStyleReference {
  images: string[];
  analysis: Record<string, Array<Record<string, any>>>;
}

export interface MoodboardAssetDimensions {
  width: Record<string, string>;
  height: Record<string, string>;
}

export interface MoodboardAsset {
  id: string;
  comment?: string;
  asset_title: string;
  asset_type: string;
  media_format: string;
  asset_url: string;
  size_bytes: Record<string, string>;
  dimensions: MoodboardAssetDimensions;
  aspect_ratio: string;
  source: string;
  generation_engine?: string;
  input_prompt?: string;
  base_prompt?: string;
  visual_description?: string;
  created_at: string;
  updated_at: string;
  is_liked?: boolean;
}

export type TagItem = {
  value: string;
  selected: boolean;
};

export interface CampaignUpdate {
  campaign?: CampaignBase;
  colors?: string[];
  target_audience?: string;
  visual_style_references?: VisualStyleReference;
  moodboards?: MoodboardAsset[];
  dynamic?: Record<string, any>;
  is_manual?: string;
  visual_images?: VisualImage[];
  tags?: {
    [category: string]: TagItem[];
  };

  selected_sources?: SourceHandle[];
}

export interface CampaignResponse {
  id: string;
  campaign?: CampaignBase;
  colors?: string[];
  target_audience?: string;
  visual_style_references?: VisualStyleReference;
  moodboards?: MoodboardAsset[];
  dynamic?: Record<string, any>;
  is_manual: boolean;
  created_at: string;
  updated_at: string;
  visual_images: VisualImage[];
  selected_sources: SourceHandle[];
  tags: {
    [category: string]: TagItem[];
  };
  moodboard_ready: boolean;
  completed: boolean;
  sub_folders?: SubFolderResponse[];
}

export interface SubFolderBase {
  name: string;
}

export interface SubFolderCreate extends SubFolderBase {
  is_admin_only?: boolean;
  is_kk_folder?: boolean;
  is_kk_selected?: boolean;
}

export interface SubFolderUpdate {
  name?: string;
  is_admin_only?: boolean;
  is_kk_folder?: boolean;
  is_kk_selected?: boolean;
}

export interface SubFolderResponse extends SubFolderBase {
  id: string;
  is_admin_only?: boolean;
  is_kk_folder?: boolean;
  is_kk_selected?: boolean;
  created_at?: string;
  updated_at?: string;
}

export enum SocialOptionId {
  Instagram = "instagram",
  Facebook = "facebook",
  Pinterest = "pinterest",
  Website = "website",
}

export interface SocialOption {
  id: SocialOptionId;
  name: string;
  url: string;
  icon: React.ReactNode;
  isEditing: boolean;
  editValue: string;
}
