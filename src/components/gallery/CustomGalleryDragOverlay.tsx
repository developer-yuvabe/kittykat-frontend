import type React from "react";
import type { Photo } from "react-photo-album";
import { DragOverlay } from "@dnd-kit/core";
import Overlay from "./Overlay";
import type { SortablePhoto } from "./CustomGalleryContainer";

type ActivePhoto<TPhoto extends Photo> = {
  photo: SortablePhoto<TPhoto>;
  width: number;
  height: number;
  padding?: string;
};

interface CustomGalleryDragOverlayProps<TPhoto extends Photo> {
  activePhoto?: ActivePhoto<TPhoto>;
}

export function CustomGalleryDragOverlay<TPhoto extends Photo>({
  activePhoto,
}: CustomGalleryDragOverlayProps<TPhoto>) {
  return (
    <DragOverlay>{activePhoto && <Overlay {...activePhoto} />}</DragOverlay>
  );
}
