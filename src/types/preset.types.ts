import z from "zod";

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
  type: "generic" | "custom";
  brand_ids?: string[];
  prompts: PromptFields;
}

export interface PresetsFilterRequest {
  name?: string;
  type?: Array<"generic" | "custom">;
  is_master?: boolean;
  brand_ids?: string[];
  created_by?: string;
  sort_by?: "created_at_desc" | "created_at_asc" | "name_asc" | "name_desc";
  skip?: number;
  limit?: number;
}

export interface PresetUpdateRequest {
  name: string;
  description?: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface PresetDetailResponse extends PresetResponse {
  prompts: PromptFields;
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
  negative_prompt?: string;
  n?: number;
  show_timings?: boolean;
}

export type PromptFieldType =
  | "moodboard_analysis"
  | "product_analysis"
  | "context_analysis"
  | "analysis_merge"
  | "prompt_generation";

export interface AdjustPromptRequest {
  preset_id: string;
  field_type: PromptFieldType;
  adjustment_instructions: string;
}

// Zod Schema for form validation
export const presetFormSchema = z
  .object({
    name: z.string().min(1, "Preset name is required"),
    description: z.string().optional(),
    type: z.enum(["generic", "custom"]),
    brand_ids: z.array(z.string()),
    prompts: z.object({
      moodboard_analysis: z
        .string()
        .min(1, "Moodboard analysis prompt is required"),
      product_analysis: z
        .string()
        .min(1, "Product analysis prompt is required"),
      context_analysis: z
        .string()
        .min(1, "Context analysis prompt is required"),
      analysis_merge: z.string().min(1, "Analysis merge prompt is required"),
      prompt_generation: z
        .string()
        .min(1, "Prompt generation prompt is required"),
    }),
  })
  .refine(
    (data) => {
      // If custom preset, require at least one brand
      if (
        data.type === "custom" &&
        (!data.brand_ids || data.brand_ids.length === 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "At least one brand is required for custom presets",
      path: ["brand_ids"],
    }
  );

export type PresetFormData = z.infer<typeof presetFormSchema>;

// Editor mode enum to avoid using raw strings across codebase
export enum PresetEditorMode {
  NEW = "new",
  EDIT = "edit",
  CLONE = "clone",
  VIEW = "view",
}

export const a2iAdvancedPromptSchema = z.object({
  selectedPreset: z.string(),
  productReference: z.array(z.string()),
  contextReference: z.array(z.string()),
  promptValue: z.string(),
  negativePrompt: z.string(),
  numberOfPrompts: z
    .number()
    .min(1, "At least one prompt is required")
    .max(10, "Maximum 10 prompts allowed"),
});
