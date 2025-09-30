import { Context } from "@/types/types";
import { MoodboardPinnedItem } from "@/types/moodboard-agent.types";
import { create } from "zustand";

export interface PinnedItem {
  title: string;
  context: Context;
}

export interface PinnedMoodboardItem {
  title: string;
  moodboard: MoodboardPinnedItem["moodboard"];
}

// Define the store state type
interface PinnedContextState {
  pinnedItem: PinnedItem | null;
  pinnedMoodboard: PinnedMoodboardItem | null;
  addPinnedItem: (item: PinnedItem) => void;
  addPinnedMoodboard: (item: PinnedMoodboardItem) => void;
  removePinnedItem: () => void;
  removePinnedMoodboard: () => void;
  clearAllPinned: () => void;
}

export const usePinnedContextStore = create<PinnedContextState>((set) => ({
  pinnedItem: null,
  pinnedMoodboard: null,

  addPinnedItem: (item) => {
    set({ pinnedItem: item, pinnedMoodboard: null }); // Clear moodboard when adding regular item
  },

  addPinnedMoodboard: (item) => {
    set({ pinnedMoodboard: item, pinnedItem: null }); // Clear regular item when adding moodboard
  },

  removePinnedItem: () => {
    set({ pinnedItem: null });
  },

  removePinnedMoodboard: () => {
    set({ pinnedMoodboard: null });
  },

  clearAllPinned: () => {
    set({ pinnedItem: null, pinnedMoodboard: null });
  },
}));
