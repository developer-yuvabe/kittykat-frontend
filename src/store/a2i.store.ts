import { IMAGE_GENERATION_MODELS } from "@/lib/a2i.utils";
import { create } from "zustand";

type AnyModel = (typeof IMAGE_GENERATION_MODELS)[number];

type Store = {
  selectedModel: AnyModel;
  setSelectedModel: (model: AnyModel) => void;
};

export const useA2iStore = create<Store>()((set) => ({
  selectedModel: IMAGE_GENERATION_MODELS[0],
  setSelectedModel: (model) => set({ selectedModel: model }),
}));
