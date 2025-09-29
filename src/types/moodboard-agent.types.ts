/**
 * Moodboard data structure for the analysis agent
 */
export interface MoodboardAgentData {
  moodboard_id: string;
  campaign_id: string;
  title?: string;
  assets?: MoodboardAgentAsset[];
  no_of_images_in_moodboard?: number;
  screenshot_url?: string;
}

/**
 * Asset structure for moodboard analysis
 */
export interface MoodboardAgentAsset {
  asset_url: string;
  position: number;
  is_placeholder?: boolean;
}

/**
 * Analysis response from the moodboard agent
 */
export interface MoodboardAnalysisResponse {
  summary: string;
  strengths: string[];
  gaps: string[];
  actions: MoodboardAction[];
  next_steps: string[];
  style_analysis: StyleAnalysis;
  user_feedback: string;
}

/**
 * Action recommendations from analysis
 */
export interface MoodboardAction {
  type: "add_assets" | "replace_assets" | "remove_assets" | "balance_assets";
  from: "pexels" | "brand_library" | "unsplash" | "user_upload";
  what: string;
  count?: number;
}

/**
 * Detailed style analysis
 */
export interface StyleAnalysis {
  colors: string[];
  mood: string;
  composition: string;
  theme: string;
  consistency: string;
}

/**
 * Extended pinned item type for moodboards
 */
export interface MoodboardPinnedItem {
  title: string;
  moodboard: MoodboardAgentData;
}
