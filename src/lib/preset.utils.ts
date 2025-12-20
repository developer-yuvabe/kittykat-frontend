import {
  a2iAdvancedPromptSchema,
  PromptFields,
  PromptFieldType,
} from "@/types/preset.types";
import { PromptGenerationInputs } from "@/types/types";
import { toast } from "sonner";
import z from "zod";

export const PROMPT_FIELDS: Array<{
  fieldType: PromptFieldType;
  label: string;
  description: string;
}> = [
  {
    fieldType: "moodboard_analysis",
    label: "Moodboard Analysis Prompt",
    description: "Analyzes moodboard references",
  },
  {
    fieldType: "product_analysis",
    label: "Product Analysis Prompt",
    description: "Analyzes product references",
  },
  {
    fieldType: "context_analysis",
    label: "Context Analysis Prompt",
    description: "Analyzes context and brand guidelines",
  },
  {
    fieldType: "analysis_merge",
    label: "Analysis Merge Prompt",
    description: "Merges all analyses into cohesive output",
  },
  {
    fieldType: "prompt_generation",
    label: "Prompt Generation Prompt",
    description: "Generates final prompts for AI models",
  },
];

export const DEFAULT_EMPTY_PROMPTS: PromptFields = {
  moodboard_analysis: "",
  product_analysis: "",
  context_analysis: "",
  analysis_merge: "",
  prompt_generation: "",
};

export type A2iAdvancedPromptFormData = z.infer<typeof a2iAdvancedPromptSchema>;

/**
 * Get the default form values from existing inputs
 */
export const getDefaultFormValues = (
  existingInputs?: PromptGenerationInputs
): A2iAdvancedPromptFormData => ({
  selectedPreset: existingInputs?.preset_id || "",
  productReference: existingInputs?.product_references || [],
  contextReference: existingInputs?.context_references || [],
  promptValue: existingInputs?.prompt || "",
  // Ensure negativePrompt is always a string for the form. Some backend data
  // historically stored this as an empty array -> we want to normalize that
  // here so the form never receives [] and the request doesn't accidentally
  // send an array for negative_prompt.
  negativePrompt: existingInputs?.negative_prompt
    ? Array.isArray(existingInputs.negative_prompt)
      ? existingInputs.negative_prompt.join(", ")
      : String(existingInputs.negative_prompt)
    : "",
  numberOfPrompts: existingInputs?.n || 3,
});

/**
 * Validate form data before generating prompts
 */
export const validatePromptGeneration = (
  referenceMoodboardId: string | undefined,
  selectedPreset: string
): boolean => {
  if (!referenceMoodboardId) {
    toast.error("Please select a reference moodboard first");
    return false;
  }

  if (!selectedPreset) {
    toast.error("Please select a preset");
    return false;
  }

  return true;
};
// Version Keys
export const VERSION_KEYS = [
  "M",
  "MP",
  "MC",
  "MT",
  "MPC",
  "MPT",
  "MCT",
  "All",
] as const;

export type VersionKey = (typeof VERSION_KEYS)[number];

export const VERSION_KEY_DISPLAY_MAP: Record<string, string> = {
  M: "M",
  MP: "MP",
  MC: "MM",
  MT: "MT",
  MPC: "MPM",
  MPT: "MPT",
  MCT: "MMT",
  All: "All",
};

// Version Descriptions (UI)
export const VERSION_DESCRIPTION_MAP: Record<VersionKey, string> = {
  M: "Moodboard Only",
  MP: "Moodboard, Product",
  MC: "Moodboard, Master",
  MT: "Moodboard, Text",
  MPC: "Moodboard, Product, Master",
  MPT: "Moodboard, Product, Text",
  MCT: "Moodboard, Master, Text",
  All: "Moodboard, Product, Master, Text",
};

// Default Version Objects
export const DEFAULT_EMPTY_VERSION = {
  version_key: "M" as VersionKey,
  prompts: { ...DEFAULT_EMPTY_PROMPTS },
};

export const DEFAULT_EMPTY_VERSIONS = VERSION_KEYS.map((key) => ({
  version_key: key,
  prompts: { ...DEFAULT_EMPTY_PROMPTS },
}));

export const REQUIRED_PROMPTS_BY_VERSION: Record<
  VersionKey,
  PromptFieldType[]
> = {
  // All prompts required
  All: [
    "moodboard_analysis",
    "product_analysis",
    "context_analysis",
    "analysis_merge",
    "prompt_generation",
  ],

  // Moodboard only
  M: ["moodboard_analysis", "prompt_generation"],

  // Moodboard + Text
  MT: ["prompt_generation"],

  // Versions has merge + generation
  MP: ["analysis_merge", "prompt_generation"],
  MC: ["analysis_merge", "prompt_generation"],
  MPC: ["analysis_merge", "prompt_generation"],
  MPT: ["analysis_merge", "prompt_generation"],
  MCT: ["analysis_merge", "prompt_generation"],
};
