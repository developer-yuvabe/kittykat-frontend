import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { gptImage1Schema } from "@/schema/image-gen.schema";

export const useImageGenForm = () => {
  const methods = useForm<z.infer<typeof gptImage1Schema>>({
    resolver: zodResolver(gptImage1Schema),
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
    mode: "onChange",
  });

  const watchModel = methods.watch("model");

  return {
    ...methods,
    watchModel,
  };
};
