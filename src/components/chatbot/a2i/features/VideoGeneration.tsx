import { Ripple } from "@/components/magicui/ripple";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Badge } from "@/components/ui/badge";
import { DownloadIcon, ExpandIcon } from "@/components/ui/custom-icon";
import { ITEMS_PER_PAGE, useGalleryQuery } from "@/hooks/useGallery";
import { cn, handleDownloadVideo } from "@/lib/utils";
import { useBrandStore } from "@/store/brand.store";
import { useVideoGenStore } from "@/store/video-gen.store";
import { A2iImageGeneration } from "@/types/types";
import {
  Check,
  CopyIcon,
  HeartIcon,
  PauseCircle,
  PlayCircle,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
    <div className="w-full h-full flex flex-col space-y-4 overflow-hidden mt-0">
      {/* First section: video preview (flex-1 fills available height) */}
      <div className="flex-1 flex min-h-0">
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
      {currentSessionGenerations.length > 0 && (
        <div className="w-full flex-shrink-0 flex flex-col h-36">
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
      )}
    </div>
  );
};

const VideoPlayer = ({
  prompt,
  src,
  isLiked,
  onLike,
}: {
  prompt?: string | null;
  src: string;
  isLiked: boolean;
  onLike: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  const togglePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (err) {
      console.error("Playback failed:", err);
    }
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    video?.requestFullscreen?.();
  };

  const handleCopyPrompt = () => {
    if (prompt) {
      navigator.clipboard
        .writeText(prompt)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success("Prompt copied to clipboard!");
        })
        .catch((error) => {
          console.error("Failed to copy prompt:", error);
          toast.error("Failed to copy prompt");
        });
    }
  };

  const handleDownload = () => {
    handleDownloadVideo(src);
  };

  // Check if there's a prompt available to copy
  const hasPromptToCopy = !!prompt;

  return (
    <div className="relative w-full h-full flex-1 min-h-0 group border">
      <video
        ref={videoRef}
        src={src}
        width={0}
        height={0}
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        muted
        autoPlay
        loop
        playsInline
        onClick={togglePlayPause}
      />

      {/* Overlay gradient that covers the entire video container */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
      </div>

      {/* Play/Pause button - Center */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer rounded-lg z-20 pointer-events-auto"
        onClick={togglePlayPause}
      >
        {isPlaying ? (
          <PauseCircle className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-2xl" />
        ) : (
          <PlayCircle className="w-16 h-16 text-white opacity-100 drop-shadow-2xl" />
        )}
      </div>

      {/* Control buttons container - Always visible within video bounds */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {/* Top Right - Expand button */}
        <div className="absolute top-3 right-3">
          <TooltipIconButton
            onClick={(e) => {
              e.stopPropagation();
              handleFullscreen();
            }}
            tooltip="Expand"
            variant="ghost"
            className="size-8 bg-black/20 backdrop-blur-sm text-white hover:text-white hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 drop-shadow-xl pointer-events-auto border border-white/20"
          >
            <ExpandIcon className="h-4 w-4" />
          </TooltipIconButton>
        </div>

        {/* Bottom Right - Heart/Like button */}
        <div className="absolute bottom-3 right-3">
          <TooltipIconButton
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            tooltip={isLiked ? "Unlike" : "Like"}
            variant="ghost"
            className="size-8 bg-black/20 backdrop-blur-sm text-white hover:text-white hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 drop-shadow-xl pointer-events-auto border border-white/20"
          >
            <HeartIcon
              className={cn("h-4 w-4", {
                "text-red-500 fill-red-500": isLiked,
                "text-white": !isLiked,
              })}
            />
          </TooltipIconButton>
        </div>

        {/* Bottom Left - Download and Copy buttons */}
        <div className="absolute bottom-3 left-3 flex items-center gap-x-2">
          <TooltipIconButton
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            tooltip="Download"
            variant="ghost"
            className="size-8 bg-black/20 backdrop-blur-sm text-white hover:text-white hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 drop-shadow-xl pointer-events-auto border border-white/20"
          >
            <DownloadIcon className="h-4 w-4" />
          </TooltipIconButton>
          {hasPromptToCopy && (
            <TooltipIconButton
              onClick={(e) => {
                e.stopPropagation();
                handleCopyPrompt();
              }}
              tooltip="Copy prompt"
              variant="ghost"
              className="size-8 bg-black/20 backdrop-blur-sm text-white hover:text-white hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 drop-shadow-xl pointer-events-auto border border-white/20"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
            </TooltipIconButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoGeneration;
