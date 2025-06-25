import { useA2iStore } from "@/store/a2i.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";

export const useImageGenForm = (): UseFormReturn<any> => {
  const { selectedModel } = useA2iStore();

  const form = useForm<any>({
    resolver: zodResolver(selectedModel.zodSchema as z.ZodTypeAny),
    defaultValues: selectedModel.defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    queueMicrotask(() => {
      const prompt = form.getValues("prompt");
      form.reset({
        ...selectedModel.defaultValues,
        prompt,
      });
    });
  }, [selectedModel.id]);

  return form;
};
