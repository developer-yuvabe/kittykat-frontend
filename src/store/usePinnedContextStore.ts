import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define the type for a pinned context item
interface PinnedItem {
  id: string;
  title: string;
  context: any;
  timestamp: number;
}

// Define the store state type
interface PinnedContextState {
  pinnedItem: PinnedItem | null;
  addPinnedItem: (title: string, context: any) => void;
  removePinnedItem: () => void;
  clearPinnedItem: () => void;
  isPinned: (context: any) => boolean;
  getPinnedItemId: (context: any) => string | null;
}

// Create the Zustand store with persistence
export const usePinnedContextStore = create<PinnedContextState>()(
  persist(
    (set, get) => ({
      pinnedItem: null,

      // Add a new pinned item (replaces any existing one)
      addPinnedItem: (title: string, context: any) => {
        set({
          pinnedItem: {
            id: title,
            title,
            context,
            timestamp: Date.now(),
          },
        });
      },

      // Remove the currently pinned item
      removePinnedItem: () => {
        set({ pinnedItem: null });
      },

      // Clear the pinned item (same as remove but for consistency)
      clearPinnedItem: () => {
        set({ pinnedItem: null });
      },

      // Check if a context is already pinned
      isPinned: (context: any) => {
        const contextStr =
          typeof context === "string" ? context : JSON.stringify(context);
        const pinnedItem = get().pinnedItem;
        if (!pinnedItem) return false;
        const itemContextStr =
          typeof pinnedItem.context === "string"
            ? pinnedItem.context
            : JSON.stringify(pinnedItem.context);
        return itemContextStr === contextStr;
      },

      // Get the ID of a pinned item by its context
      getPinnedItemId: (context: any) => {
        const contextStr =
          typeof context === "string" ? context : JSON.stringify(context);
        const pinnedItem = get().pinnedItem;
        if (!pinnedItem) return null;
        const itemContextStr =
          typeof pinnedItem.context === "string"
            ? pinnedItem.context
            : JSON.stringify(pinnedItem.context);
        return itemContextStr === contextStr ? pinnedItem.id : null;
      },
    }),
    {
      name: "pinned-context-storage", // unique name for localStorage
    }
  )
);

// Optional: export a hook for accessing the pinned item in other components
export const usePinnedItem = () =>
  usePinnedContextStore((state) => state.pinnedItem);
