import { useSessionStorage } from "@/hooks/useSessionStorage";
import { Model } from "@/types/a2i-media.types";
import { create } from "zustand";
import { getUserModels } from "@/services/api/models.service";

type Store = {
  // All models (admin use - your existing logic)
  models: Model[];
  setModels: (models: Model[]) => void;
  isModelsFetched: boolean;
  setIsModelsFetched: (isFetched: boolean) => void;

  // User-specific models (NEW)
  userModels: Model[];
  setUserModels: (models: Model[]) => void;
  isUserModelsFetched: boolean;
  setIsUserModelsFetched: (isFetched: boolean) => void;
  userModelsLoading: boolean;
  setUserModelsLoading: (loading: boolean) => void;
  userModelsError: string | null;
  setUserModelsError: (error: string | null) => void;

  // Fetch user models method
  fetchUserModels: (userId: string, typeFilter?: string) => Promise<void>;
  getUserModelsByType: (type?: string) => Model[];

  // Your existing selected models
  selectedImageGenerationModel: Model | null;
  setSelectedImageGenerationModel: (model: Model | null) => void;
  selectedVideoGenearationModel: Model | null;
  setSelectedVideoGenearationModel: (model: Model | null) => void;
  selectedRemixModel: Model | null;
  setSelectedRemixModel: (model: Model | null) => void;
  selectedVtonModel: Model | null;
  setSelectedVtonModel: (model: Model | null) => void;
  selectedUpscaleModel: Model | null;
  setSelectedUpscaleModel: (model: Model | null) => void;
};

