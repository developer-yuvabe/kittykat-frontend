import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSubfolder as apiCreateSubfolder,
  updateSubfolder as apiUpdateSubfolder,
  deleteSubfolder as apiDeleteSubfolder,
  duplicateSubfolder as apiDuplicateSubfolder,
  type DuplicateSubFolderResponse,
} from "@/services/api/campaign.service";
import {
  SubFolderCreate,
  SubFolderUpdate,
  SubFolderResponse,
} from "@/types/campaign.types";
import { toast } from "sonner";
import { useBrandStore } from "@/store/brand.store";
import { useUndoableAction } from "@/hooks/useUndoableAction";

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

interface UpdateSubfolderOptions extends UpdateVariables {
  title?: string;
  undoSeconds?: number;
  onSuccess?: (data: SubFolderResponse) => void;
}

interface DeleteVariables {
  brandId: string;
  campaignId: string;
  subFolderId: string;
}

interface DuplicateSubfolderData {
  brandId: string;
  campaignId: string;
  subFolderId: string;
}

interface DuplicateSubfolderOptions extends DuplicateSubfolderData {
  title: string;
  undoSeconds?: number;
  onSuccess?: (data: DuplicateSubFolderResponse) => void;
}

export function useSubfolderMutations() {
  const queryClient = useQueryClient();
  const { execute } = useUndoableAction();

  // CREATE
  const createSubfolderMutation = useMutation({
    mutationFn: ({ brandId, campaignId, payload }: CreateVariables) =>
      apiCreateSubfolder(brandId, campaignId, payload),

    onMutate: async ({ payload }) => {
      const toastId = toast.loading(`Creating folder "${payload.name}"...`);
      return { toastId };
    },

    onError: (error, variables, context: any) => {
      toast.error(`Failed to create folder "${variables.payload.name}"`, {
        id: context?.toastId,
      });
    },

    onSuccess: (data: SubFolderResponse, variables, context: any) => {
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

      queryClient.invalidateQueries({ queryKey: ["campaigns"], exact: false });
      queryClient.invalidateQueries({
        queryKey: ["campaign-counts"],
        exact: false,
      });
    },
  });

  const updateSubfolderMutation = useMutation({
    mutationFn: ({
      brandId,
      campaignId,
      subFolderId,
      payload,
    }: UpdateVariables) =>
      apiUpdateSubfolder(brandId, campaignId, subFolderId, payload),

    onSuccess: (data: SubFolderResponse, variables) => {
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

      queryClient.invalidateQueries({ queryKey: ["campaigns"], exact: false });
      queryClient.invalidateQueries({
        queryKey: ["campaign-counts"],
        exact: false,
      });
    },
  });

  // UPDATE WRAPPER with optimistic updates and undo
  const updateSubfolder = async ({
    brandId,
    campaignId,
    subFolderId,
    payload,
    title,
    undoSeconds = 3,
    onSuccess,
  }: UpdateSubfolderOptions) => {
    const prevBrands = useBrandStore.getState().brands;
    const displayTitle = title || payload.name || "Folder";

    // Optimistic update in the store
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
          const result = await updateSubfolderMutation.mutateAsync({
            brandId,
            campaignId,
            subFolderId,
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

  // DUPLICATE MUTATION (internal use only)
  const duplicateSubfolderMutation = useMutation({
    mutationFn: ({
      brandId,
      campaignId,
      subFolderId,
    }: DuplicateSubfolderData) =>
      apiDuplicateSubfolder(brandId, campaignId, subFolderId),

    onSuccess: () => {
      // Invalidate queries to refetch fresh data from server
      queryClient.invalidateQueries({ queryKey: ["brands"], exact: false });
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

  // DUPLICATE WRAPPER with undo support
  const duplicateSubfolder = async ({
    brandId,
    campaignId,
    subFolderId,
    title,
    undoSeconds = 3,
    onSuccess,
  }: DuplicateSubfolderOptions) => {
    await execute({
      title,
      loadingMessage: `Duplicating "${title}"...`,
      successMessage: `"${title}" duplicated successfully.`,
      errorMessage: `Failed to duplicate "${title}".`,
      undoSeconds,
      action: async () => {
        const result = await duplicateSubfolderMutation.mutateAsync({
          brandId,
          campaignId,
          subFolderId,
        });
        onSuccess?.(result);
      },
    });
  };

  return {
    createSubfolder: createSubfolderMutation.mutateAsync,
    isCreatingSubfolder: createSubfolderMutation.isPending,

    updateSubfolder,
    isUpdatingSubfolder: updateSubfolderMutation.isPending,

    deleteSubfolder: deleteSubfolderMutation.mutateAsync,
    isDeletingSubfolder: deleteSubfolderMutation.isPending,

    duplicateSubfolder,
    isDuplicatingSubfolder: duplicateSubfolderMutation.isPending,
  };
}

export default useSubfolderMutations;
