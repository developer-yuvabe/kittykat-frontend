export type A2iVideoGenerationResponse = {
  generation_id: string | string[];
  status: "processing" | "completed" | "failed" | "enhancing_prompt";
  provider: string;
};

export type VideoPreset = {
  id: string;
  name: string;
  description: string;
  technique: string;
  isMultiShot?: boolean;
  shotCount?: number;
};

export type PromptMode = "manual" | "enhanced";
