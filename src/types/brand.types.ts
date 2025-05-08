import { createBrandSchema, urlExtractionSchema } from "@/schema/brand.schema";
import { z } from "zod";

export interface Brand {
  name: string;
  tagline: string;
  mission: string;
  vision: string;
  values: string[];
}

export interface LogoRules {
  minimum_size?: string;
  clear_space?: string;
  prohibited_uses?: string[];
}

export interface Logo {
  primary?: string;
  alternate?: string[];
  rules?: LogoRules;
}

export interface Font {
  name?: string;
  weights?: string[];
  usage?: string;
}

export interface Typography {
  primary_font?: Font;
  secondary_font?: Font;
}

export interface Color {
  name: string;
  hex: string;
  rgb: string;
}

export interface CreativeApproachCasting {
  description: string;
  goal: string;
}

export interface CreativeApproachRepresentation {
  values: string[];
  guidelines: string;
}

export interface CreativeApproach {
  theme: string;
  casting: CreativeApproachCasting;
  network: string;
  representation: CreativeApproachRepresentation;
}

export interface VideoGuidelinesStyling {
  principles: string[];
}

export interface VideoGuidelinesLight {
  principles: string[];
}

export interface VideoGuidelinesPosing {
  style: string;
}

export interface VideoGuidelinesSetting {
  role: string;
}

export interface VideoGuidelinesMotion {
  approach: string;
  camera_work: string;
  lighting: string;
}

export interface VideoGuidelinesLegDown {
  intent: string;
}

export interface VideoGuidelinesStillLife {
  presentation: string;
}

export interface VideoGuidelines {
  styling: VideoGuidelinesStyling;
  light: VideoGuidelinesLight;
  posing: VideoGuidelinesPosing;
  setting: VideoGuidelinesSetting;
  motion: VideoGuidelinesMotion;
  leg_down: VideoGuidelinesLegDown;
  still_life: VideoGuidelinesStillLife;
}

export interface BrandResponse {
  id: string;
  brand: Brand;
  logo?: Logo;
  typography?: Typography;
  colors?: Record<string, Color>;
  creative_approach?: CreativeApproach;
  video_guidelines?: VideoGuidelines;
  created_by: string;
}

export interface BrandRequest {
  brand: Brand;
  logo?: Logo;
  typography?: Typography;
  colors?: Record<string, Color>;
  creative_approach?: CreativeApproach;
  video_guidelines?: VideoGuidelines;
}

export interface BrandIdentity {
  brand: Brand;
  logo?: Logo;
  typography?: Typography;
  colors?: Record<string, Color>;
  creative_approach?: CreativeApproach;
  video_guidelines?: VideoGuidelines;
}

export interface BrandsListResponse {
  brands: BrandResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface BrandURLRequest {
  brand_url: string;
}

// Type for the form values
export type BrandFormValues = z.infer<typeof createBrandSchema>;
export type UrlExtractionFormValues = z.infer<typeof urlExtractionSchema>;
