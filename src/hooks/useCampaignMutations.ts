import { createCampaign } from "@/services/api/brand.service";
import type { ThreadCampaign } from "@/types/types";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface CreateCampaignData {
  brandId: string;
  title: string;
}

export function useCampaignMutations() {
  const createCampaignMutation = useMutation({
    mutationFn: async ({ brandId, title }: CreateCampaignData) => {
      const campaignData: Omit<ThreadCampaign, "id"> = {
        campaign: {
          title,
        },
        is_custom: true, // Set as manual/custom campaign
      };

      // Backend will create the real ID and timestamps
      return createCampaign(brandId, campaignData);
    },

    onMutate: async ({ title }) => {
      // Show loading toast
      const toastId = toast.loading(`Creating campaign "${title}"...`);
      return { toastId };
    },

    onSuccess: async (data, variables, context) => {
      try {
        // Update the loading toast to success
        toast.success(`Campaign "${variables.title}" created successfully!`, {
          id: context?.toastId,
        });
      } catch (error) {
        console.error("Error refreshing data after campaign creation:", error);
        toast.success(`Campaign "${variables.title}" created successfully!`, {
          id: context?.toastId,
        });
      }

      return data;
    },

    onError: (error, variables, context) => {
      console.error("Error creating campaign:", error);

      // Update the loading toast to error
      toast.error(`Failed to create campaign "${variables.title}"`, {
        id: context?.toastId,
      });
    },
  });

  return {
    createCampaign: createCampaignMutation.mutateAsync,
    isCreatingCampaign: createCampaignMutation.isPending,
    createCampaignSync: createCampaignMutation.mutate,
  };
}
