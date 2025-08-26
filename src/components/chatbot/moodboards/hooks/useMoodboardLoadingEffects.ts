import { useEffect } from "react";
import type { Photo } from "react-photo-album";
import { SortablePhoto } from "@/components/gallery/CustomGalleryContainer";

interface UseMoodboardLoadingEffectsProps {
  bulkGalleryItems: any[];
  moodboardId: string;
  currentMoodboardId: string;
  hasUnsavedChanges: boolean;
  isMoodboardSaving: boolean;
  photos: SortablePhoto<Photo>[];
  loadImagesWithCurrentData: () => Promise<void>;
  forceLoadImagesWithCurrentData: () => Promise<void>;
}

export const useMoodboardLoadingEffects = ({
  bulkGalleryItems,
  moodboardId,
  currentMoodboardId,
  hasUnsavedChanges,
  isMoodboardSaving,
  photos,
  loadImagesWithCurrentData,
  forceLoadImagesWithCurrentData,
}: UseMoodboardLoadingEffectsProps) => {
  // Trigger load when moodboard status changes or gallery items become available
  useEffect(() => {
    // Don't reload if user has unsaved changes or if currently saving
    if (hasUnsavedChanges || isMoodboardSaving) return;

    // Don't reload if we already have non-placeholder photos loaded
    // This prevents unnecessary reloading when bulkGalleryItems updates
    const hasNonPlaceholderPhotos = photos.some(
      (photo) => !photo.is_placeholder && photo.src
    );
    if (hasNonPlaceholderPhotos && bulkGalleryItems.length > 0) return;

    if (bulkGalleryItems.length > 0) {
      const timeoutId = setTimeout(() => {
        loadImagesWithCurrentData();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [
    bulkGalleryItems.length,
    moodboardId,
    hasUnsavedChanges,
    isMoodboardSaving,
    photos,
    loadImagesWithCurrentData,
  ]);

  // Also trigger when moodboard changes
  useEffect(() => {
    // Don't reload if user has unsaved changes or if currently saving
    if (hasUnsavedChanges || isMoodboardSaving) return;

    // Force reload when moodboard actually changes
    if (currentMoodboardId !== moodboardId || photos.length === 0) {
      const timeoutId = setTimeout(() => {
        forceLoadImagesWithCurrentData();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [
    moodboardId,
    currentMoodboardId,
    hasUnsavedChanges,
    isMoodboardSaving,
    photos.length,
    forceLoadImagesWithCurrentData,
  ]);
};
