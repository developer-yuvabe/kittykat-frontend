import { estimatePricing } from "@/services/api/models.service";
import { estimateRemixCredits } from "@/services/api/remix.service";
import { estimateUpscaleCredits } from "@/services/api/upscale.service";
import { estimateVideoGenerationCredits } from "@/services/api/video-gen.service";
import { estimateVtonCredits } from "@/services/api/vton.service";
import { Model } from "@/types/a2i-media.types";
import { useQuery } from "@tanstack/react-query";
import { isEmpty } from "lodash";
import { useMemo } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";

type UseModelPricingProps = {
  form: UseFormReturn<any>;
  model: Model | null;
  enabled?: boolean /* Whether to enable the model pricing endpoint */;
};

const useModelPricing = ({
  form,
  model: selectedModel,
  enabled = true,
}: UseModelPricingProps) => {
  const { isDynamicPricing, estimationTriggers, noOfImagesToBeGeneratedName } =
    useMemo(() => {
      if (!selectedModel) {
        return {
          isDynamicPricing: false,
          estimationTriggers: [],
          noOfImagesToBeGeneratedName: [],
        };
      }

      return {
        isDynamicPricing: selectedModel.pricing?.type === "variable",
        estimationTriggers:
          selectedModel.pricing?.type === "variable"
            ? selectedModel.pricing.estimationTriggers ?? []
            : [],
        // There can be multiple image count parameters, e.g. for seedream 4 model max images and number of images are both image count parameters
        noOfImagesToBeGeneratedName:
          selectedModel.parameters
            ?.filter((p) => p.type === "image_count")
            .map((p) => p.id) || [],
      };
    }, [selectedModel]);

  const noOfImagesToBeGenerated = useWatch({
    control: form.control,
    name: noOfImagesToBeGeneratedName,
    defaultValue: [1],
  });
  const model = useWatch({
    control: form.control,
    name: "model",
  });
  const watchedTriggerValues = form.watch(estimationTriggers) ?? [];

  const { data, isLoading } = useQuery({
    queryKey: [
      "variable-pricing",
      selectedModel?.id,
      ...watchedTriggerValues,
      noOfImagesToBeGenerated,
    ],
    queryFn: async () => {
      const values = form.getValues();

      // There is a small micro delay between model selection and form reset TODO: refactor this hook to be used after form is set
      if (isEmpty(values)) {
        console.log("Skipping pricing estimation as form is not ready");
        return 0;
      }

      if (selectedModel?.type === "video") {
        return await estimateVideoGenerationCredits(values);
      }

      if (selectedModel?.type === "remix") {
        return await estimateRemixCredits(values);
      }

      if (selectedModel?.type === "image-upscale") {
        return await estimateUpscaleCredits(values);
      }

      if (selectedModel?.type === "vton") {
        return await estimateVtonCredits(values);
      }

      return await estimatePricing(values);
    },
    enabled:
      isDynamicPricing &&
      enabled &&
      !!selectedModel?.id &&
      model === selectedModel?.model, // only run when dynamic pricing and model is selected and form is updated
  });

  return {
    credits: isDynamicPricing
      ? data ?? 0
      : (selectedModel?.credits ?? 0) *
        (Array.isArray(noOfImagesToBeGenerated)
          ? noOfImagesToBeGenerated.reduce(
              (acc, val) => acc * (Number(val) || 1),
              1
            )
          : 1),

    isCalculatingCredits: isDynamicPricing ? isLoading : false,
  };
};

export default useModelPricing;
