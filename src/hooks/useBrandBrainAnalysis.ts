import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  triggerBrandBrainAnalysis,
  BrandBrainAnalysisRequest,
  BrandBrainAnalysisResponse,
} from "@/services/api/brand.service";

interface UseBrandBrainAnalysisParams {
  onSuccess?: (data: BrandBrainAnalysisResponse) => void;
  onError?: (error: Error) => void;
}

export function useBrandBrainAnalysis({
  onSuccess,
  onError,
}: UseBrandBrainAnalysisParams = {}) {
  return useMutation({
    mutationFn: (params: BrandBrainAnalysisRequest) =>
      triggerBrandBrainAnalysis(params),
    onSuccess: async (data) => {
      toast.success("Brand Brain Analysis triggered successfully");

      onSuccess?.(data);
    },
    onError: (error: Error) => {
      toast.error("Failed to trigger Brand Brain Analysis", {
        description: error.message || "An unexpected error occurred",
      });

      onError?.(error);
    },
  });
}
