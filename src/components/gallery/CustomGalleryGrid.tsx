import type React from "react";
import { forwardRef } from "react";
import type { Photo } from "react-photo-album";
import { MoodboardInformation } from "@/types/types";
import { GalleryItemResponse } from "@/types/gallery.types";
import { CustomGalleryPlaceholderCard } from "./CustomGalleryPlaceholderCard";
import { CustomGalleryGridItem } from "./CustomGalleryGridItem";
import type { SortablePhoto } from "./CustomGalleryContainer";

type GridLayout = {
  containerClass: string;
  positions: Array<{ gridArea: string }>;
};

interface CustomGalleryGridProps<TPhoto extends Photo> {
  allItems: SortablePhoto<TPhoto>[];
  photos: SortablePhoto<TPhoto>[];
  layout: GridLayout | undefined;
  containerHeight: number;
  noOfImagesForMoodboard: number;
  moodboard: MoodboardInformation;
  onGallerySelection?: (
    selectedItems: GalleryItemResponse[],
    placeHolderIndex: number
  ) => void;
  onPhotoLike?: (index: number, liked: boolean) => void;
  onReplaceImage?: ({
    imageToReplaceId,
    replacementImageUrl,
  }: {
    imageToReplaceId: string;
    replacementImageUrl: string;
  }) => Promise<void>;
  hasUnsavedChanges?: boolean;
  handleExpandImage: (photo: SortablePhoto<TPhoto>) => void;
  isDraggable: boolean;
  isAtMinimum: boolean;
  setPhotos: React.Dispatch<React.SetStateAction<SortablePhoto<TPhoto>[]>>;
  setPlaceholderItems: React.Dispatch<
    React.SetStateAction<SortablePhoto<Photo>[]>
  >;
  minImagesRequired: number;
}

export const CustomGalleryGrid = forwardRef<
  HTMLDivElement,
  CustomGalleryGridProps<any>
>(
  (
    {
      allItems,
      photos,
      layout,
      containerHeight,
      noOfImagesForMoodboard,
      moodboard,
      onGallerySelection,
      onPhotoLike,
      onReplaceImage,
      hasUnsavedChanges,
      handleExpandImage,
      isDraggable,
      isAtMinimum,
      setPhotos,
      minImagesRequired,
    },
    ref
  ) => {
    const handlePhotoLike = async (index: number, liked: boolean) => {
      if (onPhotoLike) {
        onPhotoLike(index, liked);
      }
    };

    const handleRemovePhoto = (id: string) => {
      if (photos.length <= minImagesRequired) {
        // Toast will be handled in the grid item component
        return;
      }

      setPhotos((prevPhotos) => {
        const index = prevPhotos.findIndex((photo) => photo.id === id);
        if (index === -1) return prevPhotos;

        const newPhotos = [...prevPhotos];
        newPhotos.splice(index, 1);

        return newPhotos;
      });
    };

    return (
      <div
        ref={ref}
        className={`w-full gap-1 grid ${layout?.containerClass} transition-opacity duration-200`}
        style={{ height: `${containerHeight}px` }}
      >
        {allItems.map((item, index) => {
          const position = layout?.positions[index];
          if (!position) return null;

          return (
            <div
              key={item?.id || index}
              style={{ gridArea: position.gridArea }}
              className="relative overflow-hidden"
            >
              {item && "isPlaceholder" in item ? (
                <CustomGalleryPlaceholderCard
                  photos={photos}
                  noOfImagesForMoodboard={noOfImagesForMoodboard}
                  moodboard={moodboard}
                  onGallerySelection={onGallerySelection}
                  placeHolderIndex={index}
                  setPhotos={setPhotos}
                />
              ) : (
                <CustomGalleryGridItem
                  photo={item}
                  index={index}
                  onPhotoLike={handlePhotoLike}
                  removedPhoto={handleRemovePhoto}
                  onReplaceImage={onReplaceImage}
                  hasUnsavedChanges={hasUnsavedChanges}
                  handleExpandImage={handleExpandImage}
                  isDraggable={isDraggable}
                  isAtMinimum={isAtMinimum}
                  setPhotos={setPhotos}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }
);

CustomGalleryGrid.displayName = "CustomGalleryGrid";
