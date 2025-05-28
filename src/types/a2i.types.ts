// types/parameters.ts
export type ParameterType =
  | "string"
  | "integer"
  | "number"
  | "boolean"
  | "enum"
  | "file";

export interface BaseParameter {
  type: ParameterType;
  title: string;
  displayTitle?: string;
  description?: string;
  "x-order"?: number;
  "x-priority"?: number;
  "x-group"?: string;
  default?: any;
}

export interface StringParameter extends BaseParameter {
  type: "string";
  format?: "uri";
}

export interface NumberParameter extends BaseParameter {
  type: "integer" | "number";
  minimum?: number;
  maximum?: number;
}

export interface BooleanParameter extends BaseParameter {
  type: "boolean";
}

export interface EnumParameter extends BaseParameter {
  type: "enum";
  enum: string[];
}

export interface FileParameter extends BaseParameter {
  type: "file";
  accept?: string;
}

export type Parameter =
  | StringParameter
  | NumberParameter
  | BooleanParameter
  | EnumParameter
  | FileParameter;

export interface ModelSchema {
  title: string;
  required: string[];
  properties: Record<string, Parameter>;
}

export interface ModelDefinition {
  id: string;
  name: string;
  description: string;
  schema: ModelSchema;
}

export interface ParameterGroup {
  id: string;
  title: string;
  description?: string;
  priority: number;
  parameters: Array<[string, Parameter]>;
}

// Model definitions
export const models: ModelDefinition[] = [
  {
    id: "flux-dev",
    name: "FLUX-dev",
    description: "High-quality image generation with advanced controls",
    schema: {
      title: "FLUX-dev Input",
      required: ["prompt"],
      properties: {
        seed: {
          type: "integer",
          title: "Seed",
          "x-order": 7,
          description: "Random seed. Set for reproducible generation",
        },

        go_fast: {
          type: "boolean",
          title: "Go Fast",
          default: true,
          "x-order": 11,
          description: "Run faster predictions with additional optimizations.",
        },
        guidance: {
          type: "number",
          title: "Guidance",
          default: 3,
          maximum: 10,
          minimum: 0,
          "x-order": 6,
          description:
            "Guidance for generated image. Lower values can give more realistic images. Good values to try are 2, 2.5, 3 and 3.5",
        },
        megapixels: {
          type: "enum",
          enum: ["1", "0.25"],
          title: "megapixels",
          description: "Approximate number of megapixels for generated image",
          default: "1",
          "x-order": 12,
        },
        num_outputs: {
          type: "integer",
          title: "Num Outputs",
          default: 1,
          maximum: 4,
          minimum: 1,
          "x-order": 4,
          description: "Number of outputs to generate",
        },
        aspect_ratio: {
          type: "enum",
          enum: [
            "1:1",
            "16:9",
            "21:9",
            "3:2",
            "2:3",
            "4:5",
            "5:4",
            "3:4",
            "4:3",
            "9:16",
            "9:21",
          ],
          title: "aspect_ratio",
          description: "Aspect ratio for the generated image",
          default: "1:1",
          "x-order": 1,
        },
        output_format: {
          type: "enum",
          enum: ["webp", "jpg", "png"],
          title: "output_format",
          description: "Format of the output images",
          default: "webp",
          "x-order": 8,
        },
        output_quality: {
          type: "integer",
          title: "Output Quality",
          default: 80,
          maximum: 100,
          minimum: 0,
          "x-order": 9,
          description:
            "Quality when saving the output images, from 0 to 100. 100 is best quality, 0 is lowest quality. Not relevant for .png outputs",
        },
        prompt_strength: {
          type: "number",
          title: "Prompt Strength",
          default: 0.8,
          maximum: 1,
          minimum: 0,
          "x-order": 3,
          description:
            "Prompt strength when using img2img. 1.0 corresponds to full destruction of information in image",
        },
        num_inference_steps: {
          type: "integer",
          title: "Num Inference Steps",
          default: 28,
          maximum: 50,
          minimum: 1,
          "x-order": 5,
          description:
            "Number of denoising steps. Recommended range is 28-50, and lower number of steps produce lower quality outputs, faster.",
        },
        disable_safety_checker: {
          type: "boolean",
          title: "Disable Safety Checker",
          default: false,
          "x-order": 10,
          description: "Disable safety checker for generated images.",
        },
      },
    },
  },
  {
    id: "flux-1.1-pro",
    name: "FLUX-1.1-pro",
    description: "Professional grade image generation with enhanced controls",
    schema: {
      title: "FLUX-1.1-pro Input",
      required: ["prompt"],
      properties: {
        seed: {
          type: "integer",
          title: "Seed",
          "x-order": 6,
          description: "Random seed. Set for reproducible generation",
        },
        width: {
          type: "integer",
          title: "Width",
          maximum: 1440,
          minimum: 256,
          "x-order": 3,
          description:
            "Width of the generated image in text-to-image mode. Only used when aspect_ratio=custom. Must be a multiple of 32 (if it's not, it will be rounded to nearest multiple of 32). Note: Ignored in img2img and inpainting modes.",
        },
        height: {
          type: "integer",
          title: "Height",
          maximum: 1440,
          minimum: 256,
          "x-order": 4,
          description:
            "Height of the generated image in text-to-image mode. Only used when aspect_ratio=custom. Must be a multiple of 32 (if it's not, it will be rounded to nearest multiple of 32). Note: Ignored in img2img and inpainting modes.",
        },
        aspect_ratio: {
          type: "enum",
          enum: [
            "custom",
            "1:1",
            "16:9",
            "3:2",
            "2:3",
            "4:5",
            "5:4",
            "9:16",
            "3:4",
            "4:3",
          ],
          title: "aspect_ratio",
          description: "Aspect ratio for the generated image",
          default: "1:1",
          "x-order": 2,
        },
        output_format: {
          type: "enum",
          enum: ["webp", "jpg", "png"],
          title: "output_format",
          description: "Format of the output images.",
          default: "webp",
          "x-order": 8,
        },
        output_quality: {
          type: "integer",
          title: "Output Quality",
          default: 80,
          maximum: 100,
          minimum: 0,
          "x-order": 9,
          description:
            "Quality when saving the output images, from 0 to 100. 100 is best quality, 0 is lowest quality. Not relevant for .png outputs",
        },
        safety_tolerance: {
          type: "integer",
          title: "Safety Tolerance",
          default: 2,
          maximum: 6,
          minimum: 1,
          "x-order": 5,
          description:
            "Safety tolerance, 1 is most strict and 6 is most permissive",
        },
        prompt_upsampling: {
          type: "boolean",
          title: "Prompt Upsampling",
          default: false,
          "x-order": 7,
          description:
            "Automatically modify the prompt for more creative generation",
        },
      },
    },
  },
];
