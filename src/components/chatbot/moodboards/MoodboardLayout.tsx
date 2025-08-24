"use client";

import type { MoodboardInformation } from "@/types/types";
import type React from "react";
import { useMemo } from "react";
import "react-photo-album/rows.css";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { patchMoodboard } from "@/services/api/moodboard.service";
import { RegenerateIcon } from "@/components/ui/custom-icon";
import { galleryService } from "@/services/api/gallery.service";
import { useQuery } from "@tanstack/react-query";
import { useGalleryQuery } from "@/hooks/useGallery";
import { useMoodboardQuery } from "@/hooks/useMoodboardQuery";
import EditableInput from "./EditableInput";
import { useBrandStore } from "@/store/brand.store";
import CustomGalleryContainer from "@/components/gallery/CustomGalleryContainer";

// Import custom hooks
import {
  useMoodboardPhotos,
  useMoodboardActions,
  useMoodboardSave,
  useMoodboardLoadingEffects,
} from "./hooks";

interface MoodboardLayoutProps {
  moodboard: MoodboardInformation;
  brandId: string;
  noOfImagesForMoodboard: number;
  setNoOfImagesForMoodboard: React.Dispatch<React.SetStateAction<number>>;
  showAdvancedSettings: boolean;
  setShowAdvancedSettings: React.Dispatch<React.SetStateAction<boolean>>;
}

function MoodboardLayout({
  moodboard,
  brandId,
  noOfImagesForMoodboard,
  setNoOfImagesForMoodboard,
  showAdvancedSettings,
  setShowAdvancedSettings,
}: MoodboardLayoutProps) {
  const { isMoodboardSaving, setIsMoodboardSaving } = useBrandStore();

  // Gallery item IDs for bulk fetch
  const galleryItemIds = useMemo(() => {
    return (
      moodboard?.moodboard_assets?.map((asset) => asset.gallery_item_id) || []
    );
  }, [moodboard?.moodboard_assets]);

  // Get only non-placeholder IDs for API call
  const nonPlaceholderIds = useMemo(() => {
    return galleryItemIds.filter((id) => !String(id).startsWith("placeholder"));
  }, [galleryItemIds]);

  // Bulk gallery items query
  const { data: bulkGalleryItems = [] } = useQuery({
    queryKey: ["gallery-items-bulk", nonPlaceholderIds],
    queryFn: () =>
      galleryService.getGalleryItemsBulk({
        ids: nonPlaceholderIds,
      }),
    enabled: nonPlaceholderIds.length > 0,
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });

  // TanStack Query for autofill suggestions
  const {
    data: autoFillSuggestions = [],
    isLoading: isAutoFillLoading,
    updateAutoFillSuggestionCache,
  } = useMoodboardQuery({
    brandId,
    campaignId: moodboard.campaign_id,
    moodboardId: moodboard.id,
    count: 50,
  });

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
    hasUnsavedChanges: tempHasUnsavedChanges, // Pass temp value initially
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

  return (
    <div className="mt-4">
      <div>
        {/* Completed Gallery State */}
        {!loading && !moodboardGenerationInProgress && (
          <div className="w-full flex flex-col gap-y-4">
            {/* IMPROVED RESPONSIVE CONTROLS LAYOUT */}
            <div className="w-full flex flex-col gap-3">
              {/* Top row - Title, Save Indicator, and Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full items-start sm:items-center">
                {/* Left side - Title and Save Indicator */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 flex-1 min-w-0">
                  <div className="min-w-[200px]">
                    <EditableInput
                      value={moodboard.title}
                      onSave={async (newValue) => {
                        await patchMoodboard(brandId, moodboard.id, {
                          title: newValue,
                        });
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {isMoodboardSaving ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                        <span className="text-sm">Syncing</span>
                      </>
                    ) : hasUnsavedChanges ? (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-sm">Unsaved changes</span>
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm">Saved</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right side - Action Buttons (from right to left: Save, Cancel, AutoFill All) */}
                <div className="flex gap-2 items-center justify-end">
                  {/* AutoFill All Button - leftmost */}
                  {photos.some((photo) => photo.is_placeholder) && (
                    <Button
                      size="lg"
                      disabled={isAutoFillLoading}
                      className="flex items-center gap-1 py-1 whitespace-nowrap"
                      onClick={autoFillPlaceholders}
                    >
                      {isAutoFillLoading ? (
                        <>
                          <span>Autofill All</span>
                          <Loader2 className="animate-spin text-white" />
                        </>
                      ) : (
                        <>
                          <RegenerateIcon color="white" />
                          <span>Autofill All</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Image Grid */}
            <div className="w-full overflow-hidden">
              <div className="mx-auto max-w-7xl w-full px-2">
                <CustomGalleryContainer
                  items={photos.map((photo, index) => ({
                    id: photo.id,
                    src: photo.src,
                    width: photo.width,
                    height: photo.height,
                    alt: photo.alt,
                    liked: photo.liked,
                    is_placeholder: photo.is_placeholder,
                    position: index,
                  }))}
                  setItems={(newItems) => {
                    if (typeof newItems === "function") {
                      setPhotos((prev) => {
                        const currentItems = prev.map((photo, index) => ({
                          id: photo.id,
                          src: photo.src,
                          width: photo.width,
                          height: photo.height,
                          alt: photo.alt,
                          liked: photo.liked,
                          is_placeholder: photo.is_placeholder,
                          position: index,
                        }));
                        const updated = newItems(currentItems);
                        return updated.map((item) => ({
                          id: item.id,
                          src: item.src || "",
                          width: item.width,
                          height: item.height,
                          alt: item.alt || "",
                          liked: item.liked,
                          is_placeholder: item.is_placeholder,
                        }));
                      });
                    } else {
                      setPhotos(
                        newItems.map((item) => ({
                          id: item.id,
                          src: item.src || "",
                          width: item.width,
                          height: item.height,
                          alt: item.alt || "",
                          liked: item.liked,
                          is_placeholder: item.is_placeholder,
                        }))
                      );
                    }
                  }}
                  movePhoto={movePhoto}
                  onPhotoLike={onPhotoLike}
                  hasUnsavedChanges={hasUnsavedChanges}
                  noOfImagesForMoodboard={noOfImagesForMoodboard}
                  setNoOfImagesForMoodboard={setNoOfImagesForMoodboard}
                  onGallerySelection={handleGallerySelection}
                  moodboard={moodboard}
                  showAdvancedSettings={showAdvancedSettings}
                  setShowAdvancedSettings={setShowAdvancedSettings}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MoodboardLayout;
