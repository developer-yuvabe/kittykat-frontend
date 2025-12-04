import { A2iImageGeneration } from "@/types/types";
import { create } from "zustand";

type Store = {
  generations: A2iImageGeneration[];
  setGenerations: (generations: A2iImageGeneration[]) => void;

  currentSessionGenerationIds: string[];
  addCurrentSessionGenerationId: (id: string) => void;
  clearCurrentSessionGenerationIds: () => void;

  optimisitcallyDeletedGenerationIds: string[];
  addOptimisticallyDeletedGenerationId: (id: string) => void;
  removeOptimisticallyDeletedGenerationId: (id: string) => void;
};

export const useGenerationsStore = create<Store>()((set) => {
  return {
    generations: [],
    setGenerations: (generations: A2iImageGeneration[]) =>
      set(() => ({ generations })),

    currentSessionGenerationIds: [],
    addCurrentSessionGenerationId: (id: string) =>
      set((state) => ({
        currentSessionGenerationIds: [id, ...state.currentSessionGenerationIds],
      })),
    clearCurrentSessionGenerationIds: () =>
      set(() => ({ currentSessionGenerationIds: [] })),

    optimisitcallyDeletedGenerationIds: [],
    addOptimisticallyDeletedGenerationId: (id: string) =>
      set((state) => ({
        optimisitcallyDeletedGenerationIds: [
          id,
          ...state.optimisitcallyDeletedGenerationIds,
        ],
      })),
    removeOptimisticallyDeletedGenerationId: (id: string) =>
      set((state) => ({
        optimisitcallyDeletedGenerationIds:
          state.optimisitcallyDeletedGenerationIds.filter(
            (genId) => genId !== id
          ),
      })),
  };
});
