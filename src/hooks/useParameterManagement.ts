// hooks/useParameterManagement.ts
import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";
import { ModelDefinition } from "@/types/a2i.types";

interface UseParameterManagementProps {
  models: ModelDefinition[];
  initialModelId?: string;
}

export const useParameterManagement = ({
  models,
  initialModelId,
}: UseParameterManagementProps) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(
    initialModelId || models[0].id
  );
  const [params, setParams] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const selectedModel = models.find((m) => m.id === selectedModelId)!;

  // Mock API functions - replace with actual API calls
  const mockAPI = {
    async saveParameters(
      modelId: string,
      params: Record<string, any>
    ): Promise<void> {
      await new Promise((resolve) => setTimeout(resolve, 200));
      console.log(`Parameters saved for ${modelId}:`, params);
    },

    async loadParameters(modelId: string): Promise<Record<string, any>> {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const model = models.find((m) => m.id === modelId);
      if (!model) return {};

      const defaultParams: Record<string, any> = {};
      Object.entries(model.schema.properties).forEach(([key, param]) => {
        if ("default" in param && param.default !== undefined) {
          defaultParams[key] = param.default;
        }
      });
      return defaultParams;
    },
  };

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (modelId: string, parameters: Record<string, any>) => {
      setIsLoading(true);
      try {
        await mockAPI.saveParameters(modelId, parameters);
        setLastSaved(new Date());
      } catch (error) {
        console.error("Failed to save parameters:", error);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  // Update parameter and trigger save
  const updateParam = useCallback(
    (key: string, value: any) => {
      const newParams = { ...params, [key]: value };
      setParams(newParams);
      debouncedSave(selectedModelId, newParams);
    },
    [params, selectedModelId, debouncedSave]
  );

  // Load parameters when model changes
  useEffect(() => {
    const loadParams = async () => {
      try {
        const loadedParams = await mockAPI.loadParameters(selectedModelId);
        setParams(loadedParams);
      } catch (error) {
        console.error("Failed to load parameters:", error);
      }
    };
    loadParams();
  }, [selectedModelId]);

  return {
    selectedModelId,
    setSelectedModelId,
    selectedModel,
    params,
    updateParam,
    isLoading,
    lastSaved,
  };
};
