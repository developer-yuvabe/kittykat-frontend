import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSubfolder as apiCreateSubfolder,
  updateSubfolder as apiUpdateSubfolder,
  deleteSubfolder as apiDeleteSubfolder,
} from "@/services/api/campaign.service";
import {
  SubFolderCreate,
  SubFolderUpdate,
  SubFolderResponse,
} from "@/types/campaign.types";
import { toast } from "sonner";
import { useBrandStore } from "@/store/brand.store";

interface CreateVariables {
  brandId: string;
  campaignId: string;
  payload: SubFolderCreate;
}

interface UpdateVariables {
  brandId: string;
  campaignId: string;
  subFolderId: string;
  payload: SubFolderUpdate;
}

interface DeleteVariables {
  brandId: string;
  campaignId: string;
  subFolderId: string;
}

export function useSubfolderMutations() {
  const queryClient = useQueryClient();

  // CREATE
  const createSubfolderMutation = useMutation({
    mutationFn: ({ brandId, campaignId, payload }: CreateVariables) =>
      apiCreateSubfolder(brandId, campaignId, payload),

    onMutate: async ({ payload }) => {
      // Show a loading toast but do not optimistically modify UI
      const toastId = toast.loading(`Creating folder "${payload.name}"...`);
      return { toastId };
    },

    onError: (error, variables, context: any) => {
      toast.error(`Failed to create folder "${variables.payload.name}"`, {
        id: context?.toastId,
      });
    },

    onSuccess: (data: SubFolderResponse, variables, context: any) => {
      // Add the created subfolder to the store (no optimistic behavior)
      useBrandStore.setState((state) => ({
        brands: state.brands.map((b) =>
          b.id === variables.brandId
            ? {
                ...b,
                campaigns: b.campaigns.map((c) =>
                  c.id === variables.campaignId
                    ? {
                        ...c,
                        sub_folders: [...(c.sub_folders || []), data],
                      }
                    : c
                ),
              }
            : b
        ),
      }));

      toast.success(`Folder "${data.name}" created`, { id: context?.toastId });

      // Invalidate related queries so other data sources refresh
      queryClient.invalidateQueries({ queryKey: ["campaigns"], exact: false });
      queryClient.invalidateQueries({
        queryKey: ["campaign-counts"],
        exact: false,
      });
    },
  });

  // UPDATE
  const updateSubfolderMutation = useMutation({
    mutationFn: ({
      brandId,
      campaignId,
      subFolderId,
      payload,
    }: UpdateVariables) =>
      apiUpdateSubfolder(brandId, campaignId, subFolderId, payload),

    onMutate: async ({ brandId, campaignId, subFolderId, payload }) => {
      const prevBrands = useBrandStore.getState().brands;

      useBrandStore.setState((state) => ({
        brands: state.brands.map((b) =>
          b.id === brandId
            ? {
                ...b,
                campaigns: b.campaigns.map((c) =>
                  c.id === campaignId
                    ? {
                        ...c,
                        sub_folders: (c.sub_folders || []).map((sf) =>
                          sf.id === subFolderId ? { ...sf, ...payload } : sf
                        ),
                      }
                    : c
                ),
              }
            : b
        ),
      }));

      const toastId = toast.loading(`Updating folder...`);
      return { prevBrands, toastId };
    },

    onError: (error, variables, context: any) => {
      if (context?.prevBrands) {
        useBrandStore.setState({ brands: context.prevBrands });
      }
      toast.error(`Failed to update folder`, { id: context?.toastId });
    },

    onSuccess: (data: SubFolderResponse, variables, context: any) => {
      // Ensure store matches server response
      useBrandStore.setState((state) => ({
        brands: state.brands.map((b) =>
          b.id === variables.brandId
            ? {
                ...b,
                campaigns: b.campaigns.map((c) =>
                  c.id === variables.campaignId
                    ? {
                        ...c,
                        sub_folders: (c.sub_folders || []).map((sf) =>
                          sf.id === data.id ? data : sf
                        ),
                      }
                    : c
                ),
              }
            : b
        ),
      }));

      toast.success(`Folder "${data.name}" updated`, { id: context?.toastId });
      queryClient.invalidateQueries({ queryKey: ["campaigns"], exact: false });
    },
  });

  // DELETE
  const deleteSubfolderMutation = useMutation({
    mutationFn: ({ brandId, campaignId, subFolderId }: DeleteVariables) =>
      apiDeleteSubfolder(brandId, campaignId, subFolderId),

    onMutate: async ({ brandId, campaignId, subFolderId }) => {
      const prevBrands = useBrandStore.getState().brands;

      useBrandStore.setState((state) => ({
        brands: state.brands.map((b) =>
          b.id === brandId
            ? {
                ...b,
                campaigns: b.campaigns.map((c) =>
                  c.id === campaignId
                    ? {
                        ...c,
                        sub_folders: (c.sub_folders || []).filter(
                          (sf) => sf.id !== subFolderId
                        ),
                      }
                    : c
                ),
              }
            : b
        ),
      }));

      const toastId = toast.loading(`Deleting folder...`);
      return { prevBrands, toastId };
    },

    onError: (error, variables, context: any) => {
      if (context?.prevBrands) {
        useBrandStore.setState({ brands: context.prevBrands });
      }
      toast.error(`Failed to delete folder`, { id: context?.toastId });
    },

    onSuccess: (_, variables, context: any) => {
      toast.success(`Folder deleted`, { id: context?.toastId });
      queryClient.invalidateQueries({ queryKey: ["campaigns"], exact: false });
      queryClient.invalidateQueries({
        queryKey: ["campaign-counts"],
        exact: false,
      });
    },
  });

  return {
    createSubfolder: createSubfolderMutation.mutateAsync,
    isCreatingSubfolder: createSubfolderMutation.isPending,

    updateSubfolder: updateSubfolderMutation.mutateAsync,
    isUpdatingSubfolder: updateSubfolderMutation.isPending,

    deleteSubfolder: deleteSubfolderMutation.mutateAsync,
    isDeletingSubfolder: deleteSubfolderMutation.isPending,
  };
}

export default useSubfolderMutations;
