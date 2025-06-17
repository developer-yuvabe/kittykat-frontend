import { ContentSection } from "@/components/shared/ContentSection";
import { ThreadCampaign } from "@/types/types";
import React, { useEffect, useState } from "react";
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
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Button } from "@/components/ui/button";
import { analyzeCampaignMoodboard } from "@/services/api/campaign.service";
import { useUserStore } from "@/store/user.store";

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
  moodboard: ManualMoodboardItem[];
  isGenerating: boolean;
  handleGenerateMoodboard: () => Promise<void>;
}

function ManualCampaignMoodboard({
  campaign,
  brandId,
  noOfImagesForMoodboard,
  setNoOfImagesForMoodboard,
  moodboard = [],
  isGenerating = false,
  handleGenerateMoodboard,
}: ManualCampaignMoodboardProps) {
  const [photos, setPhotos] = useState<SortablePhoto<Photo>[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  const { user } = useUserStore();

  const handleAnalyzeMoodboard = async () => {
    try {
      setAnalyzeLoading(true);
      if (user?.id) {
        await analyzeCampaignMoodboard(brandId, campaign.id, {
          user_id: user?.id, // Or use a proper user ID from props/context
          urls: photos.map((p) => p.src),
        });
      }
    } catch (error) {
      console.error("Image analysis failed:", error);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  useEffect(() => {
    const loadImages = async () => {
      if (moodboard.length === 0) {
        setPhotos([]);
        setLoading(false);
        return;
      }

      setLoading(true); // always set loading true before async logic

      const loaded: SortablePhoto<Photo>[] = await Promise.all(
        moodboard
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

      setPhotos(loaded);
      setLoading(false);
    };

    loadImages();
  }, [moodboard]);

  const showGallery = photos.length > 0 && !loading && !isGenerating;

  return (
    <ContentSection
      title="Moodboard"
      context={undefined}
      content={
        <div>
          {(isGenerating || loading) && (
            <div className="w-full flex items-center justify-center py-8">
              <TextShimmer className="w-full max-w-2xl text-center">
                Generating moodboard, please wait...
              </TextShimmer>
            </div>
          )}

          {showGallery ? (
            <div className="w-full flex flex-col gap-y-4">
              <div className="flex justify-end gap-x-3">
                <ImageCountCard
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
                movePhoto={(oldIndex, newIndex) =>
                  setPhotos(arrayMove(photos, oldIndex, newIndex))
                }
                onPhotoLike={(index, liked) => {
                  setPhotos((prev) => {
                    const clone = [...prev];
                    clone[index] = { ...clone[index], liked };
                    return clone;
                  });
                }}
                removedPhoto={(id: string) => {
                  setPhotos((prev) => prev.filter((photo) => photo.id !== id));
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
          ) : !isGenerating ? (
            <div className="w-full flex flex-col gap-y-4">
              <div className="flex justify-end gap-x-3">
                <ImageCountCard
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
          ) : null}
        </div>
      }
    />
  );
}

export default ManualCampaignMoodboard;
