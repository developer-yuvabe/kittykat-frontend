"use client";

import type React from "react";
import { useRef, useState } from "react";
import type { Photo } from "react-photo-album";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { ImageModal } from "../shared/ImageModal";
import { moodboardGridLayouts } from "@/lib/moodboard.utils";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { MoodboardInformation } from "@/types/types";
import { GalleryItemResponse } from "@/types/gallery.types";
import { CustomGalleryHooks } from "./CustomGalleryHooks";
import { CustomGalleryGrid } from "./CustomGalleryGrid";
import { CustomGalleryControls } from "./CustomGalleryControls";
import { CustomGalleryDragOverlay } from "./CustomGalleryDragOverlay";

export type SortablePhoto<TPhoto extends Photo> = TPhoto & {
  id: string;
  liked?: boolean;
  isPlaceholder?: boolean;
  placeholderIndex?: number;
};

type ActivePhoto<TPhoto extends Photo> = {
  photo: SortablePhoto<TPhoto>;
  width: number;
  height: number;
  padding?: string;
};

type OptimisticCustomGridGalleryProps<TPhoto extends Photo> = {
  photos: SortablePhoto<TPhoto>[];
  setPhotos: React.Dispatch<React.SetStateAction<SortablePhoto<TPhoto>[]>>;
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
  placeholderItems?: Array<SortablePhoto<TPhoto>>;
  setPlaceholderItems: React.Dispatch<
    React.SetStateAction<SortablePhoto<Photo>[]>
  >;
  isPreview?: boolean;
  showAdvancedSettings?: boolean;
  setShowAdvancedSettings?: React.Dispatch<React.SetStateAction<boolean>>;
};

const MIN_IMAGES_REQUIRED = 10;

export default function CustomGalleryContainer<TPhoto extends Photo>({
  photos,
  movePhoto,
  onPhotoLike,
  hasUnsavedChanges,
  noOfImagesForMoodboard,
  setNoOfImagesForMoodboard,
  moodboard,
  onGallerySelection,
  setPhotos,
  placeholderItems = [],
  setPlaceholderItems,
  isPreview = false,
  showAdvancedSettings = false,
  setShowAdvancedSettings,
}: OptimisticCustomGridGalleryProps<TPhoto>) {
  const ref = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [activePhoto, setActivePhoto] = useState<ActivePhoto<TPhoto>>();
  const [expandedImage, setExpandedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);
  const [showLiked, setShowLiked] = useState(false);

  // Only enable drag functionality if both movePhoto and hasUnsavedChanges are provided
  const isDraggable =
    movePhoto !== undefined && hasUnsavedChanges !== undefined;

  const { sensors } = CustomGalleryHooks.useDragSensors();

  const { handleDragStart, handleDragEnd } = CustomGalleryHooks.useDragHandlers(
    {
      photos,
      ref,
      isDraggable,
      movePhoto,
      setActivePhoto,
    }
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
  const allItems = [...photos, ...placeholderItems];

  const containerHeight = (() => {
    if (!size.width || !layout) return 800; // fallback
    const rowCount = layout.containerClass.match(/grid-rows-(\d)/)
      ? Number.parseInt(layout.containerClass.match(/grid-rows-(\d)/)![1])
      : layout.containerClass.includes("grid-rows-[33%_33%_34%]")
      ? 3
      : 1;
    return (size.width * rowCount) / 4.7;
  })();

  const galleryContent = (
    <div className="relative">
      <CustomGalleryGrid
        ref={ref}
        allItems={allItems}
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
        setPhotos={setPhotos}
        setPlaceholderItems={setPlaceholderItems}
        minImagesRequired={MIN_IMAGES_REQUIRED}
        setNoOfImagesForMoodboard={setNoOfImagesForMoodboard}
        showLiked={showLiked}
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
        <SortableContext items={photos}>
          {galleryContent}
          {!isPreview && (
            <CustomGalleryControls
              photosLength={photos.length}
              noOfImagesForMoodboard={noOfImagesForMoodboard}
              setNoOfImagesForMoodboard={setNoOfImagesForMoodboard}
              setPhotos={setPhotos}
              setPlaceholderItems={setPlaceholderItems}
              minImagesRequired={MIN_IMAGES_REQUIRED}
              placeholderItems={placeholderItems}
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
          photosLength={photos.length}
          noOfImagesForMoodboard={noOfImagesForMoodboard}
          setNoOfImagesForMoodboard={setNoOfImagesForMoodboard}
          setPhotos={setPhotos}
          setPlaceholderItems={setPlaceholderItems}
          minImagesRequired={MIN_IMAGES_REQUIRED}
          placeholderItems={placeholderItems}
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
