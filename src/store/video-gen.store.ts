import { A2iImageGeneration } from "@/types/types";
import { create } from "zustand";

type Store = {
  generations: A2iImageGeneration[];
  setGenerations: (generations: A2iImageGeneration[]) => void;

  currentSessionGenerationIds: string[];
  addCurrentSessionGenerationId: (id: string) => void;
  clearCurrentSessionGenerationIds: () => void;
};

export const useVideoGenStore = create<Store>()((set) => {
  return {
    generations: [],
    setGenerations: (generations: A2iImageGeneration[]) =>
      set(() => ({ generations })),

    currentSessionGenerationIds: [],
    addCurrentSessionGenerationId: (id: string) =>
      set((state) => ({
        currentSessionGenerationIds: [...state.currentSessionGenerationIds, id],
      })),
    clearCurrentSessionGenerationIds: () =>
      set(() => ({ currentSessionGenerationIds: [] })),
  };
});
