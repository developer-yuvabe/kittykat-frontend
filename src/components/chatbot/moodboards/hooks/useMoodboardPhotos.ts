import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { Photo } from "react-photo-album";
import type { GalleryItemResponse } from "@/types/gallery.types";
import type { MoodboardInformation } from "@/types/types";
import { SortablePhoto } from "@/components/gallery/CustomGalleryContainer";

interface UseMoodboardPhotosProps {
  moodboard: MoodboardInformation;
  bulkGalleryItems: GalleryItemResponse[];
  noOfImagesForMoodboard: number;
  hasUnsavedChanges: boolean;
  isMoodboardSaving: boolean;
}

export const useMoodboardPhotos = ({
  moodboard,
  bulkGalleryItems,
  noOfImagesForMoodboard,
  hasUnsavedChanges,
  isMoodboardSaving,
}: UseMoodboardPhotosProps) => {
  const [photos, setPhotos] = useState<SortablePhoto<Photo>[]>([]);
  const [originalPhotos, setOriginalPhotos] = useState<SortablePhoto<Photo>[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [moodboardGenerationInProgress, setMoodboardGenerationInProgress] =
    useState(false);
  const [currentMoodboardId, setCurrentMoodboardId] = useState<string>(
    moodboard?.id
  );

  // Use refs to track the latest values without causing re-renders
  const latestMoodboardRef = useRef(moodboard);
  const latestGalleryItemsRef = useRef<GalleryItemResponse[]>([]);

  // Update refs when values change
  useEffect(() => {
    latestMoodboardRef.current = moodboard;
  }, [moodboard]);

  useEffect(() => {
    latestGalleryItemsRef.current = bulkGalleryItems;
  }, [bulkGalleryItems]);

  // Reset state when moodboard changes
  useEffect(() => {
    if (moodboard.id !== currentMoodboardId) {
      setPhotos([]);
      setOriginalPhotos([]);
      setLoading(false);
      setCurrentMoodboardId(moodboard.id);
    }
  }, [moodboard.id, currentMoodboardId]);

  // Helper function to create a placeholder photo
  const createPlaceholderPhoto = useCallback(
    (id: string, position: number): SortablePhoto<Photo> => {
      return {
        id,
        src: "",
        width: 300,
        height: 300,
        alt: `Placeholder ${position + 1}`,
        liked: false,
        is_placeholder: true,
        position,
      };
    },
    []
  );

  // Function to process moodboard assets into photos
  const processAssetsToPhotos = useCallback(
    (
      assets: any[],
      galleryItems: GalleryItemResponse[]
    ): SortablePhoto<Photo>[] => {
      if (!assets || assets.length === 0) return [];

      const imagesToLoad = assets
        .map((asset) => {
          // Check if this is a placeholder
          if (String(asset.gallery_item_id).startsWith("placeholder")) {
            return {
              id: asset.gallery_item_id,
              src: "",
              position: asset.position || 0,
              width: 300,
              height: 300,
              is_placeholder: true,
              is_liked: false,
            };
          }

          const galleryItem = galleryItems.find(
            (item) => item.id === asset.gallery_item_id
          );

          // If gallery item is not found, render as placeholder
          if (!galleryItem) {
            return {
              id: `placeholder-${asset.position || 0}`,
              src: "",
              position: asset.position || 0,
              width: 300,
              height: 300,
              is_placeholder: true,
              is_liked: false,
            };
          }

          return {
            id: asset.gallery_item_id,
            src: galleryItem.preview_url || galleryItem.asset_url || "",
            position: asset.position || 0,
            width: galleryItem.dimensions?.width || 300,
            height: galleryItem.dimensions?.height || 300,
            is_placeholder: false,
            is_liked: galleryItem.is_favourite || false,
          };
        })
        .filter((item) => item !== null);

      return imagesToLoad
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          id: item.id,
          src: item.src,
          width: item.width,
          height: item.height,
          alt: `Image ${item.id}`,
          liked: item.is_liked,
          is_placeholder: item.is_placeholder,
          position: item.position,
        }));
    },
    []
  );

  // Function to fill missing positions with placeholders
  const fillWithPlaceholders = useCallback(
    (
      loadedPhotos: SortablePhoto<Photo>[],
      targetCount: number
    ): SortablePhoto<Photo>[] => {
      const result = [...loadedPhotos];

      // Fill missing positions with placeholders up to targetCount
      for (let i = 0; i < targetCount; i++) {
        const existingItem = result.find((item, index) => index === i);
        if (!existingItem) {
          result.splice(i, 0, createPlaceholderPhoto(`placeholder-${i}`, i));
        }
      }

      // Remove any items beyond targetCount
      if (result.length > targetCount) {
        return result.slice(0, targetCount);
      }

      return result;
    },
    [createPlaceholderPhoto]
  );

  // Force reload function for when we genuinely need to reload
  const forceLoadImagesWithCurrentData = useCallback(async () => {
    setLoading(true);
    const currentMoodboard = latestMoodboardRef.current;
    const currentGalleryItems = latestGalleryItemsRef.current;

    const hasMoodboardAssets =
      currentMoodboard.moodboard_assets &&
      currentMoodboard.moodboard_assets.length > 0;

    let loaded: SortablePhoto<Photo>[] = [];

    if (hasMoodboardAssets) {
      loaded = processAssetsToPhotos(
        currentMoodboard.moodboard_assets,
        currentGalleryItems
      );
    }

    // Fill with placeholders
    loaded = fillWithPlaceholders(loaded, noOfImagesForMoodboard);

    if (currentMoodboard.id === currentMoodboardId) {
      setPhotos(loaded);
      setOriginalPhotos([...loaded]);
    }

    setLoading(false);
    setMoodboardGenerationInProgress(false);
  }, [
    currentMoodboardId,
    noOfImagesForMoodboard,
    processAssetsToPhotos,
    fillWithPlaceholders,
  ]);

  // Smart loading function that prevents unnecessary reloads
  const loadImagesWithCurrentData = useCallback(async () => {
    setLoading(true);
    const currentMoodboard = latestMoodboardRef.current;
    const currentGalleryItems = latestGalleryItemsRef.current;

    const hasMoodboardAssets =
      currentMoodboard.moodboard_assets &&
      currentMoodboard.moodboard_assets.length > 0;

    let loaded: SortablePhoto<Photo>[] = [];

    if (hasMoodboardAssets) {
      loaded = processAssetsToPhotos(
        currentMoodboard.moodboard_assets,
        currentGalleryItems
      );
    }

    // Fill with placeholders
    loaded = fillWithPlaceholders(loaded, noOfImagesForMoodboard);

    if (currentMoodboard.id === currentMoodboardId) {
      // Only update photos state if we don't have unsaved changes or aren't currently saving
      // AND if we don't already have loaded photos (prevent unnecessary reloading)
      const hasLoadedPhotos = photos.some(
        (photo) => !photo.is_placeholder && photo.src
      );
      if (!hasUnsavedChanges && !isMoodboardSaving && !hasLoadedPhotos) {
        setPhotos(loaded);
        setOriginalPhotos([...loaded]);
      }
    }

    setLoading(false);
    setMoodboardGenerationInProgress(false);
  }, [
    currentMoodboardId,
    hasUnsavedChanges,
    isMoodboardSaving,
    noOfImagesForMoodboard,
    photos,
    processAssetsToPhotos,
    fillWithPlaceholders,
  ]);

  return {
    photos,
    setPhotos,
    originalPhotos,
    setOriginalPhotos,
    loading,
    moodboardGenerationInProgress,
    setMoodboardGenerationInProgress,
    currentMoodboardId,
    forceLoadImagesWithCurrentData,
    loadImagesWithCurrentData,
    hasUnsavedChanges: useMemo(() => {
      // If both are empty, there are no unsaved changes
      if (photos.length === 0 && originalPhotos.length === 0) {
        return false;
      }

      // If lengths are different, there are changes
      if (photos.length !== originalPhotos.length) {
        return true;
      }

      // Check if order or content has changed
      return photos.some((photo, index) => {
        const originalPhoto = originalPhotos[index];
        return !originalPhoto || photo.id !== originalPhoto.id;
      });
    }, [photos, originalPhotos]),
  };
};
