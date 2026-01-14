"use client";

import { MediaLibraryDialog } from "@/components/shared/MediaLibraryDialog";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import {
  DownloadIcon,
  ExpandIcon,
  SelectIcon,
} from "@/components/ui/custom-icon";
import ZoomableImage from "@/components/ui/zoomable-image";
import { useRemixCanvas } from "@/contexts/RemixCanvasContext";
import type { GalleryActions } from "@/hooks/useGallery";
import { cn, handleDownloadVideo } from "@/lib/utils";
import { useBrandStore } from "@/store/brand.store";
import { useModelsStore } from "@/store/models.store";
import type { GalleryItemResponse } from "@/types/gallery.types";
import {
  Check,
  CopyIcon,
  HeartIcon,
  PauseCircle,
  PlayCircle,
  X,
} from "lucide-react";
import type React from "react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import RemixImage from "./RemixImage";
import { useConceptVisualStore } from "@/store/concept-visual.store";
import { ConceptVisualTabs } from "@/types/concept-visual-editor.types";

interface AskKittykatImageSectionProps {
  item: GalleryItemResponse | null;
  galleryActions: GalleryActions;
  revalidateGalleryItemVersions?: (data: GalleryItemResponse) => Promise<void>;
  setCurrentItem: Dispatch<SetStateAction<GalleryItemResponse | null>>;
  conceptVisualMedia?: boolean;
  currentTab: ConceptVisualTabs;
}

const VideoPlayer: React.FC<{
  prompt?: string | null;
  src: string;
  isLiked: boolean;
  onLike: () => void;
}> = ({ prompt, src, isLiked, onLike }) => {
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
    <div className="relative w-full h-full group overflow-visible rounded-lg flex items-center justify-center">
      {/* Video element with fixed dimensions */}
      <div className="relative max-w-full max-h-[80vh] flex items-center justify-center">
        <video
          ref={videoRef}
          src={src}
          className="object-contain w-auto h-auto max-w-full max-h-[80vh] cursor-pointer rounded-lg"
          muted
          autoPlay
          loop
          playsInline
          onClick={togglePlayPause}
        />

        {/* Overlay gradient that covers the entire video container */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 rounded-lg" />
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
    </div>
  );
};

export const AskKittykatImageSection: React.FC<
  AskKittykatImageSectionProps
