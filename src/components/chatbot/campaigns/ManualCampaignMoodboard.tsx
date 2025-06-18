import { ContentSection } from "@/components/shared/ContentSection";
import { ThreadCampaign } from "@/types/types";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import ManualMoodboardSkeleton from "./ManualMoodboardSkeleton";
import { SubSectionCard } from "../brands/SubSectionCard";
import SortableGallery, {
  SortablePhoto,
} from "@/components/gallery/SortableGallery";
import { Photo, RowsPhotoAlbum } from "react-photo-album";
import { arrayMove } from "@dnd-kit/sortable";
import "react-photo-album/rows.css";
import { ImageCountCard } from "@/components/shared/ImageCountCard";
import { UploadInput } from "@/components/shared/UploadInput";
import { Button } from "@/components/ui/button";
import {
  analyzeCampaignMoodboard,
  createManualMoodboardForCampaign,
  patchVisualImage,
  replaceManualMoodboardImage,
  updateManualMoodboardAssets,
} from "@/services/api/campaign.service";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { useGalleryQuery } from "@/hooks/useGallery";
import { toast } from "sonner";

export interface ManualMoodboardItem {
  id: string;
  asset_url: string;
  is_liked: boolean;
  ignored: boolean;
  position: number;
}

interface ManualCampaignMoodboardProps {
  campaign: ThreadCampaign;
  brandId: string;
  noOfImagesForMoodboard: number;
  setNoOfImagesForMoodboard: (count: number) => void;
  isGenerating: boolean;
}

