import { ModelSchema, Parameter, ParameterGroup } from "@/types/a2i.types";

export const PARAMETER_PRIORITIES = {
  // Core essentials (1-10)
  prompt: 1,
  aspect_ratio: 2,
  width: 3,
  height: 4,
  image_input: 5,

  // Generation control (11-20)
  prompt_strength: 11,
  num_outputs: 12,
  num_inference_steps: 13,
  guidance: 14,

  // Output settings (21-30)
  output_format: 21,
  output_quality: 22,
  megapixels: 23,

  // Performance & Advanced (31-40)
  go_fast: 31,
  seed: 32,
  disable_safety_checker: 33,
  safety_tolerance: 34,
  prompt_upsampling: 35,
};

export const PARAMETER_GROUPS = {
  ESSENTIALS: {
    id: "essentials",
    title: "Essential Settings",
    description: "Core parameters that define your image generation",
    priority: 1,
  },
  GENERATION: {
    id: "generation",
    title: "Generation Control",
    description: "Fine-tune how your image is generated",
    priority: 2,
  },
  OUTPUT: {
    id: "output",
    title: "Output Settings",
    description: "Control the format and quality of your generated images",
    priority: 3,
  },
  ADVANCED: {
    id: "advanced",
    title: "Advanced Options",
    description: "Performance and experimental settings",
    priority: 4,
  },
};

export const getParameterDisplayTitle = (
  key: string,
  param: Parameter
): string => {
  const displayTitles: Record<string, string> = {
    prompt: "What do you want to create?",
    aspect_ratio: "Image Shape",
    width: "Custom Width",
    height: "Custom Height",
    image_input: "Reference Image",
    prompt_strength: "How much to follow the reference image",
    num_outputs: "Number of images to generate",
    num_inference_steps: "Generation quality (more steps = better quality)",
    guidance: "How closely to follow your prompt",
    output_format: "Image file format",
    output_quality: "Image compression quality",
    megapixels: "Image resolution",
    go_fast: "Fast generation mode",
    seed: "Reproducibility seed",
    disable_safety_checker: "Skip content safety checks",
    safety_tolerance: "Content safety level",
    prompt_upsampling: "Enhance prompt automatically",
  };

  return param.displayTitle || displayTitles[key] || param.title;
};

export const getParameterGroup = (key: string, param: Parameter): string => {
  if (param["x-group"]) return param["x-group"];

  const priority =
    PARAMETER_PRIORITIES[key as keyof typeof PARAMETER_PRIORITIES] || 999;

  if (priority <= 10) return PARAMETER_GROUPS.ESSENTIALS.id;
  if (priority <= 20) return PARAMETER_GROUPS.GENERATION.id;
  if (priority <= 30) return PARAMETER_GROUPS.OUTPUT.id;
  return PARAMETER_GROUPS.ADVANCED.id;
};

export const sortParametersByPriority = (
  params: Array<[string, Parameter]>
): Array<[string, Parameter]> => {
  return params.sort(([keyA], [keyB]) => {
    const priorityA =
      PARAMETER_PRIORITIES[keyA as keyof typeof PARAMETER_PRIORITIES] || 999;
    const priorityB =
      PARAMETER_PRIORITIES[keyB as keyof typeof PARAMETER_PRIORITIES] || 999;
    return priorityA - priorityB;
  });
};

export const groupParameters = (schema: ModelSchema): ParameterGroup[] => {
  if (!schema || !schema.properties) return [];
  const paramEntries = Object.entries(schema.properties);
  const sortedParams = sortParametersByPriority(paramEntries);

  const groups: Record<string, ParameterGroup> = {};

  // Initialize groups
  Object.values(PARAMETER_GROUPS).forEach((group) => {
    groups[group.id] = {
      ...group,
      parameters: [],
    };
  });

  // Distribute parameters to groups
  sortedParams.forEach(([key, param]) => {
    const groupId = getParameterGroup(key, param);
    if (groups[groupId]) {
      groups[groupId].parameters.push([key, param]);
    }
  });

  // Return only non-empty groups, sorted by priority
  return Object.values(groups)
    .filter((group) => group.parameters.length > 0)
    .sort((a, b) => a.priority - b.priority);
};

export const roundToNearestMultiple = (
  value: number,
  multiple: number = 32
): number => {
  return Math.round(value / multiple) * multiple;
};
