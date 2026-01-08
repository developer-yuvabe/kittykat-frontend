import {
  createCampaign,
  patchCampaign as apiPatchCampaign,
  deleteCampaign as apiDeleteCampaign,
  setCampaignCuration as apiSetCampaignCuration,
} from "@/services/api/brand.service";
import type { ThreadCampaign, ThreadCampaignUpdate } from "@/types/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBrandStore } from "@/store/brand.store";
import { useUndoableAction } from "@/hooks/useUndoableAction";

interface CreateCampaignData {
  brandId: string;
  title: string;
}

interface UpdateCampaignData {
  brandId: string;
  campaignId: string;
  payload: Partial<ThreadCampaignUpdate>;
}

interface UpdateCampaignOptions extends UpdateCampaignData {
  title?: string;
  undoSeconds?: number;
  onSuccess?: (data: ThreadCampaign) => void;
}

interface DeleteCampaignData {
  brandId: string;
  campaignId: string;
}

interface DeleteCampaignOptions extends DeleteCampaignData {
  title: string;
  undoSeconds?: number;
  onSuccess?: () => void;
}

interface SetCurationData {
  brandId: string;
  campaignId: string;
  isCurated: boolean;
}

interface SetCurationOptions extends SetCurationData {
  title: string;
  undoSeconds?: number;
  onSuccess?: (data: ThreadCampaign) => void;
}

