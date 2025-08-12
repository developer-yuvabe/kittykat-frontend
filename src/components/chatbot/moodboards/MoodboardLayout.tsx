import { MoodboardInformation, MoodboardAsset } from "@/types/types";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Photo } from "react-photo-album";
import "react-photo-album/rows.css";
import { Button } from "@/components/ui/button";
import { Loader2, SaveIcon, X } from "lucide-react";
import {
  analyzeMoodboard,
  patchMoodboard,
  getAutoFillMoodboardSuggestedImages,
} from "@/services/api/moodboard.service";
import { toast } from "sonner";
import { RegenerateIcon } from "@/components/ui/custom-icon";
import OptimisticCustomGridGallery, {
  SortablePhoto,
} from "@/components/gallery/CustomGalleryContainer";
import { galleryService } from "@/services/api/gallery.service";
import { useQuery } from "@tanstack/react-query";
import { GalleryItemResponse } from "@/types/gallery.types";
import { useGalleryQuery } from "@/hooks/useGallery";
import EditableInput from "./EditableInput";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [isSaving, setIsSaving] = useState(false);
  const [currentMoodboardId, setCurrentMoodboardId] = useState<string>(
    moodboard?.id
  );

  // Use refs to track the latest values without causing re-renders
  const latestMoodboardRef = useRef(moodboard);
  const latestGalleryItemsRef = useRef<any[]>([]);

  const galleryItemIds = useMemo(() => {
    return (
      moodboard?.moodboard_assets?.map((asset) => asset.gallery_item_id) || []
    );
  }, [moodboard?.moodboard_assets]);

  const { data: bulkGalleryItems = [] } = useQuery({
    queryKey: ["gallery-items-bulk", galleryItemIds],
    queryFn: () => galleryService.getGalleryItemsBulk({ ids: galleryItemIds }),
    enabled: galleryItemIds.length > 0,
    staleTime: 1000 * 60 * 5, // optional: cache for 5 minutes
  });

  // TanStack Query for autofill suggestions - fetch on mount
  const { data: autoFillSuggestions = [], isLoading: isAutoFillLoading } =
    useQuery({
      queryKey: [
        "autofill-suggestions",
        brandId,
        moodboard.campaign_id,
        moodboard.id,
        50,
      ],
      queryFn: () =>
        getAutoFillMoodboardSuggestedImages(
          brandId,
          moodboard.campaign_id,
          moodboard.id,
          50
        ),
      enabled: !!brandId && !!moodboard.campaign_id && !!moodboard.id, // Fetch when all required params are available
      staleTime: 1000 * 60 * 5, // cache for 5 minutes
      retry: 2, // Retry failed requests 2 times
    });

  // Update refs when values change (but don't trigger re-renders)
  useEffect(() => {
    latestMoodboardRef.current = moodboard;
  }, [moodboard]);
  useEffect(() => {
    latestGalleryItemsRef.current = bulkGalleryItems;
  }, [bulkGalleryItems]);

  const handleAnalyzeMoodboard = async () => {
    if (hasUnsavedChanges) {
      await handleSaveChanges();
    }
    try {
      toast.promise(
        analyzeMoodboard(brandId, moodboard.campaign_id, moodboard.id, {
          image_urls: photos.map((photo) => photo.src),
        }),
        {
          loading: "Analyzing moodboard...",
          success: "Moodboard analyzed successfully!",
          error: "Image analysis failed. Please try again.",
        }
      );
    } catch (error) {
      console.error("Image analysis failed:", error);
    }
  };

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

  // Fixed function to load images with proper type matching
  const loadImagesWithCurrentData = useCallback(async () => {
    setLoading(true);
    const currentMoodboard = latestMoodboardRef.current;
    const currentGalleryItems = latestGalleryItemsRef.current;

    const hasMoodboardAssets =
      currentMoodboard.moodboard_assets &&
      currentMoodboard.moodboard_assets.length > 0;

    if (hasMoodboardAssets) {
      const imagesToLoad = currentMoodboard.moodboard_assets
        .map((asset) => {
          const galleryItem: GalleryItemResponse = currentGalleryItems.find(
            (item) => item.id === asset.gallery_item_id
          );

          return {
            id: asset.gallery_item_id,
            asset_url: galleryItem?.asset_url,
            is_liked: galleryItem?.is_favourite || false,
            ignored: galleryItem?.to_ignore || false,
            position: asset.position || 0,
            width: galleryItem?.dimensions?.width || 300,
            height: galleryItem?.dimensions?.height || 300,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (imagesToLoad.length === 0) {
        setPhotos([]);
        setOriginalPhotos([]);
        return;
      }

      const loaded: SortablePhoto<Photo>[] = imagesToLoad
        .sort((a, b) => a.position - b.position)
        .map((item) => ({
          id: item.id,
          src: item.asset_url,
          width: item.width || 300,
          height: item.height || 300,
          alt: `Image ${item.id}`,
          liked: item.is_liked,
        }));

      if (currentMoodboard.id === currentMoodboardId) {
        setPhotos(loaded);
        setOriginalPhotos([...loaded]);
      }

      setLoading(false);
      setMoodboardGenerationInProgress(false);
    } else {
      setPhotos([]);
      setOriginalPhotos([]);
      setLoading(false);
    }
  }, [currentMoodboardId]);

  // Trigger load when moodboard status changes or gallery items become available
  useEffect(() => {
    if (bulkGalleryItems.length > 0) {
      const timeoutId = setTimeout(() => {
        loadImagesWithCurrentData();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [bulkGalleryItems.length, moodboard.id]);

  // Also trigger when moodboard changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadImagesWithCurrentData();
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [moodboard.id, loadImagesWithCurrentData]);

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
    }
  };

  const [moodboardGenerationInProgress, setMoodboardGenerationInProgress] =
    useState(false);

  // Create placeholder items for missing photos
  const [placeholderItems, setPlaceholderItems] = useState<
    SortablePhoto<Photo>[]
  >([]);

  useEffect(() => {
    const placeholders: SortablePhoto<Photo>[] = Array.from(
      { length: Math.max(0, noOfImagesForMoodboard - photos.length) },
      (_, index) => ({
        id: `placeholder-${index}`,
        src: "", // Placeholder image src (empty or a default placeholder image URL)
        width: 300, // Default width
        height: 300, // Default height
        alt: `Placeholder ${index + 1}`,
        liked: false,
        isPlaceholder: true,
        placeholderIndex: photos.length + index,
      })
    );
    setPlaceholderItems(placeholders);
  }, [noOfImagesForMoodboard, photos.length]);

  // Enhanced save function to handle new selections
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Get current photos with pending selections applied
      const currentPhotosWithSelections = [...photos];

      setPlaceholderItems([]);

      setNoOfImagesForMoodboard(photos.length);

      // 1. Update moodboard asset positions
      const updatedAssets: MoodboardAsset[] = currentPhotosWithSelections.map(
        (photo, index) => ({
          gallery_item_id: photo.id,
          position: index,
        })
      );

      // 2. Persist moodboard asset updates
      await patchMoodboard(brandId, moodboard.id, {
        moodboard_assets: updatedAssets,
      });

      // 4. Update local state optimistically
      setPhotos(currentPhotosWithSelections);
      setOriginalPhotos([...currentPhotosWithSelections]);

      toast.success("Moodboard updated successfully!");
    } catch (error) {
      console.error("Failed to save changes:", error);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelChanges = () => {
    // Handle case where there are no original photos (new moodboard)
    if (!originalPhotos || originalPhotos.length === 0) {
      setPhotos([]);
      setOriginalPhotos([]);
      setNoOfImagesForMoodboard(10); // Reset to default
      toast.info("Changes cancelled. Starting fresh.");
      return;
    }

    // Filter out any undefined/null entries from originalPhotos
    const validOriginalPhotos = originalPhotos.filter(
      (photo) => photo && photo.id
    );

    if (validOriginalPhotos.length === 0) {
      setPhotos([]);
      setOriginalPhotos([]);
      setNoOfImagesForMoodboard(10); // Reset to default
      toast.info("Changes cancelled. Starting fresh.");
      return;
    }

    // Revert to original photos, preserving current like status
    const revertedPhotos = validOriginalPhotos.map((originalPhoto) => {
      const currentPhoto = photos.find((p) => p && p.id === originalPhoto.id);
      return {
        ...originalPhoto,
        liked: currentPhoto?.liked ?? originalPhoto.liked,
      };
    });

    setPhotos(revertedPhotos);
    setOriginalPhotos([...revertedPhotos]);
    setNoOfImagesForMoodboard(revertedPhotos.length || 10);
    toast.success("Changes cancelled. Reverted to last saved state.");
  };

  // Handle gallery item selection for placeholders
  const handleGallerySelection = useCallback(
    (selectedItems: GalleryItemResponse[]) => {
      const placeholderStartIndex = photos.length;

      setPhotos((prevPhotos) => {
        const updatedPhotos = [...prevPhotos];
        selectedItems.forEach((item, index) => {
          updatedPhotos[placeholderStartIndex + index] = {
            id: item.id,
            src: item.asset_url,
            width: item.dimensions?.width || 300,
            height: item.dimensions?.height || 300,
            alt: `Image ${item.id}`,
            liked: item.is_favourite || false,
          };
        });
        return updatedPhotos;
      });

      setNoOfImagesForMoodboard(photos.length + selectedItems.length);
    },
    [photos.length]
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
    const availableItems = autoFillSuggestions.filter(
      (item) => !photos.some((photo) => photo.id === item.id)
    );

    if (availableItems.length === 0) {
      toast.warning("All suggested images are already in your moodboard.");
      return;
    }

    setPhotos((prevPhotos) => {
      const updatedPhotos = [...prevPhotos];

      // Determine how many placeholders we have
      const placeholdersToFill = placeholderItems.length;

      availableItems.slice(0, placeholdersToFill).forEach((item, idx) => {
        const targetIndex = prevPhotos.length + idx;
        updatedPhotos[targetIndex] = {
          id: item.id,
          src: item.asset_url,
          width: item.dimensions?.width || 300,
          height: item.dimensions?.height || 300,
          alt: `Image ${item.id}`,
          liked: item.is_favourite || false,
        };
      });

      return updatedPhotos;
    });

    toast.success(
      `Added ${Math.min(
        availableItems.length,
        placeholderItems.length
      )} suggested images to your moodboard.`
    );
  }, [isAutoFillLoading, autoFillSuggestions, photos, placeholderItems]);

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
                    {hasUnsavedChanges ? (
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
                  {/* Cancel Button - middle */}
                  {hasUnsavedChanges && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleCancelChanges}
                      disabled={isSaving}
                      className="flex items-center gap-1 py-1 whitespace-nowrap"
                    >
                      <X size={16} />
                      Cancel
                    </Button>
                  )}

                  {/* Save Button - rightmost */}
                  {hasUnsavedChanges && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0} className="inline-flex">
                          <button
                            onClick={handleAnalyzeMoodboard}
                            disabled={isSaving || photos.length < 10}
                            className="flex items-center gap-1 whitespace-nowrap border border-gray-400 rounded-md px-3 py-[7px] text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <SaveIcon size={16} className="text-gray-700" />
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                        </span>
                      </TooltipTrigger>
                      {photos.length < 10 && (
                        <TooltipContent>
                          Add at least 10 images to save
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )}

                  {/* AutoFill All Button - leftmost */}
                  {placeholderItems.length > 0 && (
                    <Button
                      size="lg"
                      disabled={isSaving || isAutoFillLoading}
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
                <OptimisticCustomGridGallery
                  photos={photos}
                  setPhotos={setPhotos}
                  movePhoto={movePhoto}
                  onPhotoLike={onPhotoLike}
                  hasUnsavedChanges={hasUnsavedChanges}
                  noOfImagesForMoodboard={noOfImagesForMoodboard}
                  setNoOfImagesForMoodboard={setNoOfImagesForMoodboard}
                  onGallerySelection={handleGallerySelection}
                  placeholderItems={placeholderItems as SortablePhoto<Photo>[]}
                  moodboard={moodboard}
                  setPlaceholderItems={setPlaceholderItems}
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
