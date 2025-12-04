import { create } from "zustand";
import { GalleryItemResponse } from "@/types/gallery.types";

interface ReferenceImagesState {
  // Data
  items: GalleryItemResponse[];
  isLoading: boolean;

  // Actions
  setItems: (items: GalleryItemResponse[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  addItems: (items: GalleryItemResponse[]) => void;
  // Add a single, minimal item optimistically (used for A2I drops)
  addOptimisticItem: (payload: {
    id: string;
    asset_url: string;
    preview_url?: string | null;
    brand_id?: string | null;
  }) => void;
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
      set({ items, isLoading: false });
    },

    // Set loading state
    setIsLoading: (isLoading) => {
      set({ isLoading });
    }, // Add new items optimistically (for uploads and selections)
    addItems: (newItems) => {
      const { items } = get();
      const now = new Date().toISOString();

      // Update new items with current timestamp
      const itemsWithTimestamp = newItems.map((item) => ({
        ...item,
        last_accessed_at: now,
      }));

      // Filter out duplicates based on asset_url
      const existingUrls = new Set(items.map((item) => item.asset_url));
      const uniqueNewItems = itemsWithTimestamp.filter(
        (item) => !existingUrls.has(item.asset_url)
      );

      // Add to front without sorting
      set({
        items: [...uniqueNewItems, ...items].slice(0, 40), // Keep only the most recent 40 items
      });
    },

    // Add a single item optimistically by URL or ID (used for drag-drop from A2I)
    addOptimisticItem: (payload: {
      id: string;
      asset_url: string;
      preview_url?: string | null;
      brand_id?: string | null;
    }) => {
      const { items } = get();
      const now = new Date().toISOString();

      // Build a minimal GalleryItemResponse-like object
      const optimisticItem: GalleryItemResponse = {
        id: payload.id,
        created_by: "system",
        created_at: now,
        updated_at: now,
        brand_id: payload.brand_id || "",
        asset_type: "image",
        latest_version_asset_type: "image",
        asset_source: "reference",
        asset_title: "",
        asset_url: payload.asset_url,
        preview_url: payload.preview_url ?? payload.asset_url,
        size: "",
        is_favourite: false,
        processing_status: "ready",
        last_accessed_at: now,
      };

      // Avoid duplicating existing items by id / url
      const exists = items.some(
        (it) =>
          it.id === optimisticItem.id ||
          it.asset_url === optimisticItem.asset_url
      );
      if (exists) return;

      set({ items: [optimisticItem, ...items].slice(0, 40) });
    },

    // Optimistically update last_accessed_at
    updateLastAccessed: (itemId) => {
      const { items } = get();
      const now = new Date().toISOString();

      const updatedItem = items.find((item) => item.id === itemId);
      if (!updatedItem) return;

      const otherItems = items.filter((item) => item.id !== itemId);

      set({
        items: [{ ...updatedItem, last_accessed_at: now }, ...otherItems],
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
