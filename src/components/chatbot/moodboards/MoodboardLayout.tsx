import { ContentSection } from "@/components/shared/ContentSection";
import { MoodboardInformation, MoodboardAsset } from "@/types/types";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { SubSectionCard } from "../brands/SubSectionCard";
import { SortablePhoto } from "@/components/gallery/SortableGallery";
import { Photo } from "react-photo-album";
import { arrayMove } from "@dnd-kit/sortable";
import "react-photo-album/rows.css";
import { ImageCountCard } from "@/components/shared/ImageCountCard";
import { MoodboardGallerySelector } from "@/components/chatbot/moodboards/MoodboardGallerySelector";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  analyzeMoodboard,
  createMoodboardForCampaign,
  patchMoodboard,
  replaceMoodboardImage,
} from "@/services/api/moodboard.service";
import { useBrandStore } from "@/store/brand.store";
import ManualMoodboardSkeleton from "./MoodboardSkeleton";
import MoodboardSelector from "./MoodboardSelector";
import { toast } from "sonner";
import { AnalysisChartIcon, SaveIcon2 } from "@/components/ui/custom-icon";
import CustomGridGallery from "@/components/gallery/CustomGridGallery";
import { galleryService } from "@/services/api/gallery.service";
import { useQuery } from "@tanstack/react-query";

// Fixed interface to match the data structure
export interface MoodboardAssetItem {
  id: string;
  asset_url: string;
  is_liked: boolean;
  ignored: boolean;
  position: number;
}

interface MoodboardLayoutProps {
  moodboard: MoodboardInformation;
  brandId: string;
  noOfImagesForMoodboard: number;
  setNoOfImagesForMoodboard: (count: number) => void;
  isGenerating: boolean;
  moodboards: MoodboardInformation[];
  selectedMoodboard: MoodboardInformation | null;
  setSelectedMoodboard: (mb: MoodboardInformation | null) => void;
  onNewMoodboard: () => void;
  isCreatingNew: boolean;
  handleGenerateMoodboard: () => Promise<void>;
}

