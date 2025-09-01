import { create } from "zustand";

type Store = {
  generationIds: string[];
  addGenerationId: (id: string) => void;
  clearGenerationIds: () => void;
};

export const useVideoGenStore = create<Store>()((set) => {
  return {
    generationIds: [],
    addGenerationId: (id) =>
      set((state) => ({
        generationIds: [...state.generationIds, id],
      })),
    clearGenerationIds: () => set({ generationIds: [] }),
  };
});
