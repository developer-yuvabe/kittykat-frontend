import { BrandPersona, PersonaFormValues } from "@/types/persona.types";
import { Heart, Home, User, Users } from "lucide-react";

export const compositionConfig = {
  solo: {
    icon: User,
    gradient: "from-blue-500/10 to-blue-600/5",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    iconBg: "bg-blue-500/20",
  },
  group: {
    icon: Users,
    gradient: "from-purple-500/10 to-purple-600/5",
    border: "border-purple-200 dark:border-purple-800",
    text: "text-purple-700 dark:text-purple-300",
    iconBg: "bg-purple-500/20",
  },
  couple: {
    icon: Heart,
    gradient: "from-pink-500/10 to-pink-600/5",
    border: "border-pink-200 dark:border-pink-800",
    text: "text-pink-700 dark:text-pink-300",
    iconBg: "bg-pink-500/20",
  },
  family: {
    icon: Home,
    gradient: "from-green-500/10 to-green-600/5",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-300",
    iconBg: "bg-green-500/20",
  },
};

export const listToMultiline = (items?: string[]) =>
  items && items.length ? items.join("\n") : "";

export const parseMultilineList = (value?: string) =>
  value
    ?.split("\n")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

export const getDefaultValues = (
  persona?: BrandPersona | null,
  mode?: "create" | "edit" | "duplicate"
): PersonaFormValues => ({
  name:
    mode === "duplicate" && persona
      ? `${persona.name} (Copy)`
      : persona?.name || "",
  summary: persona?.summary || "",
  image_url: persona?.image_url || "",
  age_range: persona?.age_range || "",
  gender: persona?.gender || "",
  location_focus: persona?.location_focus || "",
  target_geography: persona?.target_geography || "",
  life_stage: persona?.life_stage || "",
  composition_mode: persona?.composition_mode || "",
  psychographics: listToMultiline(persona?.psychographics),
  pain_points: listToMultiline(persona?.pain_points),
  style_preferences: listToMultiline(persona?.style_preferences),
  usage_contexts: listToMultiline(persona?.usage_contexts),
  visual_direction: listToMultiline(persona?.visual_direction),
  messaging_angles: listToMultiline(persona?.messaging_angles),
  content_recommendations: listToMultiline(persona?.content_recommendations),
  do_guidelines: listToMultiline(persona?.do_guidelines),
  dont_guidelines: listToMultiline(persona?.dont_guidelines),
});
