"use client";

import type React from "react";
import { useRef, useState, useCallback } from "react";
import type { Photo } from "react-photo-album";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { ImageModal } from "../shared/ImageModal";
import {
  MIN_IMAGES_REQUIRED,
  moodboardGridLayouts,
} from "@/lib/moodboard.utils";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import type { MoodboardInformation } from "@/types/types";
import type { GalleryItemResponse } from "@/types/gallery.types";
import type { UnifiedMoodboardItem } from "@/types/moodboard.types";
import { CustomGalleryHooks } from "./CustomGalleryHooks";
import { CustomGalleryGrid } from "./CustomGalleryGrid";
import { CustomGalleryControls } from "./CustomGalleryControls";
import { CustomGalleryDragOverlay } from "./CustomGalleryDragOverlay";

export type SortablePhoto<TPhoto extends Photo> = TPhoto & {
  id: string;
  liked?: boolean;
  is_placeholder?: boolean;
  position?: number;
};

type ActivePhoto<TPhoto extends Photo> = {
  photo: SortablePhoto<TPhoto>;
  width: number;
  height: number;
  padding?: string;
  is_placeholder?: boolean;
};

type OptimisticCustomGridGalleryProps = {
  items: UnifiedMoodboardItem[];
  setItems: React.Dispatch<React.SetStateAction<UnifiedMoodboardItem[]>>;
  movePhoto?: (oldIndex: number, newIndex: number) => void;
  onPhotoLike?: (index: number, liked: boolean) => void;
  hasUnsavedChanges?: boolean;
  noOfImagesForMoodboard: number;
  setNoOfImagesForMoodboard: React.Dispatch<React.SetStateAction<number>>;
  moodboard: MoodboardInformation;
  onGallerySelection?: (
    selectedItems: GalleryItemResponse[],
    placeholderIndex: number
  ) => void;
  isPreview?: boolean;
  showAdvancedSettings?: boolean;
  setShowAdvancedSettings?: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function CustomGalleryContainer<TPhoto extends Photo>({
  items,
  setItems,
  movePhoto,
  onPhotoLike,
  hasUnsavedChanges,
  noOfImagesForMoodboard,
  setNoOfImagesForMoodboard,
  moodboard,
  onGallerySelection,
  isPreview = false,
  showAdvancedSettings = false,
  setShowAdvancedSettings,
}: OptimisticCustomGridGalleryProps) {
  const ref = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [activePhoto, setActivePhoto] = useState<ActivePhoto<TPhoto>>();
  const [expandedImage, setExpandedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);
  const [showLiked, setShowLiked] = useState(false);

  const normalizedItems = useCallback(() => {
    if (!items || !Array.isArray(items)) {
      return [];
    }

    // Simply return the items as they already contain placeholders
    // from the parent component (MoodboardLayout)
    return [...items].sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [items]);

  const normalizedItemsArray = normalizedItems();

  // Only enable drag functionality if both movePhoto and hasUnsavedChanges are provided
  const isDraggable =
    movePhoto !== undefined && hasUnsavedChanges !== undefined;

  const { sensors } = CustomGalleryHooks.useDragSensors();

  const handleDragStart = useCallback(
    (event: any) => {
      const { active } = event;
      const activeItem = normalizedItemsArray.find(
        (item) => item.id === active.id
      );

      if (activeItem) {
        setActivePhoto({
          photo: activeItem as SortablePhoto<TPhoto>,
          width: activeItem.width,
          height: activeItem.height,
          is_placeholder: activeItem.is_placeholder,
        });
      }
    },
    [normalizedItemsArray]
  );

  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event;
      setActivePhoto(undefined);

      if (!over || active.id === over.id) return;

      const oldIndex = normalizedItemsArray.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = normalizedItemsArray.findIndex(
        (item) => item.id === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        setItems((prevItems: UnifiedMoodboardItem[]) => {
          const newItems = [...prevItems];
          const activeItem = normalizedItemsArray[oldIndex];
          const overItem = normalizedItemsArray[newIndex];

          // Update positions
          const updatedActiveItem = { ...activeItem, position: newIndex };
          const updatedOverItem = { ...overItem, position: oldIndex };

          // Find and update in the original array
          const activeOriginalIndex = newItems.findIndex(
            (item) => item.id === activeItem.id
          );
          const overOriginalIndex = newItems.findIndex(
            (item) => item.id === overItem.id
          );

          if (activeOriginalIndex !== -1) {
            newItems[activeOriginalIndex] = updatedActiveItem;
          }

          if (overOriginalIndex !== -1) {
            newItems[overOriginalIndex] = updatedOverItem;
          } else if (overItem.is_placeholder) {
            // If dragging over a placeholder, just update the active item's position
            newItems[activeOriginalIndex] = updatedActiveItem;
          }

          return newItems;
        });

        if (movePhoto) {
          movePhoto(oldIndex, newIndex);
        }
      }
    },
    [normalizedItemsArray, movePhoto, setItems]
  );

  const { handleExpandImage, handleCloseModal } =
    CustomGalleryHooks.useImageModal({
      setExpandedImage,
    });

  const layout =
    moodboardGridLayouts[
      noOfImagesForMoodboard as keyof typeof moodboardGridLayouts
    ];

  const size = useResizeObserver<HTMLDivElement>({ ref });

  const containerHeight = (() => {
    if (!size.width || !layout) return 800; // fallback
    const rowCount = layout.containerClass.match(/grid-rows-(\d)/)
      ? Number.parseInt(layout.containerClass.match(/grid-rows-(\d)/)![1])
      : layout.containerClass.includes("grid-rows-[33%_33%_34%]")
      ? 3
      : 1;
    return (size.width * rowCount) / 4.7;
  })();

  const photos = normalizedItemsArray.filter(
    (item) => !item.is_placeholder
  ) as SortablePhoto<TPhoto>[];

  const galleryContent = (
    <div className="relative">
      <CustomGalleryGrid
        ref={ref}
        allItems={normalizedItemsArray}
        photos={photos}
        layout={layout}
        containerHeight={containerHeight}
        noOfImagesForMoodboard={noOfImagesForMoodboard}
        moodboard={moodboard}
        onGallerySelection={onGallerySelection}
        onPhotoLike={onPhotoLike}
        hasUnsavedChanges={hasUnsavedChanges}
        handleExpandImage={handleExpandImage}
        isDraggable={isDraggable}
        isAtMinimum={photos.length <= MIN_IMAGES_REQUIRED}
        setItems={setItems}
        minImagesRequired={MIN_IMAGES_REQUIRED}
        setNoOfImagesForMoodboard={setNoOfImagesForMoodboard}
        showLiked={showLiked}
        isPreview={isPreview}
      />
    </div>
  );

  // Only wrap with DndContext if dragging is enabled
  if (isDraggable) {
    return (
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        collisionDetection={closestCenter}
      >
        <SortableContext items={normalizedItemsArray.map((item) => item.id)}>
          {galleryContent}
          {!isPreview && (
            <CustomGalleryControls
              noOfImagesForMoodboard={noOfImagesForMoodboard}
              setNoOfImagesForMoodboard={setNoOfImagesForMoodboard}
              setItems={setItems}
              minImagesRequired={MIN_IMAGES_REQUIRED}
              showLiked={showLiked}
              setShowLiked={setShowLiked}
              showAdvancedSettings={showAdvancedSettings}
              setShowAdvancedSettings={setShowAdvancedSettings}
              hasTags={Object.keys(moodboard?.moodboard_tags ?? {}).length > 0}
            />
          )}
        </SortableContext>
        <CustomGalleryDragOverlay activePhoto={activePhoto} />
        {expandedImage && (
          <ImageModal
            imageUrl={expandedImage.url}
            alt={expandedImage.alt}
            isOpen={!!expandedImage}
            onClose={handleCloseModal}
          />
        )}
      </DndContext>
    );
  }

  // Return gallery without drag functionality
  return (
    <>
      {galleryContent}
      {!isPreview && (
        <CustomGalleryControls
          noOfImagesForMoodboard={noOfImagesForMoodboard}
          setNoOfImagesForMoodboard={setNoOfImagesForMoodboard}
          setItems={setItems}
          minImagesRequired={MIN_IMAGES_REQUIRED}
          showLiked={showLiked}
          setShowLiked={setShowLiked}
          showAdvancedSettings={showAdvancedSettings}
          setShowAdvancedSettings={setShowAdvancedSettings}
          hasTags={Object.keys(moodboard?.moodboard_tags ?? {}).length > 0}
        />
      )}
      {expandedImage && (
        <ImageModal
          imageUrl={expandedImage.url}
          alt={expandedImage.alt}
          isOpen={!!expandedImage}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
