import { VideoPlayer } from "@/app/(main)/gallery/_components/AskKittykatImageSection";
import { Ripple } from "@/components/magicui/ripple";
import { Badge } from "@/components/ui/badge";
import { ITEMS_PER_PAGE, useGalleryQuery } from "@/hooks/useGallery";
import { cn } from "@/lib/utils";
import { useBrandStore } from "@/store/brand.store";
import { useVideoGenStore } from "@/store/video-gen.store";
import { A2iImageGeneration } from "@/types/types";
import { Video } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type VideoGenerationOnProps = {
  baseImage: string;
  closeDialog: () => void;
  campaignId?: string | null;
};

const VideoGeneration = ({}: VideoGenerationOnProps) => {
  const { selectedBrandId } = useBrandStore();
  const galleryActions = useGalleryQuery(
    {
      selectedFilters: {
        brands: [selectedBrandId!],
        campaigns: [],
        moodboards: [],
        product_categories: [],
        asset_types: [],
        asset_sources: [],
        media_format: [],
        aspect_ratio: [],
        workflow_status: [],
      },
    },
    ITEMS_PER_PAGE,
    true,
    "A2iImageCard"
  );
  const [currentVideoItem, setCurrentVideoItem] =
    useState<A2iImageGeneration>();
  const { currentSessionGenerationIds, generations } = useVideoGenStore();

  const currentSessionGenerations = useMemo(() => {
    return generations.filter(
      (gen) =>
        gen.type === "video" && currentSessionGenerationIds.includes(gen.id)
    );
  }, [currentSessionGenerationIds, generations]);

  // Centralized like handler
  const handleLike = () => {
    if (!currentVideoItem || !currentVideoItem.video) return;

    const newFavoriteState = !currentVideoItem.video.is_liked;

    // Optimistically update the UI immediately
    setCurrentVideoItem((prev) =>
      prev
        ? {
            ...prev,
            video: {
              ...prev.video!,
              is_liked: newFavoriteState,
            },
          }
        : prev
    );

    // Show immediate feedback to user
    toast.success(
      newFavoriteState ? "Added to favorites" : "Removed from favorites"
    );

    // Update on server
    galleryActions.patchItem(
      {
        itemId: currentVideoItem.video.id,
        data: { is_favourite: newFavoriteState },
      },
      {
        onError: (error) => {
          // Revert the optimistic update
          setCurrentVideoItem((prev) =>
            prev
              ? {
                  ...prev,
                  video: {
                    ...prev.video!,
                    is_liked: !newFavoriteState,
                  },
                }
              : prev
          );

          console.error("Failed to update favorite status:", error);
          toast.error("Failed to update favorite status");
        },
      }
    );
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4 overflow-hidden">
      {/* First section: video preview (flex-1 fills available height) */}
      <div className="flex-1 flex">
        <div
          className={cn("w-full", {
            "flex items-center justify-center bg-accent border border-dashed":
              !currentVideoItem,
          })}
        >
          {currentVideoItem ? (
            <VideoPlayer
              src={currentVideoItem.video!.url}
              isLiked={currentVideoItem.video!.is_liked || false}
              onLike={handleLike}
              prompt={currentVideoItem.parameters.prompt || null}
            />
          ) : (
            <div className="flex flex-col items-center gap-y-2">
              <Video />
              <p className="text-sm text-muted-foreground">
                Video preview will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Second section: horizontal scroll thumbnails */}
      <div className="w-full">
        <div className="w-full overflow-x-auto flex items-center gap-x-2">
          {currentSessionGenerations.map((gen) => (
            <div key={gen.id} className="h-32 w-32 cursor-pointer shrink-0">
              {gen.status === "completed" && gen.video ? (
                <video
                  src={gen.video.url}
                  className="w-32 h-32 object-cover"
                  onClick={() => {
                    if (gen && gen.video) {
                      setCurrentVideoItem(gen);
                    }
                  }}
                />
              ) : gen.status === "failed" ? (
                <div className="bg-gradient-to-r from-destructive/30 via-destructive/20 to-destructive/30 animate-none w-32 h-32 flex items-center justify-center">
                  <Badge className="bg-destructive/40 text-destructive border-destructive text-destructive-foreground">
                    Failed
                  </Badge>
                </div>
              ) : gen.status === "processing" ? (
                <div className="w-32 h-32 relative">
                  <Ripple numCircles={8} mainCircleSize={10} />
                  <div className="flex flex-col items-center justify-center gap-2 h-full ">
                    <p className="text-xs text-center overflow-hidden text-ellipsis line-clamp-2 max-h-40">
                      {gen.parameters.prompt}
                    </p>

                    <div className="flex gap-4">
                      {(gen.parameters.start_image ||
                        gen.parameters.first_frame) && (
                        <img
                          src={
                            gen.parameters.start_image ||
                            gen.parameters.first_frame
                          }
                          className="w-12 h-12 object-cover rounded-md"
                        />
                      )}
                      {(gen.parameters.end_image ||
                        gen.parameters.last_frame) && (
                        <img
                          src={
                            gen.parameters.end_image ||
                            gen.parameters.last_frame
                          }
                          className="w-12 h-12 object-cover rounded-md"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoGeneration;
