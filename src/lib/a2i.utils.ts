import { AppConfig } from "@/config/app.config";
import {
  fluxDevSchema,
  fluxProSchema,
  fluxProUltraFinetunedSchema,
  fluxProUltraSchema,
  gptImage1Schema,
} from "@/schema/image-gen.schema";
import { ModelInformation } from "@/types/a2i-media.types";
import { Ruler } from "lucide-react";

export const gptImage1Model: ModelInformation<typeof gptImage1Schema> = {
  id: "gpt-image-1",
  name: "GPT Image 1",
  provider: "openai",
  disabled: false,
  parameters: [
    {
      name: "Reference Image(s)",
      formName: "reference_images",
      type: "file",
      maxImages: 10,
      maxSize: AppConfig.MAX_FILE_SIZE,
      accept: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      disabled: false,
    },
    {
      name: "Size",
      formName: "size",
      type: "select",
      options: [
        { value: "1024x1024", label: "1:1" },
        { value: "1536x1024", label: "3:2" },
        { value: "1024x1536", label: "2:3" },
      ],
      icon: Ruler,
      disabled: false,
    },
    {
      name: "Output Format",
      formName: "output_format",
      type: "select",
      options: [
        { value: "png", label: "PNG" },
        { value: "jpeg", label: "JPEG" },
        { value: "webp", label: "WEBP" },
      ],
    },
    {
      name: "Number of Images to be generated",
      formName: "n",
      type: "slider",
      constraints: { min: 1, max: 10, step: 1 },
    },
  ],
  advancedParameters: [
    {
      name: "Quality",
      formName: "quality",
      type: "select",
      options: [
        { label: "High", value: "high" },
        { label: "Medium", value: "medium" },
        { label: "Low", value: "low" },
      ],
    },
    {
      name: "Background",
      formName: "background",
      type: "select",
      options: [
        { label: "Auto", value: "auto" },
        { label: "Transparency", value: "transparency" },
        { label: "Opaque", value: "opaque" },
      ],
    },
    {
      name: "Moderation",
      formName: "moderation",
      type: "select",
      options: [
        { label: "Auto", value: "auto" },
        { label: "Low", value: "low" },
      ],
    },
  ],
  zodSchema: gptImage1Schema,
  defaultValues: {
    prompt: "",
    model: "gpt-image-1",
    provider: "openai",
    size: "1024x1024",
    n: 1,
    quality: "high",
    output_format: "png",
    output_compression: 100,
    background: "auto",
    moderation: "auto",
  },
};

export const fluxDevModel: ModelInformation<typeof fluxDevSchema> = {
  id: "black-forest-labs/flux-dev",
  name: "Flux Dev",
  provider: "replicate",
  disabled: false,
  parameters: [
    {
      name: "Reference Image(s)",
      formName: "image",
      type: "file",
      maxImages: 1,
      maxSize: AppConfig.MAX_FILE_SIZE,
      accept: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      disabled: false,
    },
    {
      name: "Size",
      formName: "aspect_ratio",
      type: "select",
      options: [
        { value: "1:1", label: "1:1" },
        { value: "16:9", label: "16:9" },
        { value: "21:9", label: "21:9" },
        { value: "3:2", label: "3:2" },
        { value: "2:3", label: "2:3" },
        { value: "4:5", label: "4:5" },
        { value: "5:4", label: "5:4" },
        { value: "3:4", label: "3:4" },
        { value: "4:3", label: "4:3" },
        { value: "9:16", label: "9:16" },
        { value: "9:21", label: "9:21" },
      ],
      icon: Ruler,
      disabled: false,
    },
    {
      name: "Output Format",
      formName: "output_format",
      type: "select",
      options: [
        { value: "png", label: "PNG" },
        { value: "jpg", label: "JPG" },
        { value: "webp", label: "WEBP" },
      ],
    },
    {
      name: "Number of Images to be generated",
      formName: "num_outputs",
      type: "slider",
      constraints: { min: 1, max: 4, step: 1 },
    },
  ],
  advancedParameters: [
    {
      name: "Output Quality",
      formName: "output_quality",
      type: "slider",
      constraints: { min: 0, max: 100, step: 1 },
    },

    {
      name: "Prompt Strength",
      formName: "prompt_strength",
      type: "slider",
      constraints: { min: 0.0, max: 1.0, step: 0.01 },
    },
    {
      name: "Number of Inference Steps",
      formName: "num_inference_steps",
      type: "slider",
      constraints: { min: 1, max: 50, step: 1 },
    },
    {
      name: "Guidance Scale",
      formName: "guidance",
      type: "slider",
      constraints: { min: 0, max: 10, step: 0.1 },
    },
    {
      name: "Go Fast",
      formName: "go_fast",
      type: "boolean",
    },
    {
      name: "Disable Safety Checker",
      formName: "disable_safety_checker",
      type: "boolean",
    },
    {
      name: "Megapixels",
      formName: "megapixels",
      type: "select",
      options: [
        { label: "1", value: "1" },
        { label: "0.25", value: "0.25" },
      ],
    },
  ],
  zodSchema: fluxDevSchema,
  defaultValues: {
    prompt: "",
    model: "black-forest-labs/flux-dev",
    provider: "replicate",
    output_format: "webp",
    aspect_ratio: "1:1",
    output_quality: 80,
    go_fast: true,
    prompt_strength: 0.8,
    num_outputs: 1,
    num_inference_steps: 28,
    guidance: 3.5,
    disable_safety_checker: false,
    megapixels: "1",
  },
};

