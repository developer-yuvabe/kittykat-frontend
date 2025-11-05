import { create } from "zustand";
import { ThumbnailShape, ThumbnailSize, OrderBy } from "@/types/gallery.types";

interface GalleryFilterState {
  thumbnailSize: ThumbnailSize;
  thumbnailShape: ThumbnailShape;
  isAutoPlay: boolean;
  orderBy: OrderBy;
  isDraggable: boolean;

  setThumbnailSize: (size: ThumbnailSize) => void;
  setThumbnailShape: (shape: ThumbnailShape) => void;
  setIsAutoPlay: (autoplay: boolean) => void;
  setOrderBy: (orderBy: OrderBy) => void;
  setIsDraggable: (isDraggable: boolean) => void;
}

export const useGalleryFilterStore = create<GalleryFilterState>((set) => ({
  thumbnailSize: "medium",
  thumbnailShape: "dynamic",
  isAutoPlay: true,
  orderBy: "created_at_descending",
  isDraggable: false,

  setThumbnailSize: (thumbnailSize) => set({ thumbnailSize }),
  setThumbnailShape: (thumbnailShape) => set({ thumbnailShape }),
  setIsAutoPlay: (isAutoPlay) => set({ isAutoPlay }),
  setOrderBy: (orderBy) => set({ orderBy }),
  setIsDraggable: (isDraggable) => set({ isDraggable }),
}));
