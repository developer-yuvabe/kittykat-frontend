"use client";

import type React from "react";
import { useRef, useState, useCallback } from "react";
import type { Photo } from "react-photo-album";
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
import { useMoodboardStore } from "@/store/moodboard.store";

export type SortablePhoto<TPhoto extends Photo> = TPhoto & {
  id: string;
  liked?: boolean;
  is_placeholder?: boolean;
  position?: number;
};

type OptimisticCustomGridGalleryProps = {
  items: UnifiedMoodboardItem[];
  setItems: React.Dispatch<React.SetStateAction<UnifiedMoodboardItem[]>>;
  movePhoto?: (oldIndex: number, newIndex: number) => void;
  onPhotoLike?: (index: number, liked: boolean) => void;
  hasUnsavedChanges?: boolean;
  moodboard: MoodboardInformation;
  onGallerySelection?: (
    selectedItems: GalleryItemResponse[],
    placeholderIndex: number
  ) => void;
  isPreview?: boolean;
};

export default function CustomGalleryContainer<TPhoto extends Photo>({
  items,
  setItems,
  movePhoto,
  onPhotoLike,
  hasUnsavedChanges,
  moodboard,
  onGallerySelection,
  isPreview = false,
}: OptimisticCustomGridGalleryProps) {
  const ref = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
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

  const { noOfImagesForMoodboard, setNoOfImagesForMoodboard } =
    useMoodboardStore();

  const normalizedItemsArray = normalizedItems();

  // Only enable drag functionality if both movePhoto and hasUnsavedChanges are provided
  const isDraggable =
    movePhoto !== undefined && hasUnsavedChanges !== undefined;

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

  // Now we don't need our own DndContext since it's handled by CarouselDndProvider
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
