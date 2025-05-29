// hooks/useParameterManagement.ts
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { debounce } from "lodash";
import { ModelDefinition } from "@/types/a2i.types";
import { BaseApiResponse, ThreadA2iImage } from "@/types/types";
import { updateA2iImageParameters } from "@/services/api/brand.service";

interface UseParameterManagementProps {
  models: ModelDefinition[];
  initialModelId?: string;
  brandId: string;
  a2iInformation?: {
    parameters?: {
      input_data?: Record<string, any>;
    };
  };
}

export interface A2iImageUpdateRequest {
  brand_id: string;
  reference_campaign_id?: string;
  reference_moodboard_id?: string;
  parameters?: {
    model: string;
    input_data: Record<string, any>;
  };
}

export const updateReferenceCampaignId = async (
  brandId: string,
  referenceCampaignId: string
): Promise<BaseApiResponse<ThreadA2iImage>> => {
  return updateA2iImageParameters({
    brand_id: brandId,
    reference_campaign_id: referenceCampaignId,
  });
};

export const updateOnlyA2iParameters = async (
  brandId: string,
  model: string,
  inputData: Record<string, any>
): Promise<BaseApiResponse<ThreadA2iImage>> => {
  return updateA2iImageParameters({
    brand_id: brandId,
    parameters: {
      model,
      input_data: inputData,
    },
  });
};

export const updateReferenceMoodboardId = async (
  brandId: string,
  referenceMoodboardId: string
): Promise<BaseApiResponse<ThreadA2iImage>> => {
  return updateA2iImageParameters({
    brand_id: brandId,
    reference_moodboard_id: referenceMoodboardId,
  });
};

