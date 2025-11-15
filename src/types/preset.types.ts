export interface PromptFields {
  moodboard_analysis: string;
  product_analysis: string;
  context_analysis: string;
  analysis_merge: string;
  prompt_generation: string;
}

export interface PresetCreateRequest {
  name: string;
  description?: string;
  is_master: boolean;
  type: "generic" | "custom";
  brand_ids?: string[];
  prompts: PromptFields;
}

export interface PresetUpdateRequest {
  name: string;
  description?: string;
  is_master: boolean;
  type: "generic" | "custom";
  brand_ids?: string[];
  prompts: PromptFields;
}

export interface PresetPatchRequest {
  name?: string;
  description?: string;
  is_master?: boolean;
  type?: "generic" | "custom";
  brand_ids?: string[];
  prompts?: PromptFields;
}

export interface PresetResponse {
  id: string;
  name: string;
  description?: string;
  is_master: boolean;
  type: "generic" | "custom";
  brand_ids?: string[];
  prompts?: PromptFields;
}

export interface PresetListResponse {
  presets: PresetResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface PromptGenerationRequest {
  preset_id: string;
  brand_id: string;
  moodboard_id: string;
  product_references?: string[];
  context_references?: string[];
  prompt?: string;
  negative_prompt?: string[];
  n?: number;
  show_timings?: boolean;
}
