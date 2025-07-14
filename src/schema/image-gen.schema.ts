import { z } from "zod";

export const gptImage1Schema = z
  .object({
    prompt: z.string().trim().min(1),
    provider: z.literal("openai"),
    model: z.literal("gpt-image-1"),
    reference_images: z.array(z.string()).max(10).optional(),
    size: z.enum(["1024x1024", "1536x1024", "1024x1536"]),
    n: z.number().min(1).max(10),
    output_format: z.enum(["png", "webp", "jpeg"]),
    quality: z.enum(["low", "medium", "high"]),
    output_compression: z.number().min(0).max(100),
    background: z.enum(["auto", "transparent", "opaque"]),
    moderation: z.enum(["auto", "low"]),
  })
  .superRefine((data, ctx) => {
    if (data.output_format === "png" && data.output_compression !== 100) {
      ctx.addIssue({
        path: ["output_compression"],
        code: z.ZodIssueCode.custom,
        message: "PNG must have output_compression set to 100%",
      });
    }
    if (data.output_format === "jpeg" && data.background === "transparent") {
      ctx.addIssue({
        path: ["background"],
        code: z.ZodIssueCode.custom,
        message: "JPEG does not support transparent background",
      });
    }
  });

export const fluxDevSchema = z.object({
  prompt: z.string().trim().min(1),
  provider: z.literal("replicate"),
  model: z.literal("black-forest-labs/flux-dev"),
  image: z.string().url().optional(),
  output_format: z.enum(["png", "webp", "jpg"]).default("webp"),
  aspect_ratio: z
    .enum([
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
    ])
    .default("1:1"),
  output_quality: z.number().min(0).max(100).default(80),
  seed: z.number().int().optional(),
  go_fast: z.boolean().default(true),
  prompt_strength: z.number().min(0).max(1).default(0.8),
  num_outputs: z.number().min(1).max(4).default(1),
  num_inference_steps: z.number().min(1).max(50).default(28),
  guidance: z.number().min(0).max(10).default(3.5),
  disable_safety_checker: z.boolean().default(false),
  megapixels: z.enum(["1", "0.25"]).default("1"),
});

export const fluxProSchema = z
  .object({
    prompt: z.string().trim().min(1),
    provider: z.literal("replicate"),
    model: z.literal("black-forest-labs/flux-1.1-pro"),
    image_prompt: z.string().url().optional(),
    output_format: z.enum(["png", "webp", "jpg"]).default("webp"),
    aspect_ratio: z
      .enum([
        "custom",
        "1:1",
        "16:9",
        "3:2",
        "2:3",
        "4:5",
        "5:4",
        "3:4",
        "4:3",
        "9:16",
      ])
      .default("1:1"),
    width: z.number().int().optional(),
    height: z.number().int().optional(),
    output_quality: z.number().min(0).max(100).default(80),
    safety_tolerance: z.number().int().min(1).max(6).default(2),
    prompt_upsampling: z.boolean().default(false),
    seed: z.number().int().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.aspect_ratio === "custom") {
      if (!data.width || !data.height) {
        ctx.addIssue({
          path: ["width"],
          code: z.ZodIssueCode.custom,
          message: "Custom aspect ratio requires width and height",
        });
      } else {
        if (data.width < 256 || data.width > 1440) {
          ctx.addIssue({
            path: ["width"],
            code: z.ZodIssueCode.custom,
            message: "Width must be between 256 and 1440",
          });
        }
        if (data.height < 256 || data.height > 1440) {
          ctx.addIssue({
            path: ["height"],
            code: z.ZodIssueCode.custom,
            message: "Height must be between 256 and 1440",
          });
        }
      }
    } else {
      if (data.width || data.height) {
        ctx.addIssue({
          path: ["aspect_ratio"],
          code: z.ZodIssueCode.custom,
          message: "Width/height can only be set when aspect_ratio is 'custom'",
        });
      }
    }
  });

export const fluxProUltraSchema = z.object({
  prompt: z.string().trim().min(1),
  provider: z.literal("replicate"),
  model: z.literal("black-forest-labs/flux-1.1-pro-ultra"),
  image_prompt: z.string().url().optional(),
  output_format: z.enum(["png", "jpg"]).default("jpg"),
  aspect_ratio: z
    .enum([
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
    ])
    .default("1:1"),
  safety_tolerance: z.number().int().min(1).max(6).default(2),
  seed: z.number().int().optional(),
  raw: z.boolean().default(false),
  image_prompt_strength: z.number().min(0).max(1).default(0.1),
});

export const fluxProUltraFinetunedSchema = z.object({
  prompt: z.string().trim().min(1),
  provider: z.literal("replicate"),
  model: z.literal("black-forest-labs/flux-1.1-pro-ultra-finetuned"),
  finetune_id: z.string().trim().min(1),
  finetune_strength: z.number().min(0).max(2).default(1),
  image_prompt: z.string().url().optional(),
  output_format: z.enum(["png", "jpg"]).default("jpg"),
  aspect_ratio: z
    .enum([
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
    ])
    .default("1:1"),
  safety_tolerance: z.number().int().min(1).max(6).default(2),
  seed: z.number().int().optional(),
  raw: z.boolean().default(false),
  image_prompt_strength: z.number().min(0).max(1).default(0.1),
});
