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
  pinnedItems: PinnedItem[];
  addPinnedItem: (title: string, context: any) => void;
  removePinnedItem: (id: string) => void;
  clearPinnedItems: () => void;
  isPinned: (context: any) => boolean;
  getPinnedItemId: (context: any) => string | null;
}

// Generate a unique ID for each pinned item
const generateId = () => Math.random().toString(36).substring(2, 9);

// Create the Zustand store with persistence
export const usePinnedContextStore = create<PinnedContextState>()(
  persist(
    (set, get) => ({
      pinnedItems: [],

      // Add a new pinned item
      addPinnedItem: (title: string, context: any) => {
        const contextStr =
          typeof context === "string" ? context : JSON.stringify(context);

        // Check if this context is already pinned
        if (get().isPinned(context)) return;

        set((state) => ({
          pinnedItems: [
            ...state.pinnedItems,
            {
              id: generateId(),
              title,
              context,
              timestamp: Date.now(),
            },
          ],
        }));
      },

      // Remove a pinned item by ID
      removePinnedItem: (id: string) => {
        set((state) => ({
          pinnedItems: state.pinnedItems.filter((item) => item.id !== id),
        }));
      },

      // Clear all pinned items
      clearPinnedItems: () => {
        set(() => ({ pinnedItems: [] }));
      },

      // Check if a context is already pinned
      isPinned: (context: any) => {
        const contextStr =
          typeof context === "string" ? context : JSON.stringify(context);
        return get().pinnedItems.some((item) => {
          const itemContextStr =
            typeof item.context === "string"
              ? item.context
              : JSON.stringify(item.context);
          return itemContextStr === contextStr;
        });
      },

      // Get the ID of a pinned item by its context
      getPinnedItemId: (context: any) => {
        const contextStr =
          typeof context === "string" ? context : JSON.stringify(context);
        const item = get().pinnedItems.find((item) => {
          const itemContextStr =
            typeof item.context === "string"
              ? item.context
              : JSON.stringify(item.context);
          return itemContextStr === contextStr;
        });
        return item ? item.id : null;
      },
    }),
    {
      name: "pinned-contexts-storage", // unique name for localStorage
    }
  )
);

// Optional: export a hook for accessing pinned items in other components
export const usePinnedItems = () =>
  usePinnedContextStore((state) => state.pinnedItems);
