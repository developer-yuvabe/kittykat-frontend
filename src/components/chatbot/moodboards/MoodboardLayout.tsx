"use client";

import type { MoodboardInformation, MoodboardAsset } from "@/types/types";
import type React from "react";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import type { Photo } from "react-photo-album";
import "react-photo-album/rows.css";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  analyzeMoodboard,
  patchMoodboard,
} from "@/services/api/moodboard.service";
import { toast } from "sonner";
import { RegenerateIcon } from "@/components/ui/custom-icon";

import { galleryService } from "@/services/api/gallery.service";
import { useQuery } from "@tanstack/react-query";
import type { GalleryItemResponse } from "@/types/gallery.types";
import { useGalleryQuery } from "@/hooks/useGallery";
import { useMoodboardQuery } from "@/hooks/useMoodboardQuery";
import type { AutoFillSuggestedImage } from "@/types/moodboard.types";
import EditableInput from "./EditableInput";
import { useBrandStore } from "@/store/brand.store";
import CustomGalleryContainer, {
  SortablePhoto,
} from "@/components/gallery/CustomGalleryContainer";

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
  const [photos, setPhotos] = useState<SortablePhoto<Photo>[]>([]);
  const [originalPhotos, setOriginalPhotos] = useState<SortablePhoto<Photo>[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  const [currentMoodboardId, setCurrentMoodboardId] = useState<string>(
    moodboard?.id
  );

  const { isMoodboardSaving, setIsMoodboardSaving } = useBrandStore();

  // Use refs to track the latest values without causing re-renders
  const latestMoodboardRef = useRef(moodboard);
  const latestGalleryItemsRef = useRef<any[]>([]);

  const galleryItemIds = useMemo(() => {
    return (
      moodboard?.moodboard_assets?.map((asset) => asset.gallery_item_id) || []
    );
  }, [moodboard?.moodboard_assets]);

  // Get only non-placeholder IDs for API call
  const nonPlaceholderIds = useMemo(() => {
    return galleryItemIds.filter((id) => !String(id).startsWith("placeholder"));
  }, [galleryItemIds]);

  const { data: bulkGalleryItems = [] } = useQuery({
    queryKey: ["gallery-items-bulk", nonPlaceholderIds],
    queryFn: () =>
      galleryService.getGalleryItemsBulk({
        ids: nonPlaceholderIds,
      }),
    enabled: nonPlaceholderIds.length > 0,
    staleTime: 1000 * 60 * 5, // optional: cache for 5 minutes
  });

  // TanStack Query for autofill suggestions - fetch on mount
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

  // Update refs when values change (but don't trigger re-renders)
  useEffect(() => {
    latestMoodboardRef.current = moodboard;
  }, [moodboard]);
  useEffect(() => {
    latestGalleryItemsRef.current = bulkGalleryItems;
  }, [bulkGalleryItems]);

  // Fixed: Check if there are unsaved changes (excluding like status)
  const hasUnsavedChanges = useMemo(() => {
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
  }, [photos, originalPhotos]);

  // Reset state when moodboard changes
  useEffect(() => {
    if (moodboard.id !== currentMoodboardId) {
      setPhotos([]);
      setOriginalPhotos([]);
      setLoading(false);
      setCurrentMoodboardId(moodboard.id);
    }
  }, [moodboard.id, currentMoodboardId]);

  // Add a force reload function for when we genuinely need to reload
  const forceLoadImagesWithCurrentData = useCallback(async () => {
    setLoading(true);
    const currentMoodboard = latestMoodboardRef.current;
    const currentGalleryItems = latestGalleryItemsRef.current;

    const hasMoodboardAssets =
      currentMoodboard.moodboard_assets &&
      currentMoodboard.moodboard_assets.length > 0;

    let loaded: SortablePhoto<Photo>[] = [];

    if (hasMoodboardAssets) {
      const imagesToLoad = currentMoodboard.moodboard_assets
        .map((asset) => {
          // Check if this is a placeholder
          if (String(asset.gallery_item_id).startsWith("placeholder")) {
            return {
              id: asset.gallery_item_id,
              src: "", // Empty for placeholder
              is_liked: false,
              ignored: false,
              position: asset.position || 0,
              width: 300,
              height: 300,
              is_placeholder: true,
            };
          }

          const galleryItem: GalleryItemResponse = currentGalleryItems.find(
            (item) => item.id === asset.gallery_item_id
          );

          // If gallery item is not found, render as placeholder
          if (!galleryItem) {
            return {
              id: `placeholder-${asset.position || 0}`,
              src: "",
              is_liked: false,
              ignored: false,
              position: asset.position || 0,
              width: 300,
              height: 300,
              is_placeholder: true,
            };
          }

          return {
            id: asset.gallery_item_id,
            src: galleryItem?.asset_url || "",
            is_liked: galleryItem?.is_favourite || false,
            ignored: galleryItem?.to_ignore || false,
            position: asset.position || 0,
            width: galleryItem?.dimensions?.width || 300,
            height: galleryItem?.dimensions?.height || 300,
            is_placeholder: false,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      loaded = imagesToLoad
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          id: item.id,
          src: item.src,
          width: item.width || 300,
          height: item.height || 300,
          alt: `Image ${item.id}`,
          liked: item.is_liked,
          is_placeholder: item.is_placeholder,
        }));
    }

    // Fill missing positions with placeholders up to noOfImagesForMoodboard
    for (let i = 0; i < noOfImagesForMoodboard; i++) {
      const existingItem = loaded.find((item, index) => index === i);
      if (!existingItem) {
        loaded.splice(i, 0, {
          id: `placeholder-${i}`,
          src: "",
          width: 300,
          height: 300,
          alt: `Placeholder ${i + 1}`,
          liked: false,
          is_placeholder: true,
        });
      }
    }

    // Remove any items beyond noOfImagesForMoodboard
    if (loaded.length > noOfImagesForMoodboard) {
      loaded = loaded.slice(0, noOfImagesForMoodboard);
    }

    if (currentMoodboard.id === currentMoodboardId) {
      setPhotos(loaded);
      setOriginalPhotos([...loaded]);
    }

    setLoading(false);
    setMoodboardGenerationInProgress(false);
  }, [currentMoodboardId, noOfImagesForMoodboard]);

  // Fixed function to load images with proper type matching
  const loadImagesWithCurrentData = useCallback(async () => {
    setLoading(true);
    const currentMoodboard = latestMoodboardRef.current;
    const currentGalleryItems = latestGalleryItemsRef.current;

    const hasMoodboardAssets =
      currentMoodboard.moodboard_assets &&
      currentMoodboard.moodboard_assets.length > 0;

    let loaded: SortablePhoto<Photo>[] = [];

    if (hasMoodboardAssets) {
      const imagesToLoad = currentMoodboard.moodboard_assets
        .map((asset) => {
          // Check if this is a placeholder
          if (String(asset.gallery_item_id).startsWith("placeholder")) {
            return {
              id: asset.gallery_item_id,
              src: "", // Empty for placeholder
              is_liked: false,
              ignored: false,
              position: asset.position || 0,
              width: 300,
              height: 300,
              is_placeholder: true,
            };
          }

          const galleryItem: GalleryItemResponse = currentGalleryItems.find(
            (item) => item.id === asset.gallery_item_id
          );

          // If gallery item is not found, render as placeholder
          if (!galleryItem) {
            return {
              id: `placeholder-${asset.position || 0}`,
              src: "",
              is_liked: false,
              ignored: false,
              position: asset.position || 0,
              width: 300,
              height: 300,
              is_placeholder: true,
            };
          }

          return {
            id: asset.gallery_item_id,
            src: galleryItem?.asset_url || "",
            is_liked: galleryItem?.is_favourite || false,
            ignored: galleryItem?.to_ignore || false,
            position: asset.position || 0,
            width: galleryItem?.dimensions?.width || 300,
            height: galleryItem?.dimensions?.height || 300,
            is_placeholder: false,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      loaded = imagesToLoad
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          id: item.id,
          src: item.src,
          width: item.width || 300,
          height: item.height || 300,
          alt: `Image ${item.id}`,
          liked: item.is_liked,
          is_placeholder: item.is_placeholder,
        }));
    }

    // Fill missing positions with placeholders up to noOfImagesForMoodboard
    for (let i = 0; i < noOfImagesForMoodboard; i++) {
      const existingItem = loaded.find((item, index) => index === i);
      if (!existingItem) {
        loaded.splice(i, 0, {
          id: `placeholder-${i}`,
          src: "",
          width: 300,
          height: 300,
          alt: `Placeholder ${i + 1}`,
          liked: false,
          is_placeholder: true,
        });
      }
    }

    // Remove any items beyond noOfImagesForMoodboard
    if (loaded.length > noOfImagesForMoodboard) {
      loaded = loaded.slice(0, noOfImagesForMoodboard);
    }

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
  ]);

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
    moodboard.id,
    hasUnsavedChanges,
    isMoodboardSaving,
    photos,
  ]);

  // Also trigger when moodboard changes
  useEffect(() => {
    // Don't reload if user has unsaved changes or if currently saving
    if (hasUnsavedChanges || isMoodboardSaving) return;

    // Force reload when moodboard actually changes
    if (currentMoodboardId !== moodboard.id || photos.length === 0) {
      const timeoutId = setTimeout(() => {
        forceLoadImagesWithCurrentData();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [
    moodboard.id,
    currentMoodboardId,
    hasUnsavedChanges,
    isMoodboardSaving,
    photos.length,
    forceLoadImagesWithCurrentData,
  ]);

  // Local move photo function (no API call)
  const movePhoto = (oldIndex: number, newIndex: number) => {
    setPhotos((prevPhotos) => {
      const updated = [...prevPhotos];
      [updated[oldIndex], updated[newIndex]] = [
        updated[newIndex],
        updated[oldIndex],
      ];
      return updated;
    });
  };

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

  // Direct API call for photo like/dislike
  const onPhotoLike = async (index: number, liked: boolean) => {
    const photo = photos[index];

    // Optimistically update the UI
    setPhotos((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], liked };
      return updated;
    });

    setOriginalPhotos((prev) => {
      const updated = [...prev];
      const originalIndex = updated.findIndex((p) => p.id === photo.id);
      if (originalIndex !== -1) {
        updated[originalIndex] = { ...updated[originalIndex], liked };
      }
      return updated;
    });

    // Optimistically update the autofill cache
    updateAutoFillSuggestionCache(photo.id, liked);

    try {
      galleryActions.patchItem({
        itemId: photo.id,
        data: {
          is_favourite: liked,
        },
      });
    } catch (error) {
      console.error("Failed to update photo like status:", error);

      // Revert the optimistic update on error
      setPhotos((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], liked: !liked };
        return updated;
      });

      setOriginalPhotos((prev) => {
        const updated = [...prev];
        const originalIndex = updated.findIndex((p) => p.id === photo.id);
        if (originalIndex !== -1) {
          updated[originalIndex] = { ...updated[originalIndex], liked: !liked };
        }
        return updated;
      });

      // Revert the autofill cache update on error
      updateAutoFillSuggestionCache(photo.id, !liked);
    }
  };

  const [moodboardGenerationInProgress, setMoodboardGenerationInProgress] =
    useState(false);

  const handleSaveChanges = async () => {
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
      await patchMoodboard(brandId, moodboard.id, {
        moodboard_assets: updatedAssets,
      });

      // 3. Only update original photos for comparison, don't overwrite current photos
      setOriginalPhotos([...photos]); // Use current photos state, not the saved snapshot

      //if only assets id changes
      // Only trigger analyzeMoodboard if the set of asset IDs has changed (ignore order/position)
      const updatedIds = updatedAssets
        .map((asset) => asset.gallery_item_id)
        .sort();
      const originalIds = originalPhotos.map((photo) => photo.id).sort();
      if (JSON.stringify(updatedIds) !== JSON.stringify(originalIds)) {
        await analyzeMoodboard(brandId, moodboard.campaign_id, moodboard.id);
      }
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setIsMoodboardSaving(false);
    }
  };

  const handleGallerySelection = useCallback(
    (selectedItems: GalleryItemResponse[], placeholderIndex: number) => {
      setPhotos((prevPhotos) => {
        const updatedPhotos = [...prevPhotos];

        // Replace the specific placeholder or add to a specific position
        if (placeholderIndex < updatedPhotos.length) {
          // Replace placeholder at specific index
          if (selectedItems.length > 0) {
            const item = selectedItems[0]; // Take first item for single placeholder replacement
            updatedPhotos[placeholderIndex] = {
              id: item.id,
              src: item.asset_url,
              width: item.dimensions?.width || 300,
              height: item.dimensions?.height || 300,
              alt: `Image ${item.id}`,
              liked: item.is_favourite || false,
              is_placeholder: false,
            };
          }
        } else {
          // Add to the end if placeholderIndex is beyond current length
          selectedItems.forEach((item) => {
            updatedPhotos.push({
              id: item.id,
              src: item.asset_url,
              width: item.dimensions?.width || 300,
              height: item.dimensions?.height || 300,
              alt: `Image ${item.id}`,
              liked: item.is_favourite || false,
              is_placeholder: false,
            });
          });
        }

        // ✅ Check after updating if total exceeds current noOfImagesForMoodboard
        const newTotal = updatedPhotos.filter(
          (photo) => !photo.is_placeholder
        ).length;
        if (newTotal > noOfImagesForMoodboard) {
          setNoOfImagesForMoodboard(newTotal);
        }

        return updatedPhotos;
      });
    },
    [noOfImagesForMoodboard, setNoOfImagesForMoodboard]
  );

  const autoFillPlaceholders = useCallback(() => {
    if (isAutoFillLoading) {
      toast.warning("AutoFill suggestions are still loading...");
      return;
    }

    if (!autoFillSuggestions || autoFillSuggestions.length === 0) {
      toast.warning("No suggested images available. Please try again later.");
      return;
    }

    // Filter out images that are already in the moodboard
    let availableItems = autoFillSuggestions.filter(
      (item: AutoFillSuggestedImage) =>
        !photos.some((photo) => photo.id === item.id)
    );

    // Sort so that items with is_favourite === true come first
    availableItems = availableItems.sort(
      (a: AutoFillSuggestedImage, b: AutoFillSuggestedImage) => {
        if (a.is_favourite === b.is_favourite) return 0;
        return a.is_favourite ? -1 : 1;
      }
    );

    if (availableItems.length === 0) {
      toast.warning("All suggested images are already in your moodboard.");
      return;
    }

    setPhotos((prevPhotos) => {
      const updatedPhotos = [...prevPhotos];

      // Find placeholder items to fill
      const placeholderIndices = updatedPhotos
        .map((photo, index) => ({ photo, index }))
        .filter(({ photo }) => photo.is_placeholder)
        .map(({ index }) => index);

      availableItems
        .slice(0, placeholderIndices.length)
        .forEach((item: AutoFillSuggestedImage, idx: number) => {
          const targetIndex = placeholderIndices[idx];
          updatedPhotos[targetIndex] = {
            id: item.id,
            src: item.asset_url,
            width: item.dimensions?.width || 300,
            height: item.dimensions?.height || 300,
            alt: `Image ${item.id}`,
            liked: item.is_favourite || false,
            is_placeholder: false,
          };
        });

      return updatedPhotos;
    });

    const placeholderCount = photos.filter(
      (photo) => photo.is_placeholder
    ).length;
    toast.success(
      `Added ${Math.min(
        availableItems.length,
        placeholderCount
      )} suggested images to your moodboard.`
    );
  }, [isAutoFillLoading, autoFillSuggestions, photos]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const intervalId = setInterval(() => {
      if (hasUnsavedChanges && !isMoodboardSaving) {
        handleSaveChanges();
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [hasUnsavedChanges, isMoodboardSaving]);

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
                    ...photo,
                    position: index,
                    gallery_item_id: photo.id,
                  }))}
                  setItems={(newItems) => {
                    if (typeof newItems === "function") {
                      setPhotos((prev) => {
                        const currentItems = prev.map((photo, index) => ({
                          ...photo,
                          position: index,
                          gallery_item_id: photo.id,
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
