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
import { forwardRef, useState, useCallback } from "react";
import { CustomGalleryGridRef } from "@/components/gallery/CustomGalleryGrid";
import type { Message } from "@langchain/langgraph-sdk";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { useUserStore } from "@/store/user.store";
import { scrollToBottom } from "@/lib/scroll.utils";
import { getPinnedMoodboardContextMessage } from "@/lib/langgraph.utils";
import { generateMoodboardScreenshot } from "@/services/api/moodboard.service";
import type { GenerateMoodboardScreenshotRequest } from "@/types/moodboard.types";

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
  const stream = useStreamContext();
  const { user } = useUserStore();

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

  const [isScreenshotLoading, setIsScreenshotLoading] = useState(false);

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

  // Analyze moodboard function - sends automatic message like brand creation
  const handlePinMoodboard = useCallback(async () => {
    if (!photos || photos.length === 0) {
      toast.error("No images available to analyze");
      setIsScreenshotLoading(false);
      return;
    }

    setIsScreenshotLoading(true);

    try {
      // Prepare screenshot payload
      const assets = photos.map((photo) => ({
        url: photo.src!,
        position: photo.position!,
        is_placeholder: photo.is_placeholder ?? false,
      }));

      const payload: GenerateMoodboardScreenshotRequest = {
        title: moodboard.title,
        assets,
        show_logo: false,
        show_title: false,
        show_footer: false,
      };

      console.log("Screenshot payload:", payload);

      // Generate screenshot using backend API
      const result = await generateMoodboardScreenshot(
        brandId,
        moodboard.campaign_id,
        moodboard.id,
        payload
      );

      const screenshotUrl = result.url;

      // Submit optimistic message with screenshot attachment
      const newMessage: Message = {
        id: `message-${Date.now()}`,
        type: "human",
        content: [
          {
            type: "text",
            text: `Analyze and provide feedback on my moodboard${getPinnedMoodboardContextMessage(
              {
                title: moodboard.title,
                moodboard: {
                  moodboard_id: moodboard.id,
                  campaign_id: moodboard.campaign_id,
                  title: moodboard.title,
                  no_of_images_in_moodboard: photos.length,
                  screenshot_url: screenshotUrl,
                },
              }
            )}`,
          },
          {
            type: "image_url",
            image_url: { url: screenshotUrl },
          },
        ],
      };

      stream.submit(
        {
          messages: [newMessage],
          userId: user!.id,
          currentBrandContextId: brandId,
          previousBrandContextId: stream.values.previousBrandContextId,
        },
        {
          streamMode: ["values"],
          optimisticValues: (prev: any) => ({
            ...prev,
            messages: [...(prev.messages ?? []), newMessage],
          }),
        }
      );

      // Scroll to bottom after sending message
      scrollToBottom(100);

      toast.success(`Moodboard analysis requested!`);
    } catch (error) {
      console.error("Failed to analyze moodboard:", error);
      toast.error(
        `Failed to analyze moodboard: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsScreenshotLoading(false);
    }
  }, [photos, moodboard.id, moodboard.campaign_id, brandId, user?.id]);

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
          onPinMoodboard={handlePinMoodboard}
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
