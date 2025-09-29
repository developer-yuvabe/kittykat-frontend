"use client";

import type { MoodboardInformation } from "@/types/types";
import { MoodboardAgentData } from "@/types/moodboard-agent.types";
import MoodboardHeader from "./MoodboardHeader";
import MoodboardGalleryView from "./MoodboardGalleryView";
import { useGalleryQuery } from "@/hooks/useGallery";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";
import {
  useMoodboardData,
  useMoodboardPhotos,
  useMoodboardActions,
  useMoodboardSave,
  useMoodboardLoadingEffects,
} from "./hooks";
import { useBrandStore } from "@/store/brand.store";
import { CarouselDndProvider } from "@/contexts/CarouselDndContext";
import { GalleryItemResponse } from "@/types/gallery.types";
import { toast } from "sonner";
import { forwardRef, useState, useCallback, useRef } from "react";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { CustomGalleryGridRef } from "@/components/gallery/CustomGalleryGrid";

interface MoodboardContentProps {
  moodboard: MoodboardInformation;
  brandId: string;
  carouselHeader?: React.ReactNode;
}

const MoodboardContent = forwardRef<
  CustomGalleryGridRef,
  MoodboardContentProps
>(({ moodboard, brandId, carouselHeader }, ref) => {
  const { isMoodboardSaving, setIsMoodboardSaving } = useBrandStore();
  const { addPinnedMoodboard, pinnedMoodboard } = usePinnedContextStore();

  // State to force re-render of CarouselDndProvider when gallery selection happens
  const [gallerySelectionKey, setGallerySelectionKey] = useState(0);

  // Loading state for screenshot capture and upload
  const [isScreenshotLoading, setIsScreenshotLoading] = useState(false);

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
    handleGallerySelection: originalHandleGallerySelection,
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

  // Wrapper for handleGallerySelection to force re-render of CarouselDndProvider
  const handleGallerySelection = useCallback(
    (selectedItems: GalleryItemResponse[], placeHolderIndex?: number) => {
      originalHandleGallerySelection(selectedItems, placeHolderIndex);
      // Force re-render of CarouselDndProvider by incrementing the key
      setGallerySelectionKey((prev) => prev + 1);
    },
    [originalHandleGallerySelection, setGallerySelectionKey]
  );

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

  // Handle drag-and-drop from carousel to moodboard placeholders
  const handleCarouselItemDrop = (item: GalleryItemResponse) => {
    // Check if the item is already in the moodboard
    const isAlreadyInMoodboard = photos.some((photo) => photo.id === item.id);

    if (isAlreadyInMoodboard) {
      toast.warning("This image is already in your moodboard.");
      return;
    }

    // Use the existing gallery selection logic to handle the drop
    handleGallerySelection([item]);
    toast.success(`Added image to your moodboard!`);
  };

  // Pin moodboard function with campaign and moodboard IDs only
  const handlePinMoodboard = useCallback(async () => {
    if (!photos || photos.length === 0) {
      toast.error("No images available to pin");
      return;
    }

    // Filter out placeholder and empty photos
    const validPhotos = photos.filter(
      (photo) => photo && photo.src && !photo.is_placeholder
    );

    if (validPhotos.length === 0) {
      toast.error("No valid images to pin");
      return;
    }

    setIsScreenshotLoading(true);

    try {
      // Capture screenshot
      const screenshotDataUrl =
        ref && "current" in ref && ref.current?.captureScreenshot
          ? await ref.current.captureScreenshot()
          : null;
      if (!screenshotDataUrl) {
        toast.error("Failed to capture moodboard screenshot");
        return;
      }

      // Convert data URL to blob
      const response = await fetch(screenshotDataUrl);
      const blob = await response.blob();
      const file = new File(
        [blob],
        `moodboard-${moodboard.id}-screenshot.png`,
        {
          type: "image/png",
        }
      );

      // Upload screenshot
      const screenshotUrl = await uploadFileAndReturnUrl(
        `moodboard-${moodboard.id}-screenshot`,
        "image/png",
        "ask-kittykat",
        file,
        brandId,
        moodboard.campaign_id
      );

      // Simplified moodboard data with screenshot URL
      const moodboardData: MoodboardAgentData = {
        moodboard_id: moodboard.id,
        campaign_id: moodboard.campaign_id,
        screenshot_url: screenshotUrl,
      };

      addPinnedMoodboard({
        title: moodboard.title || `Moodboard (${validPhotos.length} images)`,
        moodboard: moodboardData,
      });

      toast.success(
        `Moodboard "${
          moodboard.title || `Moodboard (${validPhotos.length} images)`
        }" pinned to chat!`
      );
    } catch (error) {
      console.error("Failed to pin moodboard with screenshot:", error);
      toast.error("Failed to pin moodboard. Please try again.");
    } finally {
      setIsScreenshotLoading(false);
    }
  }, [
    photos,
    moodboard.id,
    moodboard.title,
    moodboard.campaign_id,
    addPinnedMoodboard,
    ref,
    brandId,
  ]);

  // Don't render if still loading or generation in progress
  if (loading || moodboardGenerationInProgress) {
    return null;
  }

  const isPinned = pinnedMoodboard?.moodboard.moodboard_id === moodboard.id;

  return (
    <CarouselDndProvider
      key={gallerySelectionKey}
      onGalleryItemDrop={handleCarouselItemDrop}
      onSortableMove={movePhoto}
      sortableItems={photos}
    >
      <div className="w-full flex flex-col gap-y-4">
        {carouselHeader}

        <MoodboardHeader
          moodboard={moodboard}
          brandId={brandId}
          isMoodboardSaving={isMoodboardSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          photos={photos}
          isAutoFillLoading={isAutoFillLoading}
          autoFillPlaceholders={autoFillPlaceholders}
          onPinMoodboard={handlePinMoodboard}
          isPinned={isPinned}
          isScreenshotLoading={isScreenshotLoading}
        />

        <MoodboardGalleryView
          ref={ref}
          photos={photos}
          setPhotos={setPhotos}
          movePhoto={movePhoto}
          onPhotoLike={onPhotoLike}
          hasUnsavedChanges={hasUnsavedChanges}
          onGallerySelection={handleGallerySelection}
          moodboard={moodboard}
          galleryActions={galleryActions}
        />
      </div>
    </CarouselDndProvider>
  );
});

MoodboardContent.displayName = "MoodboardContent";

export default MoodboardContent;
