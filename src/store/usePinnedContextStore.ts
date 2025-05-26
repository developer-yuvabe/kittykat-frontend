import { Context } from "@/types/types";
import { create } from "zustand";

export interface PinnedItem {
  title: string;
  context: Context;
}

// Define the store state type
interface PinnedContextState {
  pinnedItem: PinnedItem | null;
  addPinnedItem: (item: PinnedItem) => void;
  removePinnedItem: () => void;
}

export const usePinnedContextStore = create<PinnedContextState>((set) => ({
  pinnedItem: null,

  addPinnedItem: (item) => {
    set({ pinnedItem: item });
  },

  removePinnedItem: () => {
    set({ pinnedItem: null });
  },
}));
