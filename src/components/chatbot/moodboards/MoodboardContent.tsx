"use client";

import type { MoodboardInformation } from "@/types/types";
import MoodboardHeader from "./MoodboardHeader";
import MoodboardGalleryView from "./MoodboardGalleryView";
import { useGalleryQuery } from "@/hooks/useGallery";
import {
  useMoodboardData,
  useMoodboardPhotos,
  useMoodboardActions,
  useMoodboardSave,
  useMoodboardLoadingEffects,
} from "./hooks";
import { useBrandStore } from "@/store/brand.store";

interface MoodboardContentProps {
  moodboard: MoodboardInformation;
  brandId: string;
}

function MoodboardContent({ moodboard, brandId }: MoodboardContentProps) {
  const { isMoodboardSaving, setIsMoodboardSaving } = useBrandStore();

  // Use the data hook to get moodboard data
  const {
    bulkGalleryItems,
    autoFillSuggestions,
    isAutoFillLoading,
    updateAutoFillSuggestionCache,
    noOfImagesForMoodboard,
    setNoOfImagesForMoodboard,
  } = useMoodboardData(moodboard, brandId);

  // Check for unsaved changes - will be calculated in the custom hook
  const tempHasUnsavedChanges = false;

  // Custom hooks for managing photos
  const {
    photos,
    setPhotos,
    originalPhotos,
    setOriginalPhotos,
    loading,
    moodboardGenerationInProgress,
    currentMoodboardId,
    forceLoadImagesWithCurrentData,
    loadImagesWithCurrentData,
    hasUnsavedChanges,
  } = useMoodboardPhotos({
    moodboard,
    bulkGalleryItems,
    noOfImagesForMoodboard,
    hasUnsavedChanges: tempHasUnsavedChanges,
    isMoodboardSaving,
  });

  // Gallery actions
  const galleryActions = useGalleryQuery({
    selectedFilters: {
      brands: [brandId],
      campaigns: [],
      moodboards: [],
      product_categories: [],
      asset_types: [],
      asset_sources: [],
      media_format: [],
      aspect_ratio: [],
      workflow_status: [],
    },
  });

  // Custom hook for photo actions
  const {
    movePhoto,
    onPhotoLike,
    handleGallerySelection,
    autoFillPlaceholders,
  } = useMoodboardActions({
    photos,
    setPhotos,
    setOriginalPhotos,
    noOfImagesForMoodboard,
    setNoOfImagesForMoodboard,
    galleryActions,
    updateAutoFillSuggestionCache,
    autoFillSuggestions,
    isAutoFillLoading,
  });

  // Custom hook for save functionality
  useMoodboardSave({
    photos,
    originalPhotos,
    setOriginalPhotos,
    brandId,
    moodboardId: moodboard.id,
    campaignId: moodboard.campaign_id,
    hasUnsavedChanges,
    isMoodboardSaving,
    setIsMoodboardSaving,
  });

  // Custom hook for loading effects
  useMoodboardLoadingEffects({
    bulkGalleryItems,
    moodboardId: moodboard.id,
    currentMoodboardId,
    hasUnsavedChanges,
    isMoodboardSaving,
    photos,
    loadImagesWithCurrentData,
    forceLoadImagesWithCurrentData,
  });

  // Don't render if still loading or generation in progress
  if (loading || moodboardGenerationInProgress) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-y-4">
      <MoodboardHeader
        moodboard={moodboard}
        brandId={brandId}
        isMoodboardSaving={isMoodboardSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        photos={photos}
        isAutoFillLoading={isAutoFillLoading}
        autoFillPlaceholders={autoFillPlaceholders}
      />

      <MoodboardGalleryView
        photos={photos}
        setPhotos={setPhotos}
        movePhoto={movePhoto}
        onPhotoLike={onPhotoLike}
        hasUnsavedChanges={hasUnsavedChanges}
        onGallerySelection={handleGallerySelection}
        moodboard={moodboard}
      />
    </div>
  );
}

export default MoodboardContent;