export const fluxProModel: ModelInformation<typeof fluxProSchema> = {
  id: "black-forest-labs/flux-1.1-pro",
  name: "Flux 1.1 Pro",
  provider: "replicate",
  disabled: false,
  parameters: [
    {
      name: "Reference Image(s)",
      formName: "image_prompt",
      type: "file",
      maxImages: 1,
      maxSize: AppConfig.MAX_FILE_SIZE,
      accept: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      disabled: false,
    },
    {
      name: "Size",
      formName: "aspect_ratio",
      type: "select",
      options: [
        { value: "1:1", label: "1:1" },
        { value: "16:9", label: "16:9" },
        { value: "3:2", label: "3:2" },
        { value: "2:3", label: "2:3" },
        { value: "4:5", label: "4:5" },
        { value: "5:4", label: "5:4" },
        { value: "3:4", label: "3:4" },
        { value: "4:3", label: "4:3" },
        { value: "9:16", label: "9:16" },
      ],
      icon: Ruler,
      disabled: false,
    },
    {
      name: "Output Format",
      formName: "output_format",
      type: "select",
      options: [
        { value: "png", label: "PNG" },
        { value: "jpg", label: "JPG" },
        { value: "webp", label: "WEBP" },
      ],
    },
    {
      name: "Number of Images to be generated",
      formName: "num_outputs",
      type: "slider",
      disabled: true,
    },
  ],
  advancedParameters: [
    {
      name: "Output Quality",
      formName: "output_quality",
      type: "slider",
      constraints: { min: 0, max: 100, step: 1 },
    },
    {
      name: "Safety Tolerance",
      formName: "safety_tolerance",
      type: "slider",
      constraints: { min: 1, max: 6, step: 1 },
    },
    {
      name: "Prompt Upsampling",
      formName: "prompt_upsampling",
      type: "boolean",
    },
  ],
  zodSchema: fluxProSchema,
  defaultValues: {
    prompt: "",
    model: "black-forest-labs/flux-1.1-pro",
    provider: "replicate",
    output_format: "webp",
    aspect_ratio: "1:1",
    output_quality: 80,
    safety_tolerance: 2,
    prompt_upsampling: false,
  },
};

