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
import { CarouselDndProvider } from "@/contexts/CarouselDndContext";
import { GalleryItemResponse } from "@/types/gallery.types";
import { toast } from "sonner";
import { forwardRef, useState, useCallback, useEffect } from "react";
import { useMoodboardStore } from "@/store/moodboard.store";

interface MoodboardContentProps {
  moodboard: MoodboardInformation;
  brandId: string;
  carouselHeader?: React.ReactNode;
}

const MoodboardContent = forwardRef<HTMLDivElement, MoodboardContentProps>(
  ({ moodboard, brandId, carouselHeader }, ref) => {
    const { isMoodboardSaving, setIsMoodboardSaving } = useBrandStore();
    const { setTriggerMoodboardSave } = useMoodboardStore();

    // State to force re-render of CarouselDndProvider when gallery selection happens
    const [gallerySelectionKey, setGallerySelectionKey] = useState(0);

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
      createPlaceholderPhoto,
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
    // Custom hook for save functionality
    const { handleSaveChanges } = useMoodboardSave({
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

    useEffect(() => {
      setTriggerMoodboardSave(handleSaveChanges);

      return () => {
        setTriggerMoodboardSave(null);
      };
    }, [handleSaveChanges, setTriggerMoodboardSave]);

    const handleClearMoodboard = useCallback(() => {
      const placeholders = Array.from(
        { length: noOfImagesForMoodboard },
        (_, i) => createPlaceholderPhoto(`placeholder-${i}`, i)
      );

      setPhotos(placeholders);

      toast.success("Moodboard cleared successfully");
    }, [noOfImagesForMoodboard, setPhotos, createPlaceholderPhoto]);

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
    const handleCarouselItemDrop = (
      item: GalleryItemResponse,
      placeholderIndex: number
    ) => {
      // Check if the item is already in the moodboard
      const isAlreadyInMoodboard = photos.some((photo) => photo.id === item.id);

      if (isAlreadyInMoodboard) {
        toast.warning("This image is already in your moodboard.");
        return;
      }

      // Use the existing gallery selection logic to handle the drop with specific placeholder index
      handleGallerySelection([item], placeholderIndex);
      toast.success(`Added image to your moodboard!`);
    };

    // Don't render if still loading or generation in progress
    if (loading || moodboardGenerationInProgress) {
      return null;
    }

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
            clearMoodboard={handleClearMoodboard}
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
  }
);

MoodboardContent.displayName = "MoodboardContent";

export default MoodboardContent;