export const useModelsStore = create<Store>()((set, get) => {
  const { getSessionItem, setSessionItem, removeSessionItem } =
    useSessionStorage();

  return {
    // Your existing models logic (unchanged)
    models: [],
    setModels: (models) => {
      const selectedModelId = getSessionItem("a2i-image-generation-model-id");
      const selectedVideoGenearationModelId = getSessionItem(
        "a2i-video-generation-model-id"
      );
      const selectedRemixModelId = getSessionItem("a2i-remix-model-id");
      const selectedVtonModelId = getSessionItem("a2i-vton-model-id");
      const selectedUpscaleModelId = getSessionItem("a2i-upscale-model-id");

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

      const upscaleModels = models.filter(
        (model) => model.type === "image-upscale"
      );
      const selectedUpscaleModel =
        upscaleModels.length > 0
          ? upscaleModels.find(
              (model) => model.id === selectedUpscaleModelId
            ) || upscaleModels[0]
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

      if (!selectedUpscaleModel) {
        console.warn(
          "No valid Upscale model found, defaulting to first Upscale model."
        );
        removeSessionItem("a2i-upscale-model-id");
      }

      set({
        models: models,
        selectedImageGenerationModel: selectedImageGenerationModel,
        selectedVideoGenearationModel: selectedVideoGenearationModel,
        selectedRemixModel: selectedRemixModel,
        selectedVtonModel: selectedVtonModel,
        selectedUpscaleModel: selectedUpscaleModel,
      });
    },

    isModelsFetched: false,
    setIsModelsFetched: (isFetched) => set({ isModelsFetched: isFetched }),

    // NEW: User-specific models state
    userModels: [],
    setUserModels: (userModels) => {
      // Apply the same selection logic to user models
      const selectedModelId = getSessionItem("a2i-image-generation-model-id");
      const selectedVideoGenearationModelId = getSessionItem(
        "a2i-video-generation-model-id"
      );
      const selectedRemixModelId = getSessionItem("a2i-remix-model-id");
      const selectedVtonModelId = getSessionItem("a2i-vton-model-id");
      const selectedUpscaleModelId = getSessionItem("a2i-upscale-model-id");

      const imageModels = userModels.filter((model) => model.type === "image");
      const selectedImageGenerationModel =
        imageModels.length > 0
          ? imageModels.find((model) => model.id === selectedModelId) ||
            imageModels[0]
          : null;

      const videoModels = userModels.filter((model) => model.type === "video");
      const selectedVideoGenearationModel =
        videoModels.length > 0
          ? videoModels.find(
              (model) => model.id === selectedVideoGenearationModelId
            ) || videoModels[0]
          : null;

      const remixModels = userModels.filter((model) => model.type === "remix");
      const selectedRemixModel =
        remixModels.length > 0
          ? remixModels.find((model) => model.id === selectedRemixModelId) ||
            remixModels[0]
          : null;

      const vtonModels = userModels.filter((model) => model.type === "vton");
      const selectedVtonModel =
        vtonModels.length > 0
          ? vtonModels.find((model) => model.id === selectedVtonModelId) ||
            vtonModels[0]
          : null;

      const upscaleModels = userModels.filter(
        (model) => model.type === "image-upscale"
      );
      const selectedUpscaleModel =
        upscaleModels.length > 0
          ? upscaleModels.find(
              (model) => model.id === selectedUpscaleModelId
            ) || upscaleModels[0]
          : null;

      // FIXED: Clear session storage if no models are available for that type
      if (imageModels.length === 0) {
        removeSessionItem("a2i-image-generation-model-id");
      }
      if (videoModels.length === 0) {
        removeSessionItem("a2i-video-generation-model-id");
      }
      if (remixModels.length === 0) {
        removeSessionItem("a2i-remix-model-id");
      }
      if (vtonModels.length === 0) {
        removeSessionItem("a2i-vton-model-id");
      }
      if (upscaleModels.length === 0) {
        removeSessionItem("a2i-upscale-model-id");
      }

      set({
        userModels: userModels,
        selectedImageGenerationModel: selectedImageGenerationModel,
        selectedVideoGenearationModel: selectedVideoGenearationModel,
        selectedRemixModel: selectedRemixModel,
        selectedVtonModel: selectedVtonModel,
        selectedUpscaleModel: selectedUpscaleModel,
      });
    },

    isUserModelsFetched: false,
    setIsUserModelsFetched: (isFetched) =>
      set({ isUserModelsFetched: isFetched }),
    userModelsLoading: false,
    setUserModelsLoading: (loading) => set({ userModelsLoading: loading }),
    userModelsError: null,
    setUserModelsError: (error) => set({ userModelsError: error }),

    // Fetch user models
    fetchUserModels: async (userId: string, typeFilter?: string) => {
      const {
        setUserModelsLoading,
        setUserModelsError,
        setUserModels,
        setIsUserModelsFetched,
      } = get();

      try {
        setUserModelsLoading(true);
        setUserModelsError(null);

        const models = await getUserModels(userId, typeFilter);
        setUserModels(models);
        setIsUserModelsFetched(true);
      } catch (error) {
        console.error("Error fetching user models:", error);
        setUserModelsError("Failed to load models. Please try again.");
      } finally {
        setUserModelsLoading(false);
      }
    },

    // Get user models filtered by type
    getUserModelsByType: (type?: string) => {
      const { userModels } = get();
      if (!type) return userModels;
      return userModels.filter((model) => model.type === type);
    },

    // Initialize selected models as null - let setUserModels handle the selection
    selectedImageGenerationModel: null,
    setSelectedImageGenerationModel: (model) => {
      if (model) {
        setSessionItem("a2i-image-generation-model-id", model.id);
        set({ selectedImageGenerationModel: model });
      } else {
        removeSessionItem("a2i-image-generation-model-id");
        set({ selectedImageGenerationModel: null });
      }
    },

    selectedVideoGenearationModel: null,
    setSelectedVideoGenearationModel: (model) => {
      if (model) {
        setSessionItem("a2i-video-generation-model-id", model.id);
        set({ selectedVideoGenearationModel: model });
      } else {
        removeSessionItem("a2i-video-generation-model-id");
        set({ selectedVideoGenearationModel: null });
      }
    },

    selectedRemixModel: null,
    setSelectedRemixModel: (model) => {
      if (model) {
        setSessionItem("a2i-remix-model-id", model.id);
        set({ selectedRemixModel: model });
      } else {
        removeSessionItem("a2i-remix-model-id");
        set({ selectedRemixModel: null });
      }
    },

    selectedVtonModel: null,
    setSelectedVtonModel: (model) => {
      if (model) {
        setSessionItem("a2i-vton-model-id", model.id);
        set({ selectedVtonModel: model });
      } else {
        removeSessionItem("a2i-vton-model-id");
        set({ selectedVtonModel: null });
      }
    },

    selectedUpscaleModel: null,
    setSelectedUpscaleModel: (model) => {
      if (model) {
        setSessionItem("a2i-upscale-model-id", model.id);
        set({ selectedUpscaleModel: model });
      } else {
        removeSessionItem("a2i-upscale-model-id");
        set({ selectedUpscaleModel: null });
      }
    },
  };
});