export const fluxProUltraModel: ModelInformation<typeof fluxProUltraSchema> = {
  id: "black-forest-labs/flux-1.1-pro-ultra",
  name: "Flux 1.1 Pro Ultra",
  provider: "replicate",
  disabled: false,
  parameters: [
    {
      name: "Reference Image(s)",
      formName: "image_prompt",
      type: "file",
      maxImages: 1,
      maxSize: AppConfig.MAX_FILE_SIZE,
      accept: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      disabled: false,
    },
    {
      name: "Size",
      formName: "aspect_ratio",
      type: "select",
      options: [
        { value: "1:1", label: "1:1" },
        { value: "16:9", label: "16:9" },
        { value: "21:9", label: "21:9" },
        { value: "3:2", label: "3:2" },
        { value: "2:3", label: "2:3" },
        { value: "4:5", label: "4:5" },
        { value: "5:4", label: "5:4" },
        { value: "3:4", label: "3:4" },
        { value: "4:3", label: "4:3" },
        { value: "9:16", label: "9:16" },
        { value: "9:21", label: "9:21" },
      ],

      icon: Ruler,
      disabled: false,
    },
    {
      name: "Output Format",
      formName: "output_format",
      type: "select",
      options: [
        { value: "png", label: "PNG" },
        { value: "jpg", label: "JPG" },
      ],
    },
    {
      name: "Number of Images to be generated",
      formName: "num_outputs",
      type: "slider",
      disabled: true,
    },
  ],
  advancedParameters: [
    {
      name: "Safety Tolerance",
      formName: "safety_tolerance",
      type: "slider",
      constraints: { min: 1, max: 6, step: 1 },
    },
    {
      name: "Image Prompt Strength",
      formName: "image_prompt_strength",
      type: "slider",
      constraints: { min: 0.0, max: 1.0, step: 0.01 },
    },
    {
      name: "Raw Output",
      formName: "raw",
      type: "boolean",
    },
  ],
  zodSchema: fluxProUltraSchema,
  defaultValues: {
    prompt: "",
    model: "black-forest-labs/flux-1.1-pro-ultra",
    provider: "replicate",
    output_format: "jpg",
    aspect_ratio: "1:1",
    safety_tolerance: 2,
    raw: false,
    image_prompt_strength: 0.1,
  },
};

export const birkenstockModel: ModelInformation<
  typeof fluxProUltraFinetunedSchema
> = {
  id: "black-forest-labs/flux-1.1-pro-ultra-finetuned",
  name: "Birkenstock V1",
  provider: "replicate",
  disabled: false,
  parameters: [
    {
      name: "Reference Image(s)",
      formName: "image_prompt",
      type: "file",
      maxImages: 1,
      maxSize: AppConfig.MAX_FILE_SIZE,
      accept: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      disabled: false,
    },
    {
      name: "Size",
      formName: "aspect_ratio",
      type: "select",
      options: [
        { value: "1:1", label: "1:1" },
        { value: "16:9", label: "16:9" },
        { value: "21:9", label: "21:9" },
        { value: "3:2", label: "3:2" },
        { value: "2:3", label: "2:3" },
        { value: "4:5", label: "4:5" },
        { value: "5:4", label: "5:4" },
        { value: "3:4", label: "3:4" },
        { value: "4:3", label: "4:3" },
        { value: "9:16", label: "9:16" },
        { value: "9:21", label: "9:21" },
      ],

      icon: Ruler,
      disabled: false,
    },
    {
      name: "Output Format",
      formName: "output_format",
      type: "select",
      options: [
        { value: "png", label: "PNG" },
        { value: "jpg", label: "JPG" },
      ],
    },
    {
      name: "Number of Images to be generated",
      formName: "num_outputs",
      type: "slider",
      disabled: true,
    },
  ],
  advancedParameters: [
    {
      name: "Safety Tolerance",
      formName: "safety_tolerance",
      type: "slider",
      constraints: { min: 1, max: 6, step: 1 },
    },
    {
      name: "Image Prompt Strength",
      formName: "image_prompt_strength",
      type: "slider",
      constraints: { min: 0.0, max: 1.0, step: 0.01 },
    },
    {
      name: "Raw Output",
      formName: "raw",
      type: "boolean",
    },

    {
      name: "Fine-tune Strength",
      formName: "finetune_strength",
      type: "slider",
      constraints: { min: 0, max: 2, step: 0.1 },
    },
  ],
  zodSchema: fluxProUltraFinetunedSchema,
  defaultValues: {
    prompt: "",
    model: "black-forest-labs/flux-1.1-pro-ultra-finetuned",
    finetune_id: "22a60eb3-7bd6-4603-b52e-12b72dbc5752",
    finetune_strength: 1,
    provider: "replicate",
    output_format: "jpg",
    aspect_ratio: "1:1",
    safety_tolerance: 2,
    raw: false,
    image_prompt_strength: 0.1,
  },
};

export const IMAGE_GENERATION_MODELS = [
  gptImage1Model,
  fluxDevModel,
  fluxProModel,
  fluxProUltraModel,
  birkenstockModel,
] as const;
