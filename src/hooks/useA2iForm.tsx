import { Model } from "@/types/a2i-media.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { isEmpty } from "lodash";
import { useEffect, useMemo } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useDynamicModelSchema } from "./useDynamicModelSchema";
import { useSessionStorage } from "./useSessionStorage";

type UseA2iFormProps = {
  formKey: string; // Unique key to identify the form in session storage
  selectedModel: Model | null; // The currently selected model, it can be image generation, video generation, remix, etc.
  dynamicDefualtValues?: Record<string, any>; // Optional dynamic default values that are computed during runtime to override the model's default values
};

export const useA2iForm = ({
  selectedModel,
  formKey,
  dynamicDefualtValues,
}: UseA2iFormProps): UseFormReturn<any> => {
  if (!selectedModel) {
    throw new Error(
      "No model selected. Please select a model before using this reusable form. Cheers!"
    );
  }

  const { setSessionItem } = useSessionStorage();

  const { schema, defaultValues } = useMemo(() => {
    return useDynamicModelSchema(selectedModel, dynamicDefualtValues || {});
  }, [selectedModel?.id, dynamicDefualtValues]);

  const form = useForm<any>({
    resolver: zodResolver(schema as z.ZodTypeAny),
    defaultValues: defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    // Preserve the previous prompt value when switching models
    const previousPromptValue = form.getValues("prompt") || "";

    form.reset(
      {
        ...defaultValues,
        prompt: previousPromptValue,
      },
      {
        keepValues: false,
        keepDefaultValues: false,
      }
    );
  }, [selectedModel?.id]);

  // Watch form values and persist to sessionStorage
  useEffect(() => {
    const subscription = form.watch(() => {
      try {
        const values = form.getValues();
        if (!formKey || isEmpty(values)) return;
        setSessionItem(formKey, values);
      } catch {
        // ignore quota or serialization errors
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return form;
};
