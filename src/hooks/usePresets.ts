import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  createPreset,
  getPreset,
  listPresets,
  updatePreset,
  patchPreset,
  deletePreset,
  clonePreset,
  getPresetsForBrand,
  generatePromptsFromPreset,
  getMasterPreset,
  adjustPrompt,
} from "@/services/api/preset.service";
import type {
  PresetUpdateRequest,
  PresetPatchRequest,
  PresetsFilterRequest,
} from "@/types/preset.types";

interface UsePresetsOptions {
  presetId?: string;
  brandId?: string;
  skip?: number;
  limit?: number;
  filter?: PresetsFilterRequest;
  enabled?: boolean;
}

// Query keys
export function getPresetQueryKey(presetId?: string) {
  return ["preset", presetId];
}

export function getPresetsListQueryKey(
  skip?: number,
  limit?: number,
  filter?: PresetsFilterRequest
) {
  return ["presets", "list", skip, limit, filter];
}

export function getPresetsForBrandQueryKey(
  brandId?: string,
  skip?: number,
  limit?: number,
  filter?: PresetsFilterRequest
) {
  return ["presets", "brand", brandId, skip, limit, filter];
}

export function getMasterPresetQueryKey() {
  return ["presets", "master"];
}

export function usePresets({
  presetId,
  brandId,
  skip = 0,
  limit = 10,
  filter,
  enabled = true,
}: UsePresetsOptions = {}) {
  const queryClient = useQueryClient();

  // Query for single preset
  const presetQuery = useQuery({
    queryKey: getPresetQueryKey(presetId),
    queryFn: () => getPreset(presetId!),
    enabled: enabled && !!presetId,
  });

  // Query for list of presets
  const presetsListQuery = useQuery({
    queryKey: getPresetsListQueryKey(skip, limit, filter),
    queryFn: () =>
      listPresets({
        skip,
        limit,
        ...(filter || {}),
      }),
    enabled,
  });

  // Query for presets for brand
  const presetsForBrandQuery = useQuery({
    queryKey: getPresetsForBrandQueryKey(brandId, skip, limit, filter),
    queryFn: () => getPresetsForBrand(brandId!, skip, limit),
    enabled: enabled && !!brandId,
  });

  // Query for master preset
  const masterPresetQuery = useQuery({
    queryKey: getMasterPresetQueryKey(),
    queryFn: getMasterPreset,
    enabled,
  });

  // Mutations
  const createPresetMutation = useMutation({
    mutationFn: createPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"], exact: false });
    },
  });

  const updatePresetMutation = useMutation({
    mutationFn: ({
      presetId,
      payload,
    }: {
      presetId: string;
      payload: PresetUpdateRequest;
    }) => updatePreset(presetId, payload),
    onSuccess: (data, variables) => {
      // Update the single preset cache
      queryClient.setQueryData(getPresetQueryKey(variables.presetId), data);

      queryClient.invalidateQueries({ queryKey: ["presets"], exact: false });
    },
  });

  const patchPresetMutation = useMutation({
    mutationFn: ({
      presetId,
      payload,
    }: {
      presetId: string;
      payload: PresetPatchRequest;
    }) => patchPreset(presetId, payload),
    onSuccess: (data, variables) => {
      // Invalidate the single preset query to refetch updated data
      queryClient.invalidateQueries({
        queryKey: getPresetQueryKey(variables.presetId),
      });

      queryClient.invalidateQueries({ queryKey: ["presets"], exact: false });
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: deletePreset,
    onSuccess: (_, presetId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: getPresetQueryKey(presetId) });
      queryClient.invalidateQueries({ queryKey: ["presets"], exact: false });
    },
  });

  const clonePresetMutation = useMutation({
    mutationFn: clonePreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"], exact: false });
    },
  });

  const generatePromptsMutation = useMutation({
    mutationFn: generatePromptsFromPreset,
    // No cache updates since it's background task
  });

  const adjustPromptMutation = useMutation({
    mutationFn: adjustPrompt,
    // This is a temporary plaintext response - no cache updates
  });

  return {
    // Queries
    presetQuery,
    presetsListQuery,
    presetsForBrandQuery,
    masterPresetQuery,
    // Mutations
    createPresetMutation,
    updatePresetMutation,
    patchPresetMutation,
    deletePresetMutation,
    clonePresetMutation,
    generatePromptsMutation,
    adjustPromptMutation,
  };
}
