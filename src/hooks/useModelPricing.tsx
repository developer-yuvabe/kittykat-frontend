import { estimatePricing } from "@/services/api/models.service";
import { useModelsStore } from "@/store/models.store";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";

type UseModelPricingProps = {
  form: UseFormReturn<any>;
};

const useModelPricing = ({ form }: UseModelPricingProps) => {
  const { selectedModel } = useModelsStore();
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
    }, [selectedModel?.id]);

  const noOfImagesToBeGenerated = noOfImagesToBeGeneratedName
    ? (form.watch(noOfImagesToBeGeneratedName) as number)
    : 1;
  const watchedTriggerValues = form.watch(estimationTriggers);
  const { data, isPending } = useQuery({
    queryKey: ["variable-pricing", selectedModel?.id, ...watchedTriggerValues],
    queryFn: async () => {
      const values = form.getValues();
      return await estimatePricing(values);
    },
    enabled: isDynamicPricing,
  });

  return {
    credits:
      ((isDynamicPricing ? data : selectedModel?.credits) ?? 0) *
      noOfImagesToBeGenerated,
    isCalculatingCredits: isDynamicPricing ? isPending : false,
  };
};

export default useModelPricing;
