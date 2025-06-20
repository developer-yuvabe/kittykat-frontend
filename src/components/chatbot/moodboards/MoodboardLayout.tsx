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
import SortableGallery, {
  SortablePhoto,
} from "@/components/gallery/SortableGallery";
import { Photo, RowsPhotoAlbum } from "react-photo-album";
import { arrayMove } from "@dnd-kit/sortable";
import "react-photo-album/rows.css";
import { ImageCountCard } from "@/components/shared/ImageCountCard";
import { MoodboardGallerySelector } from "@/components/chatbot/moodboards/MoodboardGallerySelector";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import {
  analyzeMoodboard,
  createMoodboardForCampaign,
  patchMoodboard,
  replaceMoodboardImage,
} from "@/services/api/moodboard.service";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { useGalleryQuery } from "@/hooks/useGallery";
import ManualMoodboardSkeleton from "./MoodboardSkeleton";

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
}

function MoodboardLayout({
  moodboard,
  brandId,
  noOfImagesForMoodboard,
  setNoOfImagesForMoodboard,
  isGenerating = false,
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

  const { selectedBrandId } = useBrandStore();
  const { user } = useUserStore();

  const { galleryItems } = useGalleryQuery({
    creator: user?.id,
    selectedFilters: {
      moodboards: [moodboard.id],
      brands: [brandId],
      campaigns: [moodboard?.campaign_id],
      product_categories: [],
      asset_types: [],
      asset_sources: [],
      media_format: [],
      aspect_ratio: [],
      workflow_status: [],
    },
  });

  console.log("Moodboard assets:", moodboard.moodboard_assets);
  console.log("Gallery items:", galleryItems);

  // Update refs when values change (but don't trigger re-renders)
  useEffect(() => {
    latestMoodboardRef.current = moodboard;
  }, [moodboard]);

  useEffect(() => {
    latestGalleryItemsRef.current = galleryItems;
  }, [galleryItems]);

  const handleAnalyzeMoodboard = async () => {
    try {
      setAnalyzeLoading(true);

      await analyzeMoodboard(brandId, moodboard.campaign_id, moodboard.id, {
        image_urls: photos.map((photo) => photo.src),
      });
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

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (photos.length !== originalPhotos.length) return true;

    return photos.some((photo, index) => {
      const originalPhoto = originalPhotos[index];
      return (
        !originalPhoto ||
        photo.id !== originalPhoto.id ||
        photo.liked !== originalPhoto.liked
      );
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

    console.log("has ma", hasMoodboardAssets);

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

      console.log("Images to load:", imagesToLoad);

      if (imagesToLoad.length === 0) {
        console.log("No images to load - check if galleryItems are loaded");
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

        console.log("Loaded photos:", loaded);

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
  }, [currentMoodboardId, moodboard?.moodboard_assets?.length]);

  // Trigger load when moodboard status changes or gallery items become available
  useEffect(() => {
    if (
      moodboardStatus.shouldShowCompletedMoodboard &&
      galleryItems.length > 0
    ) {
      const timeoutId = setTimeout(() => {
        loadImagesWithCurrentData();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [
    moodboardStatus.shouldShowCompletedMoodboard,
    galleryItems.length > 0,
    loadImagesWithCurrentData,
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
      moodboardStatus.isMoodboardInProgress
    );
  }, [
    isGenerating,
    loading,
    photos.length,
    moodboardStatus.isMoodboardInProgress,
    moodboard.id,
  ]);

  const showFailedState = moodboardStatus.isMoodboardFailed;

  async function handleGenerateMoodboard(): Promise<void> {
    if (selectedBrandId) {
      console.log("Generate moodboard for:", moodboard.id);
    }
  }

  useEffect(() => {
    console.log("Show gallery:", showGallery);
  }, [showGallery]);

  // Local move photo function (no API call)
  const movePhoto = (oldIndex: number, newIndex: number) => {
    const newPhotos = arrayMove(photos, oldIndex, newIndex);
    setPhotos(newPhotos);
  };

  const removedPhoto = (id: string) => {
    const newPhotos = photos.filter((photo) => photo.id !== id);
    setPhotos(newPhotos);
    setNoOfImagesForMoodboard(newPhotos.length);
  };

  // Local photo like function (no API call)
  const onPhotoLike = (index: number, liked: boolean) => {
    setPhotos((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], liked };
      return updated;
    });
  };

  // Save changes to API
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Update moodboard assets positions
      const updatedAssets: MoodboardAsset[] = photos.map((photo, index) => ({
        gallery_item_id: photo.id,
        position: index,
      }));

      // Update visual style images with like status
      const updatedVisualImages = moodboard.visual_style_images.map((img) => {
        const photo = photos.find((p) => p.id === img.gallery_item_id);
        return photo ? { ...img, is_liked: photo.liked || false } : img;
      });

      await patchMoodboard(brandId, moodboard.id, {
        moodboard_assets: updatedAssets,
        visual_style_images: updatedVisualImages,
      });

      // Update original state to match current state
      setOriginalPhotos([...photos]);

      console.log("Changes saved successfully");
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel changes and revert to original state
  const handleCancelChanges = () => {
    setPhotos([...originalPhotos]);
    setNoOfImagesForMoodboard(originalPhotos.length);
  };

  return (
    <div>
      {moodboard.moodboard_assets.length > 0 &&
        moodboard.style_analysis_status === "completed" && (
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
                    <div className="flex justify-between items-center">
                      <div className="flex gap-x-3">
                        <ImageCountCard
                          disabled
                          maxCount={moodboard?.visual_style_images?.length}
                          imageCount={noOfImagesForMoodboard}
                          onRefresh={async () => {
                            if (selectedBrandId) {
                              setNoOfImagesForMoodboard(
                                noOfImagesForMoodboard + 1
                              );
                              await createMoodboardForCampaign(
                                selectedBrandId,
                                moodboard?.campaign_id,
                                moodboard.id,
                                {
                                  no_of_images: noOfImagesForMoodboard,
                                }
                              );
                            }
                          }}
                          onChange={setNoOfImagesForMoodboard}
                        />
                        <MoodboardGallerySelector
                          brandId={brandId}
                          campaignId={moodboard.campaign_id}
                          moodboardId={moodboard.id}
                        />
                      </div>

                      {/* Save/Cancel Controls */}
                      {hasUnsavedChanges && (
                        <div className="flex gap-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelChanges}
                            disabled={isSaving}
                            className="flex items-center gap-x-1"
                          >
                            <X size={16} />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveChanges}
                            disabled={isSaving}
                            className="flex items-center gap-x-1"
                          >
                            <Save size={16} />
                            {isSaving ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      )}
                    </div>

                    <SortableGallery
                      targetRowHeight={220}
                      gallery={RowsPhotoAlbum}
                      spacing={16}
                      padding={10}
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
                    <Button
                      className="w-full"
                      disabled={analyzeLoading}
                      onClick={handleAnalyzeMoodboard}
                    >
                      {analyzeLoading ? "Analyzing..." : "Analyze Moodboard"}
                    </Button>
                  </div>
                )}
              </div>
            }
          />
        )}

      {/* Empty State */}
      {!showLoadingState && !showFailedState && !showGallery && (
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