export const useParameterManagement = ({
  models,
  initialModelId,
  brandId,
  a2iInformation,
}: UseParameterManagementProps) => {
  // Memoize initial model ID to prevent unnecessary recalculations
  const resolvedInitialModelId = useMemo(
    () => initialModelId || models[0]?.id,
    [initialModelId, models]
  );

  const [selectedModelId, setSelectedModelId] = useState<string>(
    resolvedInitialModelId
  );
  const [params, setParams] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use refs to track state and prevent stale closures
  const currentModelRef = useRef(selectedModelId);
  const currentParamsRef = useRef(params);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update refs when state changes
  useEffect(() => {
    currentModelRef.current = selectedModelId;
  }, [selectedModelId]);

  useEffect(() => {
    currentParamsRef.current = params;
  }, [params]);

  // Memoize selected model to prevent unnecessary lookups
  const selectedModel = useMemo(
    () => models.find((m) => m.id === selectedModelId),
    [models, selectedModelId]
  );

  // Memoize default parameters calculation
  const getDefaultParameters = useCallback(
    (model: ModelDefinition): Record<string, any> => {
      const defaultParams: Record<string, any> = {};

      if (!model?.schema?.properties) return defaultParams;

      Object.entries(model.schema.properties).forEach(([key, param]) => {
        if (param && "default" in param && param.default !== undefined) {
          defaultParams[key] = param.default;
        }
      });

      return defaultParams;
    },
    []
  );

  // Memoize parameter loading logic
  const loadParameters = useCallback(
    (modelId: string): Record<string, any> => {
      const model = models.find((m) => m.id === modelId);
      if (!model) return {};

      const defaultParams = getDefaultParameters(model);

      // Merge with existing a2i data only for initial model
      if (
        modelId === resolvedInitialModelId &&
        a2iInformation?.parameters?.input_data
      ) {
        return {
          ...defaultParams,
          ...a2iInformation.parameters.input_data,
        };
      }

      return defaultParams;
    },
    [models, resolvedInitialModelId, a2iInformation, getDefaultParameters]
  );

  // Enhanced error handling and request cancellation
  const saveParameters = useCallback(
    async (modelId: string, parameters: Record<string, any>) => {
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        await updateOnlyA2iParameters(brandId, modelId, parameters);

        // Only update if this is still the current request
        if (!abortControllerRef.current.signal.aborted) {
          setLastSaved(new Date());
        }
      } catch (err) {
        if (!abortControllerRef.current.signal.aborted) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to save parameters";
          setError(errorMessage);
          console.error("Failed to save parameters:", err);
        }
      } finally {
        if (!abortControllerRef.current.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [brandId]
  );

  // Optimized debounced save with cleanup
  const debouncedSave = useMemo(
    () => debounce(saveParameters, 1000),
    [saveParameters]
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSave]);

  // Optimized parameter update with validation
  const updateParam = useCallback(
    (key: string, value: any) => {
      // Validate that the parameter exists in the current model schema
      if (
        selectedModel?.schema?.properties &&
        !(key in selectedModel.schema.properties)
      ) {
        console.warn(`Parameter '${key}' not found in model schema`);
        return;
      }

      setParams((prevParams) => {
        const newParams = { ...prevParams, [key]: value };

        // Only trigger save if value actually changed
        if (prevParams[key] !== value) {
          debouncedSave(currentModelRef.current, newParams);
        }

        return newParams;
      });
    },
    [selectedModel, debouncedSave]
  );

  // Batch parameter updates
  const updateParams = useCallback(
    (updates: Record<string, any>) => {
      setParams((prevParams) => {
        const newParams = { ...prevParams, ...updates };
        debouncedSave(currentModelRef.current, newParams);
        return newParams;
      });
    },
    [debouncedSave]
  );

  // Reset parameters to defaults
  const resetToDefaults = useCallback(() => {
    if (!selectedModel) return;

    const defaultParams = getDefaultParameters(selectedModel);
    setParams(defaultParams);
    debouncedSave(selectedModelId, defaultParams);
  }, [selectedModel, getDefaultParameters, selectedModelId, debouncedSave]);

  // Optimized model change handler
  const handleModelChange = useCallback(
    (newModelId: string) => {
      // Cancel any pending saves
      debouncedSave.cancel();

      setSelectedModelId(newModelId);
    },
    [debouncedSave]
  );

  // Load parameters when model changes with better error handling
  useEffect(() => {
    if (!selectedModel) return;

    const loadAndSyncParams = async () => {
      const loadedParams = loadParameters(selectedModelId);
      setParams(loadedParams);

      // Only sync to server if parameters actually changed or it's a new model
      const paramsChanged =
        JSON.stringify(loadedParams) !==
        JSON.stringify(currentParamsRef.current);

      if (paramsChanged) {
        setIsLoading(true);
        setError(null);

        try {
          await updateOnlyA2iParameters(brandId, selectedModelId, loadedParams);
          setLastSaved(new Date());
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to sync parameters";
          setError(errorMessage);
          console.error("Failed to sync parameters on model change:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadAndSyncParams();
  }, [selectedModel, selectedModelId, loadParameters, brandId]);

  // Validation helper
  const validateParameter = useCallback(
    (key: string, value: any): boolean => {
      if (!selectedModel?.schema?.properties?.[key]) return false;

      const paramSchema = selectedModel.schema.properties[key];

      // Add basic type validation
      if ("type" in paramSchema) {
        const expectedType = paramSchema.type;
        const actualType = typeof value;

        if (expectedType === "number" && actualType !== "number") return false;
        if (expectedType === "string" && actualType !== "string") return false;
        if (expectedType === "boolean" && actualType !== "boolean")
          return false;
      }

      return true;
    },
    [selectedModel]
  );

  return {
    // State
    selectedModelId,
    selectedModel,
    params,
    isLoading,
    lastSaved,
    error,

    // Actions
    setSelectedModelId: handleModelChange,
    updateParam,
    updateParams,
    resetToDefaults,

    // Utilities
    validateParameter,

    // Status
    hasUnsavedChanges: isLoading || Boolean(error),
  };
};
