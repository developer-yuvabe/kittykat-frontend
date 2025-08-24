import { useCallback, useEffect } from "react";
import type { Photo } from "react-photo-album";
import type { MoodboardAsset } from "@/types/types";
import { SortablePhoto } from "@/components/gallery/CustomGalleryContainer";
import {
  patchMoodboard,
  analyzeMoodboard,
} from "@/services/api/moodboard.service";

interface UseMoodboardSaveProps {
  photos: SortablePhoto<Photo>[];
  originalPhotos: SortablePhoto<Photo>[];
  setOriginalPhotos: React.Dispatch<
    React.SetStateAction<SortablePhoto<Photo>[]>
  >;
  brandId: string;
  moodboardId: string;
  campaignId: string;
  hasUnsavedChanges: boolean;
  isMoodboardSaving: boolean;
  setIsMoodboardSaving: (saving: boolean) => void;
}

export const useMoodboardSave = ({
  photos,
  originalPhotos,
  setOriginalPhotos,
  brandId,
  moodboardId,
  campaignId,
  hasUnsavedChanges,
  isMoodboardSaving,
  setIsMoodboardSaving,
}: UseMoodboardSaveProps) => {
  const handleSaveChanges = useCallback(async () => {
    setIsMoodboardSaving(true);
    try {
      // Get current photos at the start of save operation
      const photosAtSaveStart = [...photos];

      // 1. Update moodboard asset positions (including placeholders)
      const updatedAssets: MoodboardAsset[] = photosAtSaveStart.map(
        (photo, index) => ({
          gallery_item_id: photo.id,
          position: index,
          is_placeholder: photo.is_placeholder || false,
        })
      );

      // 2. Persist moodboard asset updates
      await patchMoodboard(brandId, moodboardId, {
        moodboard_assets: updatedAssets,
      });

      // 3. Only update original photos for comparison, don't overwrite current photos
      setOriginalPhotos([...photos]); // Use current photos state, not the saved snapshot

      // Only trigger analyzeMoodboard if the set of asset IDs has changed (ignore order/position)
      const updatedIds = updatedAssets
        .map((asset) => asset.gallery_item_id)
        .sort();
      const originalIds = originalPhotos.map((photo) => photo.id).sort();
      if (JSON.stringify(updatedIds) !== JSON.stringify(originalIds)) {
        await analyzeMoodboard(brandId, campaignId, moodboardId);
      }
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setIsMoodboardSaving(false);
    }
  }, [
    photos,
    originalPhotos,
    setOriginalPhotos,
    brandId,
    moodboardId,
    campaignId,
    setIsMoodboardSaving,
  ]);

  // Auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const intervalId = setInterval(() => {
      if (hasUnsavedChanges && !isMoodboardSaving) {
        handleSaveChanges();
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [hasUnsavedChanges, isMoodboardSaving, handleSaveChanges]);

  return {
    handleSaveChanges,
  };
};
