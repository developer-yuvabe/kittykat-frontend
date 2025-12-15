import { personaSchema } from "@/schema/persona.schema";
import { BaseApiResponse } from "@/types/types";
import z from "zod";

export interface BrandPersona {
  // Core
  id: string;
  name: string;
  summary?: string;
  image_url?: string;
  image_generation_in_progress?: boolean; // True when persona image is being generated

  // Identity Snapshot
  age_range?: string;
  gender?: string;
  location_focus?: string;
  target_geography?: string;
  life_stage?: string;
  composition_mode?: "solo" | "group" | "couple" | "family";

  // Prompt-ready attributes
  psychographics: string[];
  pain_points: string[];
  style_preferences: string[];
  usage_contexts: string[];
  visual_direction: string[];

  // Content guidelines
  messaging_angles: string[];
  content_recommendations: string[];
  do_guidelines: string[];
  dont_guidelines: string[];

  created_at: string | Date;
  updated_at: string | Date;
}

export interface PersonaUpdateRequest {
  name?: string;
  summary?: string;
  image_url?: string;
  age_range?: string;
  gender?: string;
  location_focus?: string;
  target_geography?: string;
  life_stage?: string;
  composition_mode?: "solo" | "group" | "couple" | "family";
  psychographics?: string[];
  pain_points?: string[];
  style_preferences?: string[];
  usage_contexts?: string[];
  visual_direction?: string[];
  messaging_angles?: string[];
  content_recommendations?: string[];
  do_guidelines?: string[];
  dont_guidelines?: string[];
}

export type GeneratePersonasResponse = BaseApiResponse<{
  personas: BrandPersona[];
  differentiation_summary: string;
  saved_to_brand: boolean;
  count: number;
}>;

export type ListPersonasResponse = BaseApiResponse<BrandPersona[]>;

export type PersonaResponse = BaseApiResponse<BrandPersona>;

export type PersonaFormValues = z.infer<typeof personaSchema>;
