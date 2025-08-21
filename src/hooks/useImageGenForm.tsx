import { useModelsStore } from "@/store/models.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useDynamicModelSchema } from "./useDynamicModelSchema";
import { useSessionStorage } from "./useSessionStorage";

export const useImageGenForm = (): UseFormReturn<any> => {
  const { selectedModel } = useModelsStore();
  const { setSessionItem } = useSessionStorage();

  const { schema, defaultValues } = selectedModel
    ? useDynamicModelSchema(selectedModel)
    : { schema: z.object({}), defaultValues: {} };

  const formModelKey = selectedModel?.id
    ? `imageGenForm-${selectedModel.id}`
    : null;

  const getSavedFormValues = (() => {
    try {
      if (!formModelKey) return null;
      const data = sessionStorage.getItem(formModelKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  })();

  const form = useForm<any>({
    resolver: zodResolver(schema as z.ZodTypeAny),
    defaultValues: getSavedFormValues ?? defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    queueMicrotask(() => {
      form.reset(getSavedFormValues ?? defaultValues, {
        keepDefaultValues: true,
        keepDirty: true,
      });
    });
  }, [selectedModel?.id]);

  // Watch form values and persist to sessionStorage
  useEffect(() => {
    const subscription = form.watch((values) => {
      try {
        if (!formModelKey) return;
        setSessionItem(formModelKey, values);
      } catch {
        // ignore quota or serialization errors
      }
    });
    return () => subscription.unsubscribe();
  }, [form, formModelKey]);

  return form;
};
