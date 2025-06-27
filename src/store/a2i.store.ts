import { useSessionStorage } from "@/hooks/useSessionStorage";
import { IMAGE_GENERATION_MODELS } from "@/lib/a2i.utils";
import { create } from "zustand";

type AnyModel = (typeof IMAGE_GENERATION_MODELS)[number];

type Store = {
  selectedModel: AnyModel;
  setSelectedModel: (model: AnyModel) => void;
};

export const useA2iStore = create<Store>()((set) => {
  const { getSessionItem, setSessionItem } = useSessionStorage();

  const initialModel =
    IMAGE_GENERATION_MODELS.find(
      (m) => m.id === getSessionItem("a2i-image-generation-model-id")
    ) || IMAGE_GENERATION_MODELS[0];

  return {
    selectedModel: initialModel,
    setSelectedModel: (model) => {
      // Save to session storage
      setSessionItem("a2i-image-generation-model-id", model.id);

      set({ selectedModel: model });
    },
  };
});
