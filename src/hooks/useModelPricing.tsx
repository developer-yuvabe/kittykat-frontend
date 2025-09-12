import { estimatePricing } from "@/services/api/models.service";
import { estimateRemixCredits } from "@/services/api/remix.service";
import { estimateUpscaleCredits } from "@/services/api/upscale.service";
import { estimateVideoGenerationCredits } from "@/services/api/video-gen.service";
import { estimateVtonCredits } from "@/services/api/vton.service";
import { Model } from "@/types/a2i-media.types";
import { useQuery } from "@tanstack/react-query";
import { isEmpty } from "lodash";
import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";

type UseModelPricingProps = {
  form: UseFormReturn<any>;
  model: Model | null;
};

const useModelPricing = ({
  form,
  model: selectedModel,
}: UseModelPricingProps) => {
  const { isDynamicPricing, estimationTriggers, noOfImagesToBeGeneratedName } =
    useMemo(() => {
      if (!selectedModel) {
        return {
          isDynamicPricing: false,
          estimationTriggers: [],
          noOfImagesToBeGeneratedName: null,
        };
      }

      return {
        isDynamicPricing: selectedModel.pricing?.type === "variable",
        estimationTriggers:
          selectedModel.pricing?.type === "variable"
            ? selectedModel.pricing.estimationTriggers ?? []
            : [],
        noOfImagesToBeGeneratedName:
          selectedModel.parameters?.find(
            (param) => param.type === "image_count"
          )?.id ?? null,
      };
    }, [selectedModel]);

  const noOfImagesToBeGenerated = noOfImagesToBeGeneratedName
    ? (form.watch(noOfImagesToBeGeneratedName) as number)
    : 1;
  const watchedTriggerValues = form.watch(estimationTriggers);

  const { data, isPending } = useQuery({
    queryKey: [
      "variable-pricing",
      selectedModel?.id,
      ...watchedTriggerValues,
      noOfImagesToBeGenerated,
    ],
    queryFn: async () => {
      const values = form.getValues();

      // There is a small micro delay between model selection and form reset TODO: refactor this hook to be used after form is set
      if (isEmpty(values) || values.model !== selectedModel?.model) return 0;

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
    enabled: isDynamicPricing && !!selectedModel?.id,
  });

  return {
    credits: isDynamicPricing
      ? data ?? 0
      : (selectedModel?.credits ?? 0) * noOfImagesToBeGenerated,

    isCalculatingCredits: isDynamicPricing ? isPending : false,
  };
};

export default useModelPricing;