function ManualCampaignMoodboard({
  campaign,
  brandId,
  noOfImagesForMoodboard,
  setNoOfImagesForMoodboard,
  isGenerating = false,
}: ManualCampaignMoodboardProps) {
  const [photos, setPhotos] = useState<SortablePhoto<Photo>[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [currentCampaignId, setCurrentCampaignId] = useState<string>(
    campaign.id
  );

  // Use refs to track the latest values without causing re-renders
  const latestCampaignRef = useRef(campaign);
  const latestGalleryItemsRef = useRef<any[]>([]);

  const { selectedBrandId } = useBrandStore();
  const { user } = useUserStore();

  const { galleryItems } = useGalleryQuery({
    creator: user?.id,
    selectedFilters: {
      brands: [selectedBrandId || ""],
      campaigns: [campaign.id],
      product_categories: [],
      asset_types: [],
      asset_sources: [],
      media_format: [],
      aspect_ratio: [],
      workflow_status: [],
    },
  });

  // Update refs when values change (but don't trigger re-renders)
  useEffect(() => {
    latestCampaignRef.current = campaign;
  }, [campaign]);

  useEffect(() => {
    latestGalleryItemsRef.current = galleryItems;
  }, [galleryItems]);

  const handleAnalyzeMoodboard = async () => {
    try {
      setAnalyzeLoading(true);
      const urls =
        campaign.manual_moodboard_assets
          ?.map((asset) => {
            const galleryItem = galleryItems.find(
              (item) => item.id === asset.id
            );
            return galleryItem?.asset_url;
          })
          .filter((url): url is string => typeof url === "string") || [];

      await analyzeCampaignMoodboard(brandId, campaign.id, {
        urls,
        user_id: user?.id || "",
      });
    } catch (error) {
      console.error("Image analysis failed:", error);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  // Memoize campaign status checks to prevent unnecessary recalculations
  const campaignStatus = useMemo(() => {
    const hasManualMoodboardAssets =
      campaign.manual_moodboard_assets &&
      campaign.manual_moodboard_assets.length > 0;
    const isManualMoodboardCompleted =
      campaign.manual_moodboard_generation_status === "completed";
    const isManualMoodboardInProgress =
      campaign.manual_moodboard_generation_status === "in_progress";
    const isManualMoodboardFailed =
      campaign.manual_moodboard_generation_status === "failed";

    return {
      hasManualMoodboardAssets,
      isManualMoodboardCompleted,
      isManualMoodboardInProgress,
      isManualMoodboardFailed,
      shouldShowCompletedMoodboard:
        hasManualMoodboardAssets && isManualMoodboardCompleted,
    };
  }, [
    campaign.manual_moodboard_assets,
    campaign.manual_moodboard_generation_status,
  ]);

  // Reset state when campaign changes
  useEffect(() => {
    if (campaign.id !== currentCampaignId) {
      setPhotos([]);
      setLoading(false);
      setCurrentCampaignId(campaign.id);
    }
  }, [campaign.id, currentCampaignId]);

  // Separate function to load images using refs
  const loadImagesWithCurrentData = useCallback(async () => {
    const currentCampaign = latestCampaignRef.current;
    const currentGalleryItems = latestGalleryItemsRef.current;

    const hasManualMoodboardAssets =
      currentCampaign.manual_moodboard_assets &&
      currentCampaign.manual_moodboard_assets.length > 0;
    const isManualMoodboardCompleted =
      currentCampaign.manual_moodboard_generation_status === "completed";
    const shouldShowCompletedMoodboard =
      hasManualMoodboardAssets && isManualMoodboardCompleted;

    if (
      shouldShowCompletedMoodboard &&
      currentCampaign.manual_moodboard_assets
    ) {
      const imagesToLoad = currentCampaign.manual_moodboard_assets
        .map((asset) => {
          const galleryItem = currentGalleryItems.find(
            (item) => item.id === asset.id
          );
          const visualImage = currentCampaign.visual_images?.find(
            (img) => img.id === asset.id
          );

          return {
            id: asset.id,
            asset_url: galleryItem?.asset_url || "",
            is_liked: visualImage?.is_liked || false,
            ignored: visualImage?.ignored || false,
            position: asset.position,
          };
        })
        .filter((item) => item.asset_url);

      if (imagesToLoad.length === 0) {
        setPhotos([]);
        return;
      }

      // Only set loading if we don't already have photos for this campaign
      const shouldSetLoading =
        photos.length === 0 || currentCampaign.id !== currentCampaignId;
      if (shouldSetLoading) {
        setLoading(true);
      }

      try {
        const loaded: SortablePhoto<Photo>[] = await Promise.all(
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

        // Only update photos if we're still on the same campaign
        if (currentCampaign.id === currentCampaignId) {
          setPhotos(loaded);
        }
      } finally {
        if (shouldSetLoading) {
          setLoading(false);
        }
      }
    } else {
      setPhotos([]);
    }
  }, [
    currentCampaignId,
    photos.length,
    campaign?.manual_moodboard_assets?.length,
  ]);

  // Trigger load when campaign status changes or gallery items become available
  useEffect(() => {
    if (
      campaignStatus.shouldShowCompletedMoodboard &&
      galleryItems.length > 0
    ) {
      const timeoutId = setTimeout(() => {
        loadImagesWithCurrentData();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [
    campaignStatus.shouldShowCompletedMoodboard,
    galleryItems.length > 0,
    loadImagesWithCurrentData,
  ]);

  // Also trigger when campaign changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadImagesWithCurrentData();
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [campaign.id, loadImagesWithCurrentData]);

  // Improved display logic
  const showGallery = useMemo(() => {
    return (
      photos.length > 0 &&
      !loading &&
      !isGenerating &&
      !campaignStatus.isManualMoodboardInProgress &&
      campaign.id === currentCampaignId
    );
  }, [
    photos.length,
    loading,
    isGenerating,
    campaignStatus.isManualMoodboardInProgress,
    campaign.id,
    currentCampaignId,
  ]);

  const showLoadingState = useMemo(() => {
    return (
      isGenerating ||
      (loading && photos.length === 0) ||
      campaignStatus.isManualMoodboardInProgress
    );
  }, [
    isGenerating,
    loading,
    photos.length,
    campaignStatus.isManualMoodboardInProgress,
  ]);

  const showFailedState = campaignStatus.isManualMoodboardFailed;

  async function handleGenerateMoodboard(): Promise<void> {
    if (selectedBrandId) {
      await createManualMoodboardForCampaign(selectedBrandId, campaign.id, {
        no_of_images: noOfImagesForMoodboard,
      });
    }
  }

  return (
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
              <div className="flex justify-end gap-x-3">
                <ImageCountCard
                  maxCount={campaign?.visual_images?.length}
                  imageCount={noOfImagesForMoodboard}
                  onRefresh={() => handleGenerateMoodboard()}
                  onChange={setNoOfImagesForMoodboard}
                />
                <UploadInput brandId={brandId} campaignId={campaign.id} />
              </div>
              <SortableGallery
                gallery={RowsPhotoAlbum}
                spacing={16}
                padding={10}
                photos={photos}
                movePhoto={async (oldIndex, newIndex) => {
                  const newPhotos = arrayMove(photos, oldIndex, newIndex);
                  setPhotos(newPhotos);

                  const assets = newPhotos.map((photo, index) => ({
                    id: photo.id,
                    position: index,
                  }));

                  try {
                    await updateManualMoodboardAssets(
                      brandId,
                      campaign.id,
                      assets
                    );
                  } catch (error) {
                    console.error(
                      "Failed to update manual moodboard assets:",
                      error
                    );
                  }
                }}
                onPhotoLike={async (index, liked) => {
                  const photo = photos[index];

                  try {
                    setPhotos((prev) => {
                      const updated = [...prev];
                      updated[index] = { ...updated[index], liked };
                      return updated;
                    });

                    await patchVisualImage(brandId, campaign.id, photo.id, {
                      is_liked: liked,
                    });
                  } catch (error) {
                    console.error("Failed to update like status:", error);

                    setPhotos((prev) => {
                      const updated = [...prev];
                      updated[index] = { ...updated[index], liked: !liked };
                      return updated;
                    });
                  }
                }}
                removedPhoto={async (id: string) => {
                  const newPhotos = photos.filter((photo) => photo.id !== id);
                  setNoOfImagesForMoodboard(noOfImagesForMoodboard - 1);
                  setPhotos(newPhotos);

                  const assets = newPhotos.map((photo, index) => ({
                    id: photo.id,
                    position: index,
                  }));

                  try {
                    await updateManualMoodboardAssets(
                      brandId,
                      campaign.id,
                      assets
                    );
                  } catch (error) {
                    console.error(
                      "Failed to update manual moodboard assets after removal:",
                      error
                    );
                  }
                }}
                onReplaceImage={async ({
                  imageToReplaceId,
                  replacementImageUrl,
                }) => {
                  try {
                    const currentImageCount =
                      campaign.visual_images?.length || 0;

                    // if (currentImageCount >= noOfImagesForMoodboard) {
                    //   toast.error(
                    //     "All images for this campaign are currently in use. To update, replace an existing image or add more from the gallery."
                    //   );

                    //   return;
                    // }
                    await replaceManualMoodboardImage(brandId, campaign.id, {
                      image_to_replace_id: imageToReplaceId,
                      replacement_image_url: replacementImageUrl,
                    });
                  } catch (error) {
                    console.error("Failed to replace moodboard image:", error);
                  }
                }}
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

          {/* Empty State */}
          {!showLoadingState && !showFailedState && !showGallery && (
            <div className="w-full flex flex-col gap-y-4">
              <div className="flex justify-end gap-x-3">
                <ImageCountCard
                  maxCount={campaign?.visual_images?.length}
                  imageCount={noOfImagesForMoodboard}
                  onRefresh={() => {}}
                  onChange={setNoOfImagesForMoodboard}
                />
                <UploadInput brandId={brandId} campaignId={campaign.id} />
              </div>
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
      }
    />
  );
}

export default ManualCampaignMoodboard;
