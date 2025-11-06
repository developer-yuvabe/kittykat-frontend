import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ThumbnailShape, ThumbnailSize, OrderBy } from "@/types/gallery.types";

interface GalleryFilterState {
  // View settings
  thumbnailSize: ThumbnailSize;
  thumbnailShape: ThumbnailShape;
  isAutoPlay: boolean;
  orderBy: OrderBy;
  isDraggable: boolean;

  // Filter settings
  favorites: boolean;
  hasComments: boolean;
  mediaTypes: string[];
  workflowStatus: string[];
  dateFrom: Date | undefined;
  dateTo: Date | undefined;

  // View setters
  setThumbnailSize: (size: ThumbnailSize) => void;
  setThumbnailShape: (shape: ThumbnailShape) => void;
  setIsAutoPlay: (autoplay: boolean) => void;
  setOrderBy: (orderBy: OrderBy) => void;
  setIsDraggable: (isDraggable: boolean) => void;

  // Filter setters
  setFavorites: (favorites: boolean) => void;
  setHasComments: (hasComments: boolean) => void;
  setMediaTypes: (mediaTypes: string[]) => void;
  setWorkflowStatus: (workflowStatus: string[]) => void;
  setDateFrom: (dateFrom: Date | undefined) => void;
  setDateTo: (dateTo: Date | undefined) => void;

  // Reset function
  resetFilters: () => void;
}

const initialFilterState = {
  favorites: false,
  hasComments: false,
  mediaTypes: [],
  workflowStatus: [],
  dateFrom: undefined,
  dateTo: undefined,
};

const initialViewState = {
  thumbnailSize: "medium" as ThumbnailSize,
  thumbnailShape: "dynamic" as ThumbnailShape,
  isAutoPlay: true,
  orderBy: "created_at_descending" as OrderBy,
  isDraggable: false,
};

export const useGalleryFilterStore = create<GalleryFilterState>()(
  persist(
    (set) => ({
      // View settings
      ...initialViewState,

      // Filter settings
      ...initialFilterState,

      // View setters
      setThumbnailSize: (thumbnailSize) => set({ thumbnailSize }),
      setThumbnailShape: (thumbnailShape) => set({ thumbnailShape }),
      setIsAutoPlay: (isAutoPlay) => set({ isAutoPlay }),
      setOrderBy: (orderBy) => set({ orderBy }),
      setIsDraggable: (isDraggable) => set({ isDraggable }),

      // Filter setters
      setFavorites: (favorites) => set({ favorites }),
      setHasComments: (hasComments) => set({ hasComments }),
      setMediaTypes: (mediaTypes) => set({ mediaTypes }),
      setWorkflowStatus: (workflowStatus) => set({ workflowStatus }),
      setDateFrom: (dateFrom) => set({ dateFrom }),
      setDateTo: (dateTo) => set({ dateTo }),

      // Reset function
      resetFilters: () => set(initialFilterState),
    }),
    {
      name: "gallery-filter-storage",
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value) => {
          // Convert date strings back to Date objects
          if (
            (key === "dateFrom" || key === "dateTo") &&
            typeof value === "string"
          ) {
            return new Date(value);
          }
          return value;
        },
        replacer: (key, value) => {
          // Dates will automatically be converted to ISO strings
          return value;
        },
      }),
      partialize: (state) => ({
        // Persist view settings
        thumbnailSize: state.thumbnailSize,
        thumbnailShape: state.thumbnailShape,
        isAutoPlay: state.isAutoPlay,
        orderBy: state.orderBy,

        // Persist filter settings
        favorites: state.favorites,
        hasComments: state.hasComments,
        mediaTypes: state.mediaTypes,
        workflowStatus: state.workflowStatus,
        dateFrom: state.dateFrom,
        dateTo: state.dateTo,
      }),
    }
  )
);
