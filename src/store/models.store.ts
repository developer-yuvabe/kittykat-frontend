import { useSessionStorage } from "@/hooks/useSessionStorage";
import { Model } from "@/types/a2i-media.types";
import { create } from "zustand";

type Store = {
  models: Model[];
  setModels: (models: Model[]) => void;

  isModelsFetched: boolean;
  setIsModelsFetched: (isFetched: boolean) => void;

  selectedModel: Model | null;
  setSelectedModel: (model: Model) => void;
};

export const useModelsStore = create<Store>()((set) => {
  const { getSessionItem, setSessionItem, removeSessionItem } =
    useSessionStorage();

  return {
    models: [],
    setModels: (models) => {
      const selectedModelId = getSessionItem("a2i-image-generation-model-id");
      const selectedModel =
        models.length > 0
          ? models.find((model) => model.id === selectedModelId) || models[0]
          : null;

      if (!selectedModel) {
        console.warn("No valid model found, defaulting to first model.");
        removeSessionItem("a2i-image-generation-model-id");
      }

      set({
        models: models,
        selectedModel: selectedModel,
      });
    },

    isModelsFetched: false,
    setIsModelsFetched: (isFetched) => set({ isModelsFetched: isFetched }),

    selectedModel: getSessionItem("a2i-image-generation-model-id") || null,
    setSelectedModel: (model) => {
      // Save to session storage
      setSessionItem("a2i-image-generation-model-id", model.id);

      set({ selectedModel: model });
    },
  };
});
