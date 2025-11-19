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
  negativePrompt: existingInputs?.negative_prompt || "",
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
