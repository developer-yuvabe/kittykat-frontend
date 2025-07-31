import { getZodFallback } from "@/lib/utils";
import { Model } from "@/types/a2i-media.types";
import { z, ZodTypeAny } from "zod";

export function useDynamicModelSchema(selectedModel: Model) {
  const fieldSchemas: Record<string, ZodTypeAny> = {};
  const defaultValues: Record<string, any> = {};

  selectedModel.parameters?.forEach((param) => {
    const { id, defaultValue } = param;
    let schema: ZodTypeAny;

    switch (param.type) {
      case "string":
        schema = z.string();
        break;
      case "slider":
        schema = z.number().min(param.min).max(param.max).step(param.step);
        break;
      case "enum":
        schema = z.enum(
          param.options.map((o) => o.optionValue) as [string, ...string[]]
        );
        break;
      case "file":
        schema = z.any();
        break;
      case "boolean":
        schema = z.boolean();
        break;
      default:
        schema = z.any();
    }

    fieldSchemas[id] = schema;
    defaultValues[id] = defaultValue ?? getZodFallback(param.type);
  });

  const baseSchema = z.object(fieldSchemas);

  const extendedSchema = baseSchema.extend({
    prompt: z.string().trim().min(1),
    provider: z.string().min(1),
    model: z.string().min(1),
  });

  // Add default values for provider and model
  defaultValues.provider = selectedModel.provider;
  defaultValues.model = selectedModel.model;
  defaultValues.prompt = "";

  // TODO: Handle superfine for rules

  return {
    schema: extendedSchema,
    defaultValues,
  };
}