export function useCampaignMutations() {
  const queryClient = useQueryClient();
  const { execute } = useUndoableAction();

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

  // UPDATE MUTATION (internal use only)
  const updateCampaignMutation = useMutation({
    mutationFn: ({ brandId, campaignId, payload }: UpdateCampaignData) =>
      apiPatchCampaign(brandId, campaignId, payload),

    onSuccess: (data: ThreadCampaign, variables) => {
      // Ensure store matches server response
      useBrandStore.setState((state) => ({
        brands: state.brands.map((b) =>
          b.id === variables.brandId
            ? {
                ...b,
                campaigns: b.campaigns.map((c) =>
                  c.id === data.id ? { ...c, ...data } : c
                ),
              }
            : b
        ),
      }));

      queryClient.invalidateQueries({ queryKey: ["brands"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["campaigns"], exact: false });
      queryClient.invalidateQueries({
        queryKey: ["campaign-counts"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["gallery-items"],
        exact: false,
      });
    },
  });

  // UPDATE WRAPPER with optimistic updates and undo
  const updateCampaign = async ({
    brandId,
    campaignId,
    payload,
    title,
    undoSeconds = 3,
    onSuccess,
  }: UpdateCampaignOptions) => {
    const prevBrands = useBrandStore.getState().brands;
    const displayTitle = title || payload.campaign?.title || "Campaign";

    // Optimistic update in the store
    useBrandStore.setState((state) => ({
      brands: state.brands.map((b) =>
        b.id === brandId
          ? {
              ...b,
              campaigns: b.campaigns.map((c) =>
                c.id === campaignId ? { ...c, ...payload } : c
              ),
            }
          : b
      ),
    }));

    await execute({
      title: displayTitle,
      loadingMessage: `Updating "${displayTitle}"...`,
      successMessage: `"${displayTitle}" updated successfully.`,
      errorMessage: `Failed to update "${displayTitle}".`,
      undoSeconds,
      onUndo: () => {
        useBrandStore.setState({ brands: prevBrands });
      },
      action: async () => {
        try {
          const result = await updateCampaignMutation.mutateAsync({
            brandId,
            campaignId,
            payload,
          });
          onSuccess?.(result);
        } catch (error) {
          useBrandStore.setState({ brands: prevBrands });
          throw error;
        }
      },
    });
  };

  // DELETE MUTATION (internal use only)
  const deleteCampaignMutation = useMutation({
    mutationFn: ({ brandId, campaignId }: DeleteCampaignData) =>
      apiDeleteCampaign(brandId, campaignId),

    onSuccess: (_, variables) => {
      useBrandStore.setState((state) => ({
        brands: state.brands.map((b) =>
          b.id === variables.brandId
            ? {
                ...b,
                campaigns: b.campaigns.filter(
                  (c) => c.id !== variables.campaignId
                ),
              }
            : b
        ),
      }));

      queryClient.invalidateQueries({ queryKey: ["brands"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["campaigns"], exact: false });
      queryClient.invalidateQueries({
        queryKey: ["campaign-counts"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["gallery-items"],
        exact: false,
      });
    },
  });

  // DELETE WRAPPER with optimistic updates and undo
  const deleteCampaign = async ({
    brandId,
    campaignId,
    title,
    undoSeconds = 3,
    onSuccess,
  }: DeleteCampaignOptions) => {
    const prevBrands = useBrandStore.getState().brands;

    // Optimistic delete from the store
    useBrandStore.setState((state) => ({
      brands: state.brands.map((b) =>
        b.id === brandId
          ? {
              ...b,
              campaigns: b.campaigns.filter((c) => c.id !== campaignId),
            }
          : b
      ),
    }));

    await execute({
      title,
      loadingMessage: `Deleting "${title}"...`,
      successMessage: `"${title}" deleted successfully.`,
      errorMessage: `Failed to delete "${title}".`,
      undoSeconds,
      onUndo: () => {
        useBrandStore.setState({ brands: prevBrands });
      },
      action: async () => {
        try {
          await deleteCampaignMutation.mutateAsync({ brandId, campaignId });
          onSuccess?.();
        } catch (error) {
          useBrandStore.setState({ brands: prevBrands });
          throw error;
        }
      },
    });
  };

  // SET CURATION MUTATION (internal use only)
  const setCurationMutation = useMutation({
    mutationFn: ({ brandId, campaignId, isCurated }: SetCurationData) =>
      apiSetCampaignCuration(brandId, campaignId, isCurated),

    onSuccess: (data: ThreadCampaign, variables) => {
      useBrandStore.setState((state) => ({
        brands: state.brands.map((b) =>
          b.id === variables.brandId
            ? {
                ...b,
                campaigns: b.campaigns.map((c) =>
                  c.id === data.id ? { ...c, ...data } : c
                ),
              }
            : b
        ),
      }));

      queryClient.invalidateQueries({ queryKey: ["brands"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["campaigns"], exact: false });
      queryClient.invalidateQueries({
        queryKey: ["campaign-counts"],
        exact: false,
      });
    },
  });

  // SET CURATION WRAPPER with optimistic updates and undo
  const setCampaignCuration = async ({
    brandId,
    campaignId,
    isCurated,
    title,
    undoSeconds = 3,
    onSuccess,
  }: SetCurationOptions) => {
    const prevBrands = useBrandStore.getState().brands;

    // Optimistic update in the store
    useBrandStore.setState((state) => ({
      brands: state.brands.map((b) =>
        b.id === brandId
          ? {
              ...b,
              campaigns: b.campaigns.map((c) =>
                c.id === campaignId
                  ? { ...c, is_curated_for_brand: isCurated }
                  : c
              ),
            }
          : b
      ),
    }));

    await execute({
      title,
      loadingMessage: `${
        isCurated ? "Marking" : "Unmarking"
      } "${title}" as curated campaign...`,
      successMessage: `"${title}" ${
        isCurated ? "marked" : "unmarked"
      } as curated campaign successfully.`,
      errorMessage: `Failed to ${
        isCurated ? "mark" : "unmark"
      } "${title}" as curated campaign.`,
      undoSeconds,
      onUndo: () => {
        useBrandStore.setState({ brands: prevBrands });
      },
      action: async () => {
        try {
          const result = await setCurationMutation.mutateAsync({
            brandId,
            campaignId,
            isCurated,
          });
          onSuccess?.(result);
        } catch (error) {
          useBrandStore.setState({ brands: prevBrands });
          throw error;
        }
      },
    });
  };

  return {
    createCampaign: createCampaignMutation.mutateAsync,
    isCreatingCampaign: createCampaignMutation.isPending,
    createCampaignSync: createCampaignMutation.mutate,

    updateCampaign,
    isUpdatingCampaign: updateCampaignMutation.isPending,

    deleteCampaign,
    isDeletingCampaign: deleteCampaignMutation.isPending,

    setCampaignCuration,
    isSettingCuration: setCurationMutation.isPending,
  };
}
