import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  createPreset,
  getPreset,
  listPresets,
  updatePreset,
  patchPreset,
  deletePreset,
  getPresetsForBrand,
  generatePromptsFromPreset,
} from "@/services/api/preset.service";
import type {
  PresetUpdateRequest,
  PresetPatchRequest,
} from "@/types/preset.types";

interface UsePresetsOptions {
  presetId?: string;
  brandId?: string;
  skip?: number;
  limit?: number;
  enabled?: boolean;
}

// Query keys
export function getPresetQueryKey(presetId?: string) {
  return ["preset", presetId];
}

export function getPresetsListQueryKey(skip?: number, limit?: number) {
  return ["presets", "list", skip, limit];
}

export function getPresetsForBrandQueryKey(
  brandId?: string,
  skip?: number,
  limit?: number
) {
  return ["presets", "brand", brandId, skip, limit];
}

export function usePresets({
  presetId,
  brandId,
  skip = 0,
  limit = 10,
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
    queryKey: getPresetsListQueryKey(skip, limit),
    queryFn: () => listPresets(skip, limit),
    enabled,
  });

  // Query for presets for brand
  const presetsForBrandQuery = useQuery({
    queryKey: getPresetsForBrandQueryKey(brandId, skip, limit),
    queryFn: () => getPresetsForBrand(brandId!, skip, limit),
    enabled: enabled && !!brandId,
  });

  // Mutations
  const createPresetMutation = useMutation({
    mutationFn: createPreset,
    onSuccess: () => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: ["presets"] });
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
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: ["presets"] });
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
      queryClient.setQueryData(getPresetQueryKey(variables.presetId), data);
      queryClient.invalidateQueries({ queryKey: ["presets"] });
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: deletePreset,
    onSuccess: (_, presetId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: getPresetQueryKey(presetId) });
      queryClient.invalidateQueries({ queryKey: ["presets"] });
    },
  });

  const generatePromptsMutation = useMutation({
    mutationFn: generatePromptsFromPreset,
    // No cache updates since it's background task
  });

  return {
    // Queries
    presetQuery,
    presetsListQuery,
    presetsForBrandQuery,
    // Mutations
    createPresetMutation,
    updatePresetMutation,
    patchPresetMutation,
    deletePresetMutation,
    generatePromptsMutation,
  };
}
