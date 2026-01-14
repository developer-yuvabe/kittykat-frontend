import { Context } from "@/types/types";
import { create } from "zustand";
import { useThreadStore } from "./thread.store";

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
    // Open KittyKat Assistant
    useThreadStore.getState().setShowChatAssistant(true);
    set({ pinnedItem: item });
  },

  removePinnedItem: () => {
    set({ pinnedItem: null });
  },
}));
