// src/services/api/preset.service.ts
import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";

import type {
  PresetCreateRequest,
  PresetUpdateRequest,
  PresetPatchRequest,
  PresetResponse,
  PresetDetailResponse,
  PresetListResponse,
  PromptGenerationRequest,
  AdjustPromptRequest,
  PresetsFilterRequest,
} from "@/types/preset.types";

export async function createPreset(
  payload: PresetCreateRequest
): Promise<PresetResponse> {
  return handleApiRequest<PresetResponse>(
    axiosInstance.post("/presets", payload)
  );
}

export async function getPreset(
  presetId: string
): Promise<PresetDetailResponse> {
  return handleApiRequest<PresetDetailResponse>(
    axiosInstance.get(`/presets/${presetId}`)
  );
}

export async function listPresets(
  filter: PresetsFilterRequest = { skip: 0, limit: 10 }
): Promise<PresetListResponse> {
  // The backend now expects a POST body filter for richer queries.
  return handleApiRequest<PresetListResponse>(
    axiosInstance.post("/presets/filter", filter)
  );
}

export async function updatePreset(
  presetId: string,
  payload: PresetUpdateRequest
): Promise<PresetResponse> {
  return handleApiRequest<PresetResponse>(
    axiosInstance.put(`/presets/${presetId}`, payload)
  );
}

export async function patchPreset(
  presetId: string,
  payload: PresetPatchRequest
): Promise<PresetResponse> {
  return handleApiRequest<PresetResponse>(
    axiosInstance.patch(`/presets/${presetId}`, payload)
  );
}

export async function deletePreset(presetId: string): Promise<void> {
  return handleApiRequest<void>(axiosInstance.delete(`/presets/${presetId}`));
}

export async function clonePreset(presetId: string): Promise<PresetResponse> {
  return handleApiRequest<PresetResponse>(
    axiosInstance.post(`/presets/${presetId}/clone`)
  );
}

export async function getPresetsForBrand(
  brandId: string,
  skip: number = 0,
  limit: number = 10
): Promise<PresetListResponse> {
  return handleApiRequest<PresetListResponse>(
    axiosInstance.get(`/brands/${brandId}/presets`, { params: { skip, limit } })
  );
}

export async function generatePromptsFromPreset(
  payload: PromptGenerationRequest
): Promise<PresetResponse> {
  return handleApiRequest<PresetResponse>(
    axiosInstance.post("/presets/generate-prompts", payload)
  );
}

export async function getMasterPreset(): Promise<PresetDetailResponse> {
  return handleApiRequest<PresetDetailResponse>(
    axiosInstance.get(`/presets/master`)
  );
}

export async function adjustPrompt(
  payload: AdjustPromptRequest
): Promise<string> {
  // API returns a string with the modified prompt
  return handleApiRequest<string>(
    axiosInstance.post("/presets/adjust-prompt", payload)
  );
}
