"use client";

import React, { useRef, useState, useEffect } from "react";
import ZoomableImage from "@/components/ui/zoomable-image";
import { GalleryItemResponse } from "@/types/gallery.types";
import { GalleryActions } from "@/hooks/useGallery";
import { PlayCircle, PauseCircle, Heart, Copy, Expand } from "lucide-react";

import { useUndoRedoRemix } from "@/hooks/useUndoRedoRemix"; // Assuming used in parent
import RemixImage from "../../_components/remix/RemixImage";
import { toast } from "sonner";

interface AskKittykatImageSectionProps {
  item: GalleryItemResponse;
  galleryActions: GalleryActions;
  isRemixEnabled: boolean;
  imageRef?: React.RefObject<HTMLImageElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  offScreenCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  remixHistory?: ReturnType<typeof useUndoRedoRemix>;
  brushSize?: number;
}

const VideoPlayer: React.FC<{
  src: string;
  isLiked: boolean;
  onLike: () => void;
}> = ({ src, isLiked, onLike }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(src);
    toast.success("Video Prompt copied!");
  };

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

        {/* Hover Overlay - now positioned relative to video */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 rounded-lg" />
        </div>

        {/* Center Play/Pause Icon - positioned relative to video */}
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

        {/* Top Right: Fullscreen - positioned relative to video */}
        <Expand
          onClick={handleFullscreen}
          className="absolute top-2 right-2 w-6 h-6 text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        />

        {/* Bottom Right: Like - positioned relative to video */}
        <Heart
          onClick={onLike}
          className={`absolute bottom-2 right-2 w-6 h-6 cursor-pointer transition-opacity opacity-0 group-hover:opacity-100 ${
            isLiked ? "text-red-500 fill-red-500" : "text-white"
          }`}
          fill={isLiked ? "red" : "none"}
          stroke={isLiked ? "red" : "white"}
        />

        {/* Bottom Left: Copy - positioned relative to video */}
        <Copy
          onClick={handleCopy}
          className="absolute bottom-2 left-2 w-6 h-6 text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        />
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
}) => {
  const isVideo = item.asset_type === "video";

  const renderMedia = () => {
    if (isVideo) {
      return (
        <VideoPlayer
          src={item.asset_url}
          isLiked={item.is_favourite ?? false}
          onLike={() => galleryActions.toggleFavorite(item.id)}
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
          imageRef={imageRef}
          canvasRef={canvasRef}
          offScreenCanvasRef={offScreenCanvasRef}
          url={item.asset_url}
          remixHistory={remixHistory}
          brushSize={brushSize}
        />
      );
    }

    // Default image rendering
    return (
      <ZoomableImage
        src={item.asset_url}
        key={item.asset_url}
        className="object-contain rounded-lg max-h-[80vh]"
        variant="overlay"
        isLiked={item.is_favourite}
        onLike={() => galleryActions.toggleFavorite(item.id)}
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
