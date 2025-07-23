"use client";

import type React from "react";
import { useRef, useState, useEffect, SetStateAction, Dispatch } from "react";
import ZoomableImage from "@/components/ui/zoomable-image";
import type { GalleryItemResponse } from "@/types/gallery.types";
import type { GalleryActions } from "@/hooks/useGallery";
import {
  PlayCircle,
  PauseCircle,
  Heart,
  Copy,
  Expand,
  Check,
} from "lucide-react";
import type { useUndoRedoRemix } from "@/hooks/useUndoRedoRemix";
import RemixImage, {
  type RemixImageHandle,
} from "../../_components/remix/RemixImage";
import { toast } from "sonner";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";

interface AskKittykatImageSectionProps {
  item: GalleryItemResponse;
  galleryActions: GalleryActions;
  isRemixEnabled: boolean;
  imageRef?: React.RefObject<HTMLImageElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  offScreenCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  remixHistory?: ReturnType<typeof useUndoRedoRemix>;
  brushSize?: number;
  remixImageRef?: React.RefObject<RemixImageHandle | null>;
  revalidateGalleryItemVersions: (data: GalleryItemResponse) => Promise<void>;
  setCurrentItem: Dispatch<SetStateAction<GalleryItemResponse | null>>;
}

const VideoPlayer: React.FC<{
  item: GalleryItemResponse;
  galleryActions: GalleryActions;
  src: string;
  isLiked: boolean;
  onLike: () => void;
  setCurrentItem: Dispatch<SetStateAction<GalleryItemResponse | null>>;
  revalidateGalleryItemVersions: (data: GalleryItemResponse) => Promise<void>;
}> = ({
  item,
  src,
  isLiked,
  onLike,
  setCurrentItem,
  revalidateGalleryItemVersions,
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
    // Priority order for text to copy
    const textToCopy =
      item.input_prompt || item.ai_description || "No prompt available";

    if (textToCopy && textToCopy !== "No prompt available") {
      navigator.clipboard
        .writeText(textToCopy)
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

  // Check if there's a prompt available to copy
  const hasPromptToCopy = !!(item.input_prompt || item.ai_description);

  return (
    <div className="relative w-full h-full group overflow-hidden rounded-lg flex items-center justify-center">
      <div className="relative">
        <video
          ref={videoRef}
          src={src}
          className="object-contain w-full h-full cursor-pointer rounded-lg"
          style={{ maxHeight: "80vh" }}
          muted
          autoPlay
          loop
          playsInline
          onClick={togglePlayPause}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 rounded-lg" />
        </div>

        {/* Play/Pause button - Center */}
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer rounded-lg"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <PauseCircle className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          ) : (
            <PlayCircle className="w-16 h-16 text-white opacity-100" />
          )}
        </div>

        {/* Top Right - Expand button */}
        <TooltipIconButton
          onClick={(e) => {
            e.stopPropagation();
            handleFullscreen();
          }}
          tooltip="Expand"
          variant="ghost"
          className="absolute top-2 right-2 size-7 text-white hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Expand />
        </TooltipIconButton>

        {/* Bottom Right - Heart/Like button */}
        <Heart
          onClick={onLike}
          className={`absolute bottom-2 right-2 w-6 h-6 cursor-pointer transition-opacity opacity-0 group-hover:opacity-100 ${
            isLiked ? "text-red-500 fill-red-500" : "text-white"
          }`}
          fill={isLiked ? "red" : "none"}
          stroke={isLiked ? "red" : "white"}
        />

        {/* Bottom Left - Copy button with conditional tooltip */}
        {hasPromptToCopy && (
          <TooltipIconButton
            onClick={(e) => {
              e.stopPropagation();
              handleCopyPrompt();
            }}
            tooltip="Copy prompt"
            variant="ghost"
            className="absolute bottom-2 left-2 size-7 text-white hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? <Check /> : <Copy />}
          </TooltipIconButton>
        )}
      </div>
    </div>
  );
};

export const AskKittykatImageSection: React.FC<
  AskKittykatImageSectionProps
> = ({
  item,
  galleryActions,
  isRemixEnabled,
  imageRef,
  canvasRef,
  offScreenCanvasRef,
  remixHistory,
  brushSize = 20,
  remixImageRef,
  revalidateGalleryItemVersions,
  setCurrentItem,
}) => {
  const isVideo = item.asset_type === "video";

  const renderMedia = () => {
    if (isVideo) {
      return (
        <VideoPlayer
          src={item.asset_url}
          isLiked={item.is_favourite ?? false}
          onLike={() => {
            // This onLike is now handled inside VideoPlayer
          }}
          item={item}
          galleryActions={galleryActions}
          setCurrentItem={setCurrentItem}
          revalidateGalleryItemVersions={revalidateGalleryItemVersions}
        />
      );
    }

    // For images, check if remix is enabled
    if (
      isRemixEnabled &&
      remixHistory &&
      imageRef &&
      canvasRef &&
      offScreenCanvasRef
    ) {
      return (
        <RemixImage
          ref={remixImageRef}
          imageRef={imageRef}
          canvasRef={canvasRef}
          offScreenCanvasRef={offScreenCanvasRef}
          url={item.asset_url}
          remixHistory={remixHistory}
          brushSize={brushSize}
        />
      );
    }

    // Default image rendering with copy prompt functionality
    const getPromptText = () => {
      return item.input_prompt || item.ai_description;
    };

    return (
      <ZoomableImage
        src={item.asset_url}
        key={item.asset_url}
        className="object-contain rounded-lg max-h-[80vh]"
        variant="overlay"
        isLiked={item.is_favourite}
        onLike={() => {
          setCurrentItem((prev) => {
            if (!prev || prev.id !== item.id) return prev;

            const updated = { ...prev, is_favourite: !prev.is_favourite };
            return updated;
          });

          galleryActions.toggleFavorite(item.id, {
            onSuccess: (updatedItem) => {
              setCurrentItem((prev) => {
                if (!prev || prev.id !== updatedItem.id) return prev;
                return { ...prev, is_favourite: updatedItem.is_favourite };
              });

              revalidateGalleryItemVersions(updatedItem);
            },
            onError: () => {
              // Rollback optimistic update
              setCurrentItem((prev) => {
                if (!prev || prev.id !== item.id) return prev;
                return { ...prev, is_favourite: item.is_favourite };
              });
              toast.error("Failed to update favorite status");
            },
          });
        }}
        prompt={getPromptText()}
      />
    );
  };

  return (
    <div className="flex-1 p-6 relative flex items-center justify-center min-h-0">
      <div className="w-full h-[80%] flex items-center justify-center">
        {renderMedia()}
      </div>
    </div>
  );
};
