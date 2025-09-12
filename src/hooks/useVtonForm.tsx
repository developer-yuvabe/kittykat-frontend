import { useModelsStore } from "@/store/models.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useDynamicModelSchema } from "./useDynamicModelSchema";
import { useSessionStorage } from "./useSessionStorage";
import { isEmpty } from "lodash";

type UseVtonFormProps = {
  dynamicDefualtValues?: Record<string, any>;
};

export const useVtonForm = (props?: UseVtonFormProps): UseFormReturn<any> => {
  const { selectedVtonModel } = useModelsStore();

  if (!selectedVtonModel) {
    throw new Error(
      "No model selected. Please select a model before using the form."
    );
  }

  const { setSessionItem } = useSessionStorage();

  const { schema, defaultValues } = selectedVtonModel
    ? useDynamicModelSchema(
        selectedVtonModel,
        props?.dynamicDefualtValues || {}
      )
    : { schema: z.object({}), defaultValues: {} };

  const formModelKey = "vtonForm";

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
      const previousPromptValue = form.getValues("prompt") || "";
      form.reset(
        {
          ...defaultValues,
          prompt: previousPromptValue,
        },
        {
          keepDefaultValues: true,
          keepDirty: true,
        }
      );
    });
  }, [selectedVtonModel?.id]);

  // Watch form values and persist to sessionStorage
  useEffect(() => {
    const subscription = form.watch(() => {
      try {
        const values = form.getValues();
        if (!formModelKey || isEmpty(values)) return;
        setSessionItem(formModelKey, values);
      } catch {
        // ignore quota or serialization errors
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return form;
};
