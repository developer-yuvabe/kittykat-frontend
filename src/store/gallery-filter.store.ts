import { create } from "zustand";
import { ThumbnailShape, ThumbnailSize, OrderBy } from "@/types/gallery.types";

interface GalleryFilterState {
  // View settings
  thumbnailSize: ThumbnailSize;
  thumbnailShape: ThumbnailShape;
  isAutoPlay: boolean;
  orderBy: OrderBy;
  isDraggable: boolean;

  // Selection state
  selectedSubFolderId: string | null;
  selectedItems: string[];
  multiSelectItems: string[];
  selectAllMode: "none" | "visible" | "all";
  excludedItems: string[];
  lastSelectedId: string | null;
  totalItemsCount: number; // Total items from the current gallery query

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

  // Selection setters
  setSelectedSubFolderId: (subFolderId: string | null) => void;
  setSelectedItems: (items: string[] | ((prev: string[]) => string[])) => void;
  setMultiSelectItems: (
    items: string[] | ((prev: string[]) => string[])
  ) => void;
  setSelectAllMode: (mode: "none" | "visible" | "all") => void;
  setExcludedItems: (items: string[] | ((prev: string[]) => string[])) => void;
  setLastSelectedId: (id: string | null) => void;
  setTotalItemsCount: (count: number) => void;
  clearSelection: () => void;

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

  // Selection state
  selectedSubFolderId: null,
  selectedItems: [],
  multiSelectItems: [],
  selectAllMode: "none",
  excludedItems: [],
  lastSelectedId: null,
  totalItemsCount: 0,

  // Filter settings
  ...initialFilterState,

  // View setters
  setThumbnailSize: (thumbnailSize) => set({ thumbnailSize }),
  setThumbnailShape: (thumbnailShape) => set({ thumbnailShape }),
  setIsAutoPlay: (isAutoPlay) => set({ isAutoPlay }),
  setOrderBy: (orderBy) => set({ orderBy }),
  setIsDraggable: (isDraggable) => set({ isDraggable }),

  // Selection setters
  setSelectedSubFolderId: (selectedSubFolderId) => set({ selectedSubFolderId }),
  setSelectedItems: (items) =>
    set((state) => ({
      selectedItems:
        typeof items === "function" ? items(state.selectedItems) : items,
    })),
  setMultiSelectItems: (items) =>
    set((state) => ({
      multiSelectItems:
        typeof items === "function" ? items(state.multiSelectItems) : items,
    })),
  setSelectAllMode: (selectAllMode) => set({ selectAllMode }),
  setExcludedItems: (items) =>
    set((state) => ({
      excludedItems:
        typeof items === "function" ? items(state.excludedItems) : items,
    })),
  setLastSelectedId: (lastSelectedId) => set({ lastSelectedId }),
  setTotalItemsCount: (totalItemsCount) => set({ totalItemsCount }),
  clearSelection: () =>
    set({
      selectedItems: [],
      multiSelectItems: [],
      selectAllMode: "none",
      excludedItems: [],
      lastSelectedId: null,
    }),

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
