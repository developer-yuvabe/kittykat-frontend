import { useSessionStorage } from "@/hooks/useSessionStorage";
import { Model } from "@/types/a2i-media.types";
import { create } from "zustand";

type Store = {
  models: Model[];
  setModels: (models: Model[]) => void;

  isModelsFetched: boolean;
  setIsModelsFetched: (isFetched: boolean) => void;

  selectedImageGenerationModel: Model | null;
  setSelectedImageGenerationModel: (model: Model) => void;

  selectedVideoGenearationModel: Model | null;
  setSelectedVideoGenearationModel: (model: Model) => void;

  selectedRemixModel: Model | null;
  setSelectedRemixModel: (model: Model) => void;

  selectedVtonModel: Model | null;
  setSelectedVtonModel: (model: Model) => void;
};

export const useModelsStore = create<Store>()((set) => {
  const { getSessionItem, setSessionItem, removeSessionItem } =
    useSessionStorage();

  return {
    models: [],
    setModels: (models) => {
      const selectedModelId = getSessionItem("a2i-image-generation-model-id");
      const selectedVideoGenearationModelId = getSessionItem(
        "a2i-video-generation-model-id"
      );
      const selectedRemixModelId = getSessionItem("a2i-remix-model-id");
      const selectedVtonModelId = getSessionItem("a2i-vton-model-id");

      const imageModels = models.filter((model) => model.type === "image");
      const selectedImageGenerationModel =
        imageModels.length > 0
          ? imageModels.find((model) => model.id === selectedModelId) ||
            imageModels[0]
          : null;

      const videoModels = models.filter((model) => model.type === "video");
      const selectedVideoGenearationModel =
        videoModels.length > 0
          ? videoModels.find(
              (model) => model.id === selectedVideoGenearationModelId
            ) || videoModels[0]
          : null;

      const remixModels = models.filter((model) => model.type === "remix");
      const selectedRemixModel =
        remixModels.length > 0
          ? remixModels.find((model) => model.id === selectedRemixModelId) ||
            remixModels[0]
          : null;

      const vtonModels = models.filter((model) => model.type === "vton");
      const selectedVtonModel =
        vtonModels.length > 0
          ? vtonModels.find((model) => model.id === selectedVtonModelId) ||
            vtonModels[0]
          : null;

      if (!selectedImageGenerationModel) {
        console.warn("No valid model found, defaulting to first model.");
        removeSessionItem("a2i-image-generation-model-id");
      }

      if (!selectedVideoGenearationModel) {
        console.warn(
          "No valid video generation model found, defaulting to first video model."
        );
        removeSessionItem("a2i-video-generation-model-id");
      }

      if (!selectedRemixModel) {
        console.warn(
          "No valid remix model found, defaulting to first remix model."
        );
        removeSessionItem("a2i-remix-model-id");
      }

      if (!selectedVtonModel) {
        console.warn(
          "No valid VTON model found, defaulting to first VTON model."
        );
        removeSessionItem("a2i-vton-model-id");
      }

      set({
        models: models,
        selectedImageGenerationModel: selectedImageGenerationModel,
        selectedVideoGenearationModel: selectedVideoGenearationModel,
        selectedRemixModel: selectedRemixModel,
        selectedVtonModel: selectedVtonModel,
      });
    },

    isModelsFetched: false,
    setIsModelsFetched: (isFetched) => set({ isModelsFetched: isFetched }),

    selectedImageGenerationModel:
      getSessionItem("a2i-image-generation-model-id") || null,
    setSelectedImageGenerationModel: (model) => {
      // Save to session storage
      setSessionItem("a2i-image-generation-model-id", model.id);

      set({ selectedImageGenerationModel: model });
    },

    selectedVideoGenearationModel:
      getSessionItem("a2i-video-generation-model-id") || null,
    setSelectedVideoGenearationModel: (model) => {
      // Save to session storage
      setSessionItem("a2i-video-generation-model-id", model.id);

      set({ selectedVideoGenearationModel: model });
    },

    selectedRemixModel: getSessionItem("a2i-remix-model-id") || null,
    setSelectedRemixModel: (model) => {
      // Save to session storage
      setSessionItem("a2i-remix-model-id", model.id);

      set({ selectedRemixModel: model });
    },

    selectedVtonModel: getSessionItem("a2i-vton-model-id") || null,
    setSelectedVtonModel: (model) => {
      // Save to session storage
      setSessionItem("a2i-vton-model-id", model.id);

      set({ selectedVtonModel: model });
    },
  };
});
