import { useModelsStore } from "@/store/models.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useDynamicModelSchema } from "./useDynamicModelSchema";

export const useImageGenForm = (): UseFormReturn<any> => {
  const { selectedModel } = useModelsStore();

  const { schema, defaultValues } = selectedModel
    ? useDynamicModelSchema(selectedModel)
    : { schema: z.object({}), defaultValues: {} };

  const form = useForm<any>({
    resolver: zodResolver(schema as z.ZodTypeAny),
    defaultValues: defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    queueMicrotask(() => {
      form.reset({
        ...defaultValues,
      });
    });
  }, [selectedModel?.id]);

  return form;
};
