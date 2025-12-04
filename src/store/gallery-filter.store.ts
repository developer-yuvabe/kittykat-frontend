import { create } from "zustand";
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

export const useGalleryFilterStore = create<GalleryFilterState>()((set) => ({
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
}));