function MoodboardLayout({
  moodboard,
  brandId,
  noOfImagesForMoodboard,
  setNoOfImagesForMoodboard,
  isGenerating = false,
  moodboards,
  selectedMoodboard,
  setSelectedMoodboard,
  onNewMoodboard,
  isCreatingNew,
  handleGenerateMoodboard,
}: MoodboardLayoutProps) {
  const [photos, setPhotos] = useState<SortablePhoto<Photo>[]>([]);
  const [originalPhotos, setOriginalPhotos] = useState<SortablePhoto<Photo>[]>(
    []
  );
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentMoodboardId, setCurrentMoodboardId] = useState<string>(
    moodboard?.id
  );

  // Use refs to track the latest values without causing re-renders
  const latestMoodboardRef = useRef(moodboard);
  const latestGalleryItemsRef = useRef<any[]>([]);

  const { selectedBrandId } = useBrandStore();

  const galleryItemIds = useMemo(() => {
    return (
      moodboard?.moodboard_assets?.map((asset) => asset.gallery_item_id) || []
    );
  }, [moodboard?.moodboard_assets]);

  const {
    data: bulkGalleryItems = [],
    isLoading: isBulkLoading,
    isFetching: isBulkFetching,
  } = useQuery({
    queryKey: ["gallery-items-bulk", galleryItemIds],
    queryFn: () => galleryService.getGalleryItemsBulk({ ids: galleryItemIds }),
    enabled: galleryItemIds.length > 0,
    staleTime: 1000 * 60 * 5, // optional: cache for 5 minutes
  });

  // Update refs when values change (but don't trigger re-renders)
  useEffect(() => {
    latestMoodboardRef.current = moodboard;
  }, [moodboard]);
  useEffect(() => {
    latestGalleryItemsRef.current = bulkGalleryItems;
  }, [bulkGalleryItems]);

  const handleAnalyzeMoodboard = async () => {
    setAnalyzeLoading(true);
    handleSaveChanges();
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

  // Memoize moodboard status checks to prevent unnecessary recalculations
  const moodboardStatus = useMemo(() => {
    const hasMoodboardAssets =
      moodboard.moodboard_assets && moodboard.moodboard_assets.length > 0;
    const isMoodboardCompleted =
      moodboard.moodboard_generation_status === "completed";
    const isMoodboardInProgress =
      moodboard.moodboard_generation_status === "in_progress";
    const isMoodboardFailed =
      moodboard.moodboard_generation_status === "failed";

    return {
      hasMoodboardAssets,
      isMoodboardCompleted,
      isMoodboardInProgress,
      isMoodboardFailed,
      shouldShowCompletedMoodboard: hasMoodboardAssets && isMoodboardCompleted,
    };
  }, [moodboard.moodboard_assets, moodboard.moodboard_generation_status]);

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
    const currentMoodboard = latestMoodboardRef.current;
    const currentGalleryItems = latestGalleryItemsRef.current;

    const hasMoodboardAssets =
      currentMoodboard.moodboard_assets &&
      currentMoodboard.moodboard_assets.length > 0;
    const isMoodboardCompleted =
      currentMoodboard.moodboard_generation_status === "completed";
    const shouldShowCompletedMoodboard =
      hasMoodboardAssets && isMoodboardCompleted;

    if (shouldShowCompletedMoodboard && currentMoodboard.moodboard_assets) {
      const imagesToLoad = currentMoodboard.moodboard_assets
        .map((asset) => {
          // Find the corresponding gallery item using gallery_item_id
          const galleryItem = currentGalleryItems.find(
            (item) => item.id === asset.gallery_item_id
          );

          // Find the corresponding visual style image for like status
          const visualImage = currentMoodboard.visual_style_images?.find(
            (img) => img.gallery_item_id === asset.gallery_item_id
          );

          // Only return if we have a valid gallery item with asset_url
          if (!galleryItem?.asset_url) {
            console.warn(
              `No gallery item found for asset ${asset.gallery_item_id}`
            );
            return null;
          }

          return {
            id: asset.gallery_item_id,
            asset_url: galleryItem.asset_url,
            is_liked: visualImage?.is_liked || false,
            ignored: visualImage?.to_ignore || false,
            position: asset.position || 0,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null); // Type-safe filter

      if (imagesToLoad.length === 0) {
        setPhotos([]);
        setOriginalPhotos([]);
        return;
      }

      // Only set loading if we don't already have photos for this moodboard
      const shouldSetLoading =
        photos.length === 0 || currentMoodboard.id !== currentMoodboardId;
      if (shouldSetLoading) {
        setLoading(true);
      }

      try {
        const loaded = await Promise.all(
          imagesToLoad
            .sort((a, b) => a.position - b.position)
            .map(
              (item) =>
                new Promise<SortablePhoto<Photo>>((resolve) => {
                  const img = new Image();
                  img.src = item.asset_url;
                  img.onload = () => {
                    resolve({
                      id: item.id,
                      src: item.asset_url,
                      width: img.naturalWidth,
                      height: img.naturalHeight,
                      alt: `Image ${item.id}`,
                      liked: item.is_liked,
                    });
                  };
                  img.onerror = () => {
                    console.warn("Could not load image", item.asset_url);
                    resolve({
                      id: item.id,
                      src: item.asset_url,
                      width: 800,
                      height: 600,
                      alt: `Fallback image ${item.id}`,
                      liked: item.is_liked,
                    });
                  };
                })
            )
        );

        // Only update photos if we're still on the same moodboard
        if (currentMoodboard.id === currentMoodboardId) {
          setPhotos(loaded);
          setOriginalPhotos([...loaded]); // Set original state
        }
      } finally {
        if (shouldSetLoading) {
          setLoading(false);
        }
      }
    } else {
      setPhotos([]);
      setOriginalPhotos([]);
    }
  }, [currentMoodboardId, moodboard?.moodboard_assets]);

  // Trigger load when moodboard status changes or gallery items become available
  useEffect(() => {
    if (
      moodboardStatus.shouldShowCompletedMoodboard &&
      bulkGalleryItems.length > 0
    ) {
      const timeoutId = setTimeout(() => {
        loadImagesWithCurrentData();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [
    moodboardStatus.shouldShowCompletedMoodboard,
    bulkGalleryItems.length,
    moodboard.id,
  ]);

  // Also trigger when moodboard changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadImagesWithCurrentData();
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [moodboard.id, loadImagesWithCurrentData]);

  // Improved display logic
  const showGallery = useMemo(() => {
    return (
      photos.length > 0 &&
      !loading &&
      !isGenerating &&
      !moodboardStatus.isMoodboardInProgress &&
      moodboard.id === currentMoodboardId
    );
  }, [
    photos.length,
    loading,
    isGenerating,
    moodboardStatus.isMoodboardInProgress,
    moodboard.id,
    currentMoodboardId,
  ]);

  const showLoadingState = useMemo(() => {
    return (
      isGenerating ||
      (loading && photos.length === 0) ||
      moodboardStatus.isMoodboardInProgress ||
      isBulkFetching ||
      isBulkLoading
    );
  }, [
    isGenerating,
    loading,
    photos.length,
    moodboardStatus.isMoodboardInProgress,
    moodboard.id,
    isBulkFetching,
    isBulkLoading,
  ]);

  const showFailedState = moodboardStatus.isMoodboardFailed;

  // Local move photo function (no API call)
  const movePhoto = (oldIndex: number, newIndex: number) => {
    const newPhotos = arrayMove(photos, oldIndex, newIndex);
    setPhotos(newPhotos);
  };

  const removedPhoto = (id: string) => {
    const newPhotos = photos.filter((photo) => photo.id !== id);
    setPhotos(newPhotos);
    setRemovedPhotoIds((prev) => [...prev, id]);
    setNoOfImagesForMoodboard(newPhotos.length);
  };

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
      // Find the visual style image for this photo
      const visualImage = moodboard.visual_style_images?.find(
        (img) => img.gallery_item_id === photo.id
      );

      if (visualImage) {
        // Update only the visual style images with the new like status
        const updatedVisualImages = moodboard.visual_style_images.map((img) =>
          img.gallery_item_id === photo.id ? { ...img, is_liked: liked } : img
        );

        await patchMoodboard(brandId, moodboard.id, {
          visual_style_images: updatedVisualImages,
        });
      }
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

  // Save changes to API (now only for position changes, not likes)
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Update moodboard assets positions only
      const updatedAssets: MoodboardAsset[] = photos.map((photo, index) => ({
        gallery_item_id: photo.id,
        position: index,
      }));

      // Update visual style images by marking to_ignore based on presence in photos
      const updatedVisualImages = moodboard.visual_style_images.map((img) => ({
        ...img,
        to_ignore: removedPhotoIds.includes(img.gallery_item_id)
          ? true
          : img.to_ignore,
      }));

      await patchMoodboard(brandId, moodboard.id, {
        moodboard_assets: updatedAssets,
        visual_style_images: updatedVisualImages,
      });

      // Update original state to match current state (but preserve like status)
      setOriginalPhotos([...photos]);
    } catch (error) {
      console.error("Failed to save changes:", error);
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
    setRemovedPhotoIds([]);
    setNoOfImagesForMoodboard(revertedPhotos.length);
  };

  return (
    <div>
      {moodboard.moodboard_assets.length > 0 && (
        <ContentSection
          title="Moodboard"
          context={undefined}
          content={
            <div>
              {/* Loading State - for generation, loading, or in_progress */}
              {showLoadingState && (
                <ManualMoodboardSkeleton shimmer showButton={false} />
              )}

              {/* Failed State */}
              {showFailedState && (
                <div className="w-full flex flex-col items-center justify-center py-8 gap-4">
                  <div className="text-center">
                    <p className="text-red-600 font-medium">
                      Moodboard generation failed
                    </p>
                    <p className="text-gray-600 text-sm">Please try again</p>
                  </div>
                  <Button onClick={handleGenerateMoodboard} variant="outline">
                    Try Again
                  </Button>
                  </div>
                )}

                {/* Completed Gallery State */}
                {showGallery && (
                  <div className="w-full flex flex-col gap-y-4">
                    {/* IMPROVED RESPONSIVE CONTROLS LAYOUT */}
                    <div className="w-full flex flex-col gap-3">
                      {/* Top row - Main controls */}
                      <div className="flex flex-col 2xl:flex-row 2xl:flex-wrap gap-3 w-full">
                        <div className="flex flex-col sm:flex-row gap-1 flex-wrap flex-1 min-w-0">
                          <div className="min-w-[200px]">
                            <MoodboardSelector
                              campaignId={moodboard.campaign_id}
                              isCreatingNew={isCreatingNew}
                              moodboards={moodboards}
                              onNewMoodboard={onNewMoodboard}
                              selectedMoodboard={selectedMoodboard}
                              setSelectedMoodboard={setSelectedMoodboard}
                              variant="select"
                              // className="p-2" // Optional: tighten if internal component allows
                            />
                          </div>
                          <div className="min-w-[140px]">
                            <ImageCountCard
                              disabled
                              maxCount={
                                moodboard.visual_style_images.length > 16
                                  ? 16
                                  : moodboard.visual_style_images.length
                              }
                              imageCount={noOfImagesForMoodboard}
                              onRefresh={async () => {
                                handleSaveChanges();
                                if (selectedBrandId) {
                                  const newCount = noOfImagesForMoodboard + 1;
                                  await createMoodboardForCampaign(
                                    selectedBrandId,
                                    moodboard?.campaign_id,
                                    moodboard.id,
                                    {
                                      no_of_images: newCount,
                                    }
                                  );

                                  setNoOfImagesForMoodboard(newCount);
                                }
                              }}
                              onChange={setNoOfImagesForMoodboard}
                              hasUnsavedChanges={false}
                              // className="p-2" // Optional: tighten
                            />
                          </div>
                          <div className="min-w-[160px]">
                            <MoodboardGallerySelector
                              brandId={brandId}
                              campaignId={moodboard.campaign_id}
                              moodboardId={moodboard.id}
                              hasUnsavedChanges={hasUnsavedChanges}
                              inSelectionGalleryIds={photos.map(
                                (photo) => photo.id
                              )}
                              setNoOfImagesForMoodboard={
                                setNoOfImagesForMoodboard
                              }
                              noOfImagesForMoodboard={noOfImagesForMoodboard}
                              assetsLength={moodboard.moodboard_assets.length}
                              handleSaveChanges={handleSaveChanges}
                              // className="p-2" // Optional
                            />
                          </div>
                        </div>

                        {/* Save/Cancel for large screens */}
                        {hasUnsavedChanges && (
                          <div className="hidden 2xl:flex flex-wrap items-start gap-2 ml-auto">
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
                              <SaveIcon2 size={16} />
                              {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
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
                            <SaveIcon2 size={16} />
                            {isSaving ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      )}
                    </div>
                    {/* Image Grid */}
                    <div className="w-full overflow-hidden">
                      <div className="mx-auto max-w-7xl w-full px-2">
                        <CustomGridGallery
                          photos={photos}
                          movePhoto={movePhoto}
                          onPhotoLike={onPhotoLike}
                          removedPhoto={removedPhoto}
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
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      disabled={analyzeLoading}
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
                </div>
              )}
            </div>
          }
        />
      )}

      {/* Empty State */}
      {moodboard.moodboard_assets.length === 0 && (
        <div className="w-full flex flex-col gap-y-4 mt-6">
          <ManualMoodboardSkeleton />

          <>
            <SubSectionCard label="Lighting" />
            <SubSectionCard label="Composition" />
            <SubSectionCard label="Texture" />
            <SubSectionCard label="Setting" />
            <SubSectionCard label="Casting" />
            <SubSectionCard label="Framing" />
          </>
        </div>
      )}
    </div>
  );
}

export default MoodboardLayout;
