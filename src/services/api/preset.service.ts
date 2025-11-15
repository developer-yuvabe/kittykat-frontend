// src/services/api/preset.service.ts
import axiosInstance from "@/config/axios/api-client.config";
import { handleApiRequest } from "@/lib/utils";

import type {
  PresetCreateRequest,
  PresetUpdateRequest,
  PresetPatchRequest,
  PresetResponse,
  PresetListResponse,
  PromptGenerationRequest,
} from "@/types/preset.types";

export async function createPreset(
  payload: PresetCreateRequest
): Promise<PresetResponse> {
  return handleApiRequest<PresetResponse>(
    axiosInstance.post("/presets", payload)
  );
}

export async function getPreset(presetId: string): Promise<PresetResponse> {
  return handleApiRequest<PresetResponse>(
    axiosInstance.get(`/presets/${presetId}`)
  );
}

export async function listPresets(
  skip: number = 0,
  limit: number = 10
): Promise<PresetListResponse> {
  return handleApiRequest<PresetListResponse>(
    axiosInstance.get("/presets", { params: { skip, limit } })
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
