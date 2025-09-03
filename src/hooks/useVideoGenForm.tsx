import { useModelsStore } from "@/store/models.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useDynamicModelSchema } from "./useDynamicModelSchema";
import { useSessionStorage } from "./useSessionStorage";
import { isEmpty } from "lodash";

type UseVideoGenFormProps = {
  dynamicDefualtValues?: Record<string, any>;
};

export const useVideoGenForm = (
  props?: UseVideoGenFormProps
): UseFormReturn<any> => {
  const { selectedVideoGenearationModel } = useModelsStore();

  if (!selectedVideoGenearationModel) {
    throw new Error(
      "No video generation model selected. Please select a model before using the form."
    );
  }

  const { setSessionItem } = useSessionStorage();

  const { schema, defaultValues } = selectedVideoGenearationModel
    ? useDynamicModelSchema(
        selectedVideoGenearationModel,
        props?.dynamicDefualtValues || {}
      )
    : { schema: z.object({}), defaultValues: {} };

  const formModelKey = "videoGenForm";

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

  // Watch form values and persist to sessionStorage
  useEffect(() => {
    const subscription = form.watch(() => {
      try {
        const values = form.getValues();
        // remove url fields before saving to session storage first_frame, last_frame, start_image, end_image
        const excludeFields = [
          "first_frame",
          "last_frame",
          "start_image",
          "end_image",
          "prompt",
        ];

        // create a copy without those fields
        const filteredValues = Object.fromEntries(
          Object.entries(values).filter(([key]) => !excludeFields.includes(key))
        );

        if (!formModelKey || isEmpty(filteredValues)) return;
        setSessionItem(formModelKey, filteredValues);
      } catch {
        // ignore quota or serialization errors
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return form;
};
