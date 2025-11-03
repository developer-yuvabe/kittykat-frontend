import { create } from "zustand";
import { GalleryItemResponse } from "@/types/gallery.types";

interface ReferenceImagesState {
  // Data
  items: GalleryItemResponse[];
  isLoading: boolean;

  // Actions
  setItems: (items: GalleryItemResponse[]) => void;
  updateLastAccessed: (itemId: string) => void;

  reset: () => void;
}

export const useReferenceImagesStore = create<ReferenceImagesState>(
  (set, get) => ({
    // Initial state
    items: [],
    isLoading: false,

    // Set items from API
    setItems: (items) => {
      set({
        items: items.sort((a, b) => {
          const dateA = a.last_accessed_at
            ? new Date(a.last_accessed_at).getTime()
            : 0;
          const dateB = b.last_accessed_at
            ? new Date(b.last_accessed_at).getTime()
            : 0;
          return dateB - dateA; // Most recent first
        }),
      });
    },

    // Optimistically update last_accessed_at
    updateLastAccessed: (itemId) => {
      const { items } = get();
      const now = new Date().toISOString();

      set({
        items: items
          .map((item) =>
            item.id === itemId ? { ...item, last_accessed_at: now } : item
          )
          .sort((a, b) => {
            const dateA = a.last_accessed_at
              ? new Date(a.last_accessed_at).getTime()
              : 0;
            const dateB = b.last_accessed_at
              ? new Date(b.last_accessed_at).getTime()
              : 0;
            return dateB - dateA;
          }),
      });
    },

    // Fetch reference images

    // Reset store
    reset: () => {
      set({
        items: [],
        isLoading: false,
      });
    },
  })
);
