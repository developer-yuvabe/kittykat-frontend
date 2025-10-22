import type React from "react";
import { forwardRef, useRef } from "react";
import type { Photo } from "react-photo-album";
import type { MoodboardInformation } from "@/types/types";
import type { GalleryItemResponse } from "@/types/gallery.types";
import type { UnifiedMoodboardItem } from "@/types/moodboard.types";
import { CustomGalleryPlaceholderCard } from "./CustomGalleryPlaceholderCard";
import { CustomGalleryGridItem } from "./CustomGalleryGridItem";
import type { SortablePhoto } from "./CustomGalleryContainer";
import { GalleryActions } from "@/hooks/useGallery";

type GridLayout = {
  containerClass: string;
  positions: Array<{ gridArea: string }>;
};

interface CustomGalleryGridProps<TPhoto extends Photo> {
  allItems: UnifiedMoodboardItem[];
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
  hasUnsavedChanges?: boolean;
  handleExpandImage: (photo: SortablePhoto<TPhoto>) => void;
  isDraggable: boolean;
  isAtMinimum: boolean;
  setItems: React.Dispatch<React.SetStateAction<UnifiedMoodboardItem[]>>;
  minImagesRequired: number;
  setNoOfImagesForMoodboard: React.Dispatch<React.SetStateAction<number>>;
  showLiked?: boolean;
  isPreview?: boolean;
  galleryActions?: GalleryActions;
}

export const CustomGalleryGrid = forwardRef<
  HTMLDivElement,
  CustomGalleryGridProps<any>
>(
  ({
    allItems,
    photos,
    layout,
    containerHeight,
    noOfImagesForMoodboard,
    moodboard,
    onGallerySelection,
    onPhotoLike,
    hasUnsavedChanges,
    handleExpandImage,
    isDraggable,
    setItems,
    minImagesRequired,
    setNoOfImagesForMoodboard,
    showLiked,
    isPreview,
    galleryActions,
  }) => {
    const gridRef = useRef<HTMLDivElement>(null);

    const handlePhotoLike = async (index: number, liked: boolean) => {
      if (onPhotoLike) {
        onPhotoLike(index, liked);
      }
    };

    const handleRemovePhoto = (id: string) => {
      const item = allItems.find((item) => item.id === id);
      if (!item || item.is_placeholder) return;

      if (photos.length <= minImagesRequired) {
        return;
      }

      setItems((prevItems) => {
        return prevItems.map((prevItem) => {
          if (prevItem.id === id) {
            // Replace image with placeholder at same position
            return {
              id: `placeholder-${prevItem.position}`,
              width: 300,
              height: 300,
              is_placeholder: true,
              position: prevItem.position,
              alt: `Placeholder ${prevItem.position + 1}`,
            };
          }
          return prevItem;
        });
      });
    };

    return (
      <>
        {/* Regular grid for UI interaction */}
        <div
          ref={gridRef}
          className={`w-full gap-1 grid ${layout?.containerClass} transition-opacity duration-200 min-w-[300px]`}
          style={{
            height: `${containerHeight}px`,
          }}
        >
          {allItems.map((item, index) => {
            const position = layout?.positions[index];
            if (!position) return null;

            if (item.is_placeholder) {
              return (
                <div
                  key={item?.id || index}
                  style={{ gridArea: position.gridArea }}
                  className="relative overflow-hidden"
                >
                  <CustomGalleryPlaceholderCard
                    photos={photos}
                    allItems={allItems}
                    noOfImagesForMoodboard={noOfImagesForMoodboard}
                    moodboard={moodboard}
                    onGallerySelection={onGallerySelection}
                    placeHolderIndex={index}
                    placeholderItemId={item.id}
                    setItems={setItems}
                    setNoOfImagesForMoodboard={setNoOfImagesForMoodboard}
                    isPreview={isPreview}
                    key={item.id}
                    galleryActions={galleryActions}
                  />
                </div>
              );
            } else {
              return (
                <div
                  key={item?.id || index}
                  style={{ gridArea: position.gridArea }}
                  className="relative overflow-hidden"
                >
                  <CustomGalleryGridItem
                    photo={item as SortablePhoto<any>}
                    index={index}
                    onPhotoLike={handlePhotoLike}
                    removedPhoto={handleRemovePhoto}
                    hasUnsavedChanges={hasUnsavedChanges}
                    handleExpandImage={handleExpandImage}
                    isDraggable={isDraggable}
                    setItems={setItems}
                    showLiked={showLiked}
                    isPreview={!isDraggable}
                    moodboard={moodboard}
                  />
                </div>
              );
            }
          })}
        </div>
      </>
    );
  }
);

CustomGalleryGrid.displayName = "CustomGalleryGrid";