> = ({
  item,
  galleryActions,
  revalidateGalleryItemVersions,
  setCurrentItem,
  currentTab,
}) => {
  const {
    brushSize,
    imageRef,
    canvasRef,
    remixImageRef,
    remixHistory,
    offScreenCanvasRef,
  } = useRemixCanvas();
  const { selectedRemixModel } = useModelsStore();
  const { source } = useConceptVisualStore();

  const isRemixEnabled =
    currentTab === "remix" &&
    !!selectedRemixModel &&
    selectedRemixModel.provider === "openai";
  const { selectedBrandId, isBrandsFetched } = useBrandStore();
  const isVideo = item?.asset_type === "video";
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);

  // Centralized like handler
  const handleLike = () => {
    const newFavoriteState = !item?.is_favourite;

    // Optimistically update the UI immediately
    setCurrentItem((prev) => {
      if (!prev || prev.id !== item?.id) return prev;
      return { ...prev, is_favourite: newFavoriteState };
    });

    // Show immediate feedback to user
    toast.success(
      newFavoriteState ? "Added to favorites" : "Removed from favorites"
    );

    // Update on server
    galleryActions.patchItem(
      {
        itemId: item?.id || "",
        data: { is_favourite: newFavoriteState },
      },
      {
        onSuccess: (updatedItem) => {
          // Update the current item with the server response
          setCurrentItem((prev) => {
            if (!prev || prev.id !== updatedItem.id) return prev;
            return {
              ...prev,
              ...updatedItem,
              // Preserve existing comments if server doesn't return complete data
              comments:
                updatedItem.comments && updatedItem.comments.length > 0
                  ? updatedItem.comments
                  : prev.comments,
            };
          });

          // Update the versions cache
          revalidateGalleryItemVersions?.(updatedItem);
        },
        onError: (error) => {
          // Rollback optimistic update on error
          setCurrentItem((prev) => {
            if (!prev || prev.id !== item?.id) return prev;
            return { ...prev, is_favourite: !newFavoriteState }; // Revert to opposite of what we set
          });

          console.error("Failed to update favorite status:", error);
          toast.error("Failed to update favorite status");
        },
      }
    );
  };

  const renderPlaceholder = () => (
    <div
      className={cn("relative", {
        "w-full h-[80vh] bg-muted rounded-lg flex items-center justify-center":
          !item,
      })}
    >
      {!item && (
        <button
          onClick={() => {
            if (isBrandsFetched && selectedBrandId) {
              setGalleryPickerOpen(true);
            }
          }}
          className="w-full h-full border-2 border-dashed flex items-center justify-center text-muted-foreground cursor-pointer flex-col gap-y-2 hover:bg-muted transition-colors rounded-lg"
          disabled={!isBrandsFetched || !selectedBrandId}
        >
          <SelectIcon size={20} />
          <span>Choose from Gallery</span>
        </button>
      )}
      {item &&
        (isRemixEnabled ? (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute -top-8 right-2 bg-muted size-6 hover:text-muted-foreground"
              onClick={() => setCurrentItem(null)}
            >
              <X />
            </Button>
            <RemixImage
              ref={remixImageRef}
              imageRef={imageRef}
              canvasRef={canvasRef}
              offScreenCanvasRef={offScreenCanvasRef}
              url={item.asset_url}
              remixHistory={remixHistory}
              brushSize={brushSize}
            />
          </>
        ) : (
          <>
            <img
              src={item.asset_url}
              alt="Selected"
              className="w-full h-full object-contain max-h-[80vh]"
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute top-2 right-2 bg-muted size-6 hover:text-muted-foreground"
              onClick={() => setCurrentItem(null)}
            >
              <X />
            </Button>
          </>
        ))}
    </div>
  );

  // Default image rendering with copy prompt functionality
  const getPromptText = () => {
    return item?.input_prompt;
  };

  const renderMedia = () => {
    if (isVideo) {
      return (
        <VideoPlayer
          src={item.asset_url}
          isLiked={item.is_favourite ?? false}
          onLike={handleLike}
          prompt={item.input_prompt}
        />
      );
    }

    if (source === "blanket") {
      return renderPlaceholder();
    }

    if (isRemixEnabled) {
      return (
        <RemixImage
          ref={remixImageRef}
          imageRef={imageRef}
          canvasRef={canvasRef}
          offScreenCanvasRef={offScreenCanvasRef}
          url={item?.asset_url || ""}
          remixHistory={remixHistory}
          brushSize={brushSize}
        />
      );
    }

    return (
      item && (
        <ZoomableImage
          src={item.asset_url}
          key={item.asset_url}
          className="object-contain max-h-[80vh]"
          variant="overlay"
          isLiked={item.is_favourite}
          onLike={handleLike}
          prompt={getPromptText()}
        />
      )
    );
  };

  return (
    <div className="flex-1 p-6 relative flex items-center justify-center min-h-0">
      <div className="w-full h-[80%] flex items-center justify-center">
        {renderMedia()}
      </div>

      <MediaLibraryDialog
        open={galleryPickerOpen}
        onOpenChange={setGalleryPickerOpen}
        onFullMediaItemSelected={(mediaItem) => {
          setCurrentItem(mediaItem);
          setGalleryPickerOpen(false);
        }}
        filters={{
          brands: [selectedBrandId!],
          campaigns: [],
          product_categories: [],
          asset_types: ["image"],
          asset_sources: [],
          media_format: [],
          aspect_ratio: [],
          workflow_status: [],
          moodboards: [],
        }}
        brandId={selectedBrandId!}
        isMultiSelect={false}
        maxSelectionCount={1}
      />
    </div>
  );
};
