import { ContentSection } from "@/components/shared/ContentSection";
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
import { SaveIcon, X } from "lucide-react";
import {
  analyzeMoodboard,
  patchMoodboard,
  replaceMoodboardImage,
} from "@/services/api/moodboard.service";
import { toast } from "sonner";
import {
  AnalysisChartIcon,
  RegenerateIcon,
  SaveIcon2,
} from "@/components/ui/custom-icon";
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

// Fixed interface to match the data structure

interface MoodboardLayoutProps {
  moodboard: MoodboardInformation;
  brandId: string;
  noOfImagesForMoodboard: number;
  setNoOfImagesForMoodboard: React.Dispatch<React.SetStateAction<number>>;
}

function MoodboardLayout({
  moodboard,
  brandId,
  noOfImagesForMoodboard,
  setNoOfImagesForMoodboard,
}: MoodboardLayoutProps) {
  const [photos, setPhotos] = useState<SortablePhoto<Photo>[]>([]);
  const [originalPhotos, setOriginalPhotos] = useState<SortablePhoto<Photo>[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
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

  const { data: bulkGalleryItems = [], isLoading: isBulkLoading } = useQuery({
    queryKey: ["gallery-items-bulk", galleryItemIds],
    queryFn: () => galleryService.getGalleryItemsBulk({ ids: galleryItemIds }),
    enabled: galleryItemIds.length > 0,
    staleTime: 1000 * 60 * 5, // optional: cache for 5 minutes
  });

  console.log("bulkGalleryItems:", bulkGalleryItems);

  // Update refs when values change (but don't trigger re-renders)
  useEffect(() => {
    latestMoodboardRef.current = moodboard;
  }, [moodboard]);
  useEffect(() => {
    latestGalleryItemsRef.current = bulkGalleryItems;
  }, [bulkGalleryItems]);

  const handleAnalyzeMoodboard = async () => {
    setAnalyzeLoading(true);

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
    } finally {
      setAnalyzeLoading(false);
    }
  };

  // Check if there are unsaved changes (excluding like status)
  const hasUnsavedChanges = useMemo(() => {
    if (photos.length !== originalPhotos.length) return true;

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

  console.log("photos1:", photos);
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

    // Also update original photos to keep them in sync for like status
    setOriginalPhotos((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], liked };
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
        updated[index] = { ...updated[index], liked: !liked };
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
    const revertedPhotos = originalPhotos.map((originalPhoto) => {
      const currentPhoto = photos.find((p) => p.id === originalPhoto.id);
      return {
        ...originalPhoto,
        liked: currentPhoto?.liked ?? originalPhoto.liked,
      };
    });

    setPhotos(revertedPhotos);
    setNoOfImagesForMoodboard(revertedPhotos.length || 10);
  };

  // Handle gallery item selection for placeholders
  const handleGallerySelection = useCallback(
    (selectedItems: GalleryItemResponse[], placeHolderIndex: number) => {
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
    },
    [photos.length]
  );

  console.log(moodboard.moodboard_assets);

  return (
    <div className="mt-4">
      <ContentSection
        title="Moodboard"
        context={undefined}
        content={
          <div>
            {/* Completed Gallery State */}
            {!loading && !moodboardGenerationInProgress && (
              <div className="w-full flex flex-col gap-y-4">
                {/* IMPROVED RESPONSIVE CONTROLS LAYOUT */}
                <div className="w-full flex flex-col gap-3">
                  {/* Top row - Main controls */}
                  <div className="flex flex-col 2xl:flex-row 2xl:flex-wrap gap-3 w-full">
                    <div className="flex flex-col sm:flex-row gap-6 flex-wrap flex-1 min-w-0">
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

                    {/* Save/Cancel for large screens */}
                    {hasUnsavedChanges && (
                      <div className="hidden 2xl:flex flex-wrap items-start gap-2 ml-auto">
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0} className="inline-flex">
                              <button
                                onClick={handleSaveChanges}
                                disabled={isSaving || photos.length < 10}
                                className="flex items-center gap-1 whitespace-nowrap border border-gray-400 rounded-md px-3 py-[7px] text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <SaveIcon
                                  size={16}
                                  className="text-gray-700 "
                                />
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
                      </div>
                    )}
                    {placeholderItems.length > 0 && (
                      <Button
                        size="lg"
                        disabled={isSaving}
                        className="flex items-center gap-1 py-1 whitespace-nowrap"
                      >
                        <RegenerateIcon size={16} color="white" />
                        AutoFill All
                      </Button>
                    )}
                  </div>

                  {/* Save/Cancel for small screens */}
                  {hasUnsavedChanges && (
                    <div className="flex 2xl:hidden gap-2 justify-end sm:justify-start flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelChanges}
                        disabled={isSaving}
                        className="flex items-center gap-1 whitespace-nowrap"
                      >
                        <X size={16} />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="flex items-center gap-1 whitespace-nowrap"
                      >
                        <>
                          <SaveIcon2 size={16} />
                          {isSaving ? "Saving..." : "Save Changes"}
                        </>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Image Grid */}
                <div className="w-full overflow-hidden">
                  <div className="mx-auto max-w-7xl w-full px-2">
                    <OptimisticCustomGridGallery
                      photos={photos}
                      setPhotos={setPhotos}
                      movePhoto={movePhoto}
                      onPhotoLike={onPhotoLike}
                      onReplaceImage={async ({
                        imageToReplaceId,
                        replacementImageUrl,
                      }) => {
                        try {
                          await replaceMoodboardImage(
                            brandId,
                            moodboard.campaign_id,
                            moodboard.id,
                            {
                              image_to_replace_id: imageToReplaceId,
                              replacement_image_url: replacementImageUrl,
                            }
                          );
                        } catch (error) {
                          console.error(
                            "Failed to replace moodboard image:",
                            error
                          );
                        }
                      }}
                      hasUnsavedChanges={hasUnsavedChanges}
                      noOfImagesForMoodboard={noOfImagesForMoodboard}
                      setNoOfImagesForMoodboard={setNoOfImagesForMoodboard}
                      onGallerySelection={handleGallerySelection}
                      placeholderItems={
                        placeholderItems as SortablePhoto<Photo>[]
                      }
                      moodboard={moodboard}
                      setPlaceholderItems={setPlaceholderItems}
                    />
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="w-full ">
                      <Button
                        className="w-full"
                        disabled={
                          analyzeLoading ||
                          photos.length < 10 ||
                          hasUnsavedChanges
                        }
                        onClick={handleAnalyzeMoodboard}
                      >
                        {analyzeLoading ? (
                          "Analyzing..."
                        ) : (
                          <>
                            <AnalysisChartIcon /> Moodboard Analysis
                          </>
                        )}
                      </Button>
                    </span>
                  </TooltipTrigger>

                  {/* Tooltip logic */}
                  {analyzeLoading && (
                    <TooltipContent>Analysis in progress...</TooltipContent>
                  )}
                  {!analyzeLoading && photos.length < 10 && (
                    <TooltipContent>
                      Add at least 10 images to analyze
                    </TooltipContent>
                  )}
                  {!analyzeLoading &&
                    photos.length >= 10 &&
                    hasUnsavedChanges && (
                      <TooltipContent>
                        Save changes before analysis
                      </TooltipContent>
                    )}
                </Tooltip>
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}

export default MoodboardLayout;
