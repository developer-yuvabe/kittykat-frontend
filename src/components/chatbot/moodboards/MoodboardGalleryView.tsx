"use client";

import CustomGalleryContainer from "@/components/gallery/CustomGalleryContainer";
import type { Photo } from "react-photo-album";
import { SortablePhoto } from "@/components/gallery/CustomGalleryContainer";
import type { MoodboardInformation } from "@/types/types";
import { GalleryActions } from "@/hooks/useGallery";
import { forwardRef } from "react";

interface MoodboardGalleryViewProps {
  photos: SortablePhoto<Photo>[];
  setPhotos: React.Dispatch<React.SetStateAction<SortablePhoto<Photo>[]>>;
  movePhoto: (dragIndex: number, hoverIndex: number) => void;
  onPhotoLike: (index: number, liked: boolean) => void;
  hasUnsavedChanges: boolean;
  onGallerySelection: (items: any[], placeHolderIndex?: number) => void;
  moodboard: MoodboardInformation;
  galleryActions: GalleryActions;
}

const MoodboardGalleryView = forwardRef<
  HTMLDivElement,
  MoodboardGalleryViewProps
>(
  (
    {
      photos,
      setPhotos,
      movePhoto,
      onPhotoLike,
      hasUnsavedChanges,
      onGallerySelection,
      moodboard,
      galleryActions,
    },
    ref
  ) => {
    return (
      <div className="w-full overflow-hidden">
        <div className="mx-auto max-w-5xl w-full px-2">
          <CustomGalleryContainer
            ref={ref}
            items={photos.map((photo, index) => ({
              id: photo.id,
              src: photo.src,
              width: photo.width,
              height: photo.height,
              alt: photo.alt,
              liked: photo.liked,
              is_placeholder: photo.is_placeholder,
              position: index,
            }))}
            setItems={(newItems) => {
              if (typeof newItems === "function") {
                setPhotos((prev) => {
                  const currentItems = prev.map((photo, index) => ({
                    id: photo.id,
                    src: photo.src,
                    width: photo.width,
                    height: photo.height,
                    alt: photo.alt,
                    liked: photo.liked,
                    is_placeholder: photo.is_placeholder,
                    position: index,
                  }));
                  const updated = newItems(currentItems);
                  return updated.map((item) => ({
                    id: item.id,
                    src: item.src || "",
                    width: item.width,
                    height: item.height,
                    alt: item.alt || "",
                    liked: item.liked,
                    is_placeholder: item.is_placeholder,
                  }));
                });
              } else {
                setPhotos(
                  newItems.map((item) => ({
                    id: item.id,
                    src: item.src || "",
                    width: item.width,
                    height: item.height,
                    alt: item.alt || "",
                    liked: item.liked,
                    is_placeholder: item.is_placeholder,
                  }))
                );
              }
            }}
            movePhoto={movePhoto}
            onPhotoLike={onPhotoLike}
            hasUnsavedChanges={hasUnsavedChanges}
            onGallerySelection={onGallerySelection}
            moodboard={moodboard}
            galleryActions={galleryActions}
          />
        </div>
      </div>
    );
  }
);

MoodboardGalleryView.displayName = "MoodboardGalleryView";

export default MoodboardGalleryView;
